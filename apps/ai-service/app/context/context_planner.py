import logging
from dataclasses import dataclass, field
from typing import Optional

from app.context.data_sources import (
    ALL_SOURCES,
    DataSourceMap,
    DOTNET_API_HEALTH,
    DOTNET_API_PET,
    DOTNET_API_VACCINE,
    DOTNET_API_WEIGHT,
    NO_DATA,
    POSTGRESQL_FULLTEXT,
    POSTGRESQL_VECTOR,
    SourceType,
)
from app.context.pet_context_service import PetContext, PetContextService
from app.context.query_rewriter import QueryRewriter, RewriteResult, query_rewriter
from app.routing.intents import Intent

logger = logging.getLogger(__name__)


@dataclass
class FetchedSource:
    source_type: SourceType
    data: Optional[dict]
    fetched: bool
    error: Optional[str] = None

    @property
    def is_empty(self) -> bool:
        return self.data is None or (isinstance(self.data, list) and len(self.data) == 0)


@dataclass
class ContextPlan:
    intent: Intent
    sources_needed: list[SourceType]
    pet_context: Optional[PetContext]
    rewrite_result: Optional[RewriteResult]
    fetched_sources: list[FetchedSource] = field(default_factory=list)
    rag_topics: list[str] = field(default_factory=list)
    needs_llm_rewrite: bool = False
    warnings: list[str] = field(default_factory=list)

    def get_source_data(self, source_type: SourceType) -> Optional[dict]:
        for s in self.fetched_sources:
            if s.source_type == source_type:
                return s.data
        return None

    def get_pet_context(self) -> Optional[PetContext]:
        return self.pet_context

    def get_search_query(self) -> str:
        if self.rewrite_result:
            return self.rewrite_result.rewritten
        return ""

    def format_sources_summary(self) -> str:
        lines = [f"Intent: {self.intent.value}"]
        if self.rag_topics:
            lines.append(f"RAG topics: {', '.join(self.rag_topics)}")
        for s in self.fetched_sources:
            status = "OK" if s.fetched and not s.is_empty else "EMPTY" if s.fetched else "FAILED"
            lines.append(f"  - {s.source_type}: {status}")
        return "\n".join(lines)


