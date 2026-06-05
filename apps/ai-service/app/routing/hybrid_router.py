import logging
from typing import Optional

from app.routing.intents import Intent, UrgencyLevel
from app.routing.models import RoutingResult, RoutingContext, RoutingSource
from app.routing.rule_based_router import RuleBasedRouter
from app.routing.llm_classifier import LlmIntentClassifier

logger = logging.getLogger(__name__)

DEFAULT_CONFIDENCE_THRESHOLD = 0.70
DEFAULT_FALLBACK_THRESHOLD = 0.60


class HybridRouter:
    def __init__(
        self,
        confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
        fallback_threshold: float = DEFAULT_FALLBACK_THRESHOLD,
        rule_router: Optional[RuleBasedRouter] = None,
        llm_classifier: Optional[LlmIntentClassifier] = None,
    ) -> None:
        self.confidence_threshold = confidence_threshold
        self.fallback_threshold = fallback_threshold
        self._rule_router = rule_router or RuleBasedRouter()
        self._llm_classifier = llm_classifier or LlmIntentClassifier()

    def route(self, context: RoutingContext) -> RoutingResult:
        rule_result = self._rule_router.route(context)

        if rule_result is not None and rule_result.is_confident():
            logger.info(
                "HybridRouter: Tầng 1 (rule-based) matched intent=%s confidence=%.2f",
                rule_result.intent.value,
                rule_result.confidence,
            )
            return rule_result

        if rule_result is not None and rule_result.confidence >= self.fallback_threshold:
            logger.info(
                "HybridRouter: Tầng 1 weak match (%.2f) - escalating to Tầng 2 (LLM)",
                rule_result.confidence,
            )
            llm_result = self._llm_classifier.classify(context)

            if llm_result is not None and llm_result.confidence > rule_result.confidence:
                logger.info(
                    "HybridRouter: Tầng 2 (LLM) override intent=%s confidence=%.2f",
                    llm_result.intent.value,
                    llm_result.confidence,
                )
                return llm_result

            logger.info(
                "HybridRouter: Tầng 1 result kept (confidence >= LLM): intent=%s",
                rule_result.intent.value,
            )
            return rule_result

        if rule_result is not None:
            logger.info(
                "HybridRouter: Tầng 1 low confidence (%.2f) - escalating to Tầng 2 (LLM)",
                rule_result.confidence,
            )
        else:
            logger.info(
                "HybridRouter: Tầng 1 no match - escalating to Tầng 2 (LLM)"
            )

        llm_result = self._llm_classifier.classify(context)

        if llm_result is not None and llm_result.is_confident():
            logger.info(
                "HybridRouter: Tầng 2 (LLM) matched intent=%s confidence=%.2f",
                llm_result.intent.value,
                llm_result.confidence,
            )
            return llm_result

        logger.warning(
            "HybridRouter: Tầng 2 low confidence (%.2f) - falling back to general",
            llm_result.confidence if llm_result else 0.0,
        )
        return RoutingResult(
            intent=Intent.GENERAL,
            confidence=0.3,
            urgency_level=UrgencyLevel.NORMAL,
            routing_source=RoutingSource.DEFAULT,
            reasoning="Both Tầng 1 and Tầng 2 returned low confidence - defaulting to general",
            matched_keywords=[],
        )

    def route_only_rules(self, context: RoutingContext) -> Optional[RoutingResult]:
        return self._rule_router.route(context)

    def route_only_llm(self, context: RoutingContext) -> Optional[RoutingResult]:
        return self._llm_classifier.classify(context)