class ContextPlanner:
    """Orchestrates data-source fetching and query rewriting for an incoming message.

    Flow:
      1. Determine required sources from intent
      2. Fetch pet context from .NET API (if needed)
      3. Rewrite query via hybrid rewriter (template + LLM, only for Layer 2)
      4. Return a ContextPlan with everything needed for downstream processing
    """

    def __init__(
        self,
        pet_service: Optional[PetContextService] = None,
        rewriter: Optional[QueryRewriter] = None,
    ) -> None:
        self._pet_service = pet_service or PetContextService()
        self._rewriter = rewriter or query_rewriter

    async def plan(
        self,
        message: str,
        intent: Intent,
        user_id: str,
        pet_id: Optional[str] = None,
        pet_context: Optional[PetContext] = None,
    ) -> ContextPlan:
        sources_needed = DataSourceMap.get_sources(intent)
        rag_topics = DataSourceMap.rag_filter_topics(intent)
        needs_llm_rewrite = DataSourceMap.is_llm_rewrite_candidate(intent)
        warnings: list[str] = []

        if not pet_context and pet_id and DataSourceMap.needs_pet_context(intent):
            pet_context = await self._fetch_pet_context(intent, user_id, pet_id)

        rewrite_result = self._rewrite_query(intent, pet_context, needs_llm_rewrite, message)
        if rewrite_result.warnings:
            warnings.extend(rewrite_result.warnings)

        if not pet_context and needs_pet_context_from_intent(intent):
            warnings.append("Pet context requested but could not be fetched")

        fetched_sources = await self._fetch_all_sources(
            user_id, pet_id, sources_needed
        )

        for fs in fetched_sources:
            if fs.error:
                warnings.append(f"Failed to fetch {fs.source_type}: {fs.error}")

        plan = ContextPlan(
            intent=intent,
            sources_needed=sources_needed,
            pet_context=pet_context,
            rewrite_result=rewrite_result,
            fetched_sources=fetched_sources,
            rag_topics=rag_topics,
            needs_llm_rewrite=needs_llm_rewrite,
            warnings=warnings,
        )

        logger.info(
            "ContextPlan for intent=%s: sources=%s, rewrite=%s, pet_context=%s",
            intent.value,
            sources_needed,
            rewrite_result.rewrite_method,
            "present" if pet_context else "absent",
        )

        return plan

    async def _fetch_pet_context(
        self,
        intent: Intent,
        user_id: str,
        pet_id: str,
    ) -> Optional[PetContext]:
        sources_map = {
            DOTNET_API_PET: ["pet", "health"],
            DOTNET_API_HEALTH: ["pet", "health"],
            DOTNET_API_VACCINE: ["pet", "health", "vaccine"],
            DOTNET_API_WEIGHT: ["pet", "health", "weight"],
        }
        for source_type, needed in sources_map.items():
            if source_type in DataSourceMap.get_sources(intent):
                return await self._pet_service.fetch_pet_context(
                    pet_id=pet_id,
                    user_id=user_id,
                    sources=needed,
                )
        return await self._pet_service.fetch_pet_context(pet_id=pet_id, user_id=user_id)

    def _rewrite_query(
        self,
        intent: Intent,
        pet_context: Optional[PetContext],
        needs_llm_rewrite: bool,
        message: str,
    ) -> RewriteResult:
        original = message.strip()
        if not needs_llm_rewrite:
            return RewriteResult(
                original=original,
                rewritten=original,
                was_rewritten=False,
                intent=intent,
                confidence=1.0,
                rewrite_method="not_needed",
                warnings=["Intent is not configured for query rewrite"],
            )

        return self._rewriter.rewrite(
            message=original,
            intent=intent,
            pet_context=pet_context or PetContext(),
        )

    async def _fetch_all_sources(
        self,
        user_id: str,
        pet_id: Optional[str],
        sources: list[SourceType],
    ) -> list[FetchedSource]:
        results: list[FetchedSource] = []
        for source_type in sources:
            if source_type == NO_DATA:
                results.append(FetchedSource(
                    source_type=source_type,
                    data=None,
                    fetched=True,
                    error=None,
                ))
                continue

            if source_type in (POSTGRESQL_VECTOR, POSTGRESQL_FULLTEXT):
                results.append(FetchedSource(
                    source_type=source_type,
                    data=None,
                    fetched=False,
                    error=None,
                ))
                continue

            fetched_source = await self._fetch_dotnet_source(
                source_type, user_id, pet_id
            )
            results.append(fetched_source)

        return results

    async def _fetch_dotnet_source(
        self,
        source_type: SourceType,
        user_id: str,
        pet_id: Optional[str],
    ) -> FetchedSource:
        if not pet_id:
            return FetchedSource(
                source_type=source_type,
                data=None,
                fetched=False,
                error="No pet_id provided",
            )

        try:
            if source_type == DOTNET_API_PET:
                data = await self._pet_service._fetch_pet_profile(pet_id, user_id)
                return FetchedSource(source_type=source_type, data=data, fetched=True)
            elif source_type == DOTNET_API_HEALTH:
                health = await self._pet_service._fetch_health_profile(pet_id, user_id)
                pet = await self._pet_service._fetch_pet_profile(pet_id, user_id)
                return FetchedSource(
                    source_type=source_type,
                    data={"health": health, "pet": pet},
                    fetched=True,
                )
            elif source_type == DOTNET_API_VACCINE:
                vaccinations = await self._pet_service._fetch_vaccinations(pet_id, user_id)
                return FetchedSource(
                    source_type=source_type,
                    data=[v.__dict__ for v in vaccinations],
                    fetched=True,
                )
            elif source_type == DOTNET_API_WEIGHT:
                weights = await self._pet_service._fetch_weight_log(pet_id, user_id)
                return FetchedSource(
                    source_type=source_type,
                    data=weights,
                    fetched=True,
                )
            else:
                return FetchedSource(
                    source_type=source_type,
                    data=None,
                    fetched=False,
                    error=f"Unknown source type: {source_type}",
                )
        except Exception as e:
            return FetchedSource(
                source_type=source_type,
                data=None,
                fetched=False,
                error=str(e),
            )


def needs_pet_context_from_intent(intent: Intent) -> bool:
    return intent in (
        Intent.NUTRITION,
        Intent.SYMPTOM,
        Intent.VACCINE,
        Intent.GROOMING,
        Intent.TRAINING,
        Intent.BEHAVIOR,
        Intent.PRODUCT,
        Intent.EMERGENCY,
    )


context_planner = ContextPlanner()
