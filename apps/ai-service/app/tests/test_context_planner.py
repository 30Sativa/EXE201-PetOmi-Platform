import unittest

from app.context.context_planner import ContextPlanner
from app.context.data_sources import (
    DOTNET_API_PET,
    NO_DATA,
    POSTGRESQL_VECTOR,
)
from app.context.pet_context_service import PetContext
from app.context.query_rewriter import RewriteResult
from app.routing.intents import Intent


class FakePetService:
    def __init__(self):
        self.fetch_pet_context_calls = []

    async def fetch_pet_context(self, pet_id, user_id, sources=None):
        self.fetch_pet_context_calls.append({
            "pet_id": pet_id,
            "user_id": user_id,
            "sources": sources,
        })
        return PetContext(
            pet_id=pet_id,
            species="dog",
            age="2 years",
            age_months=24,
            weight_kg=12.0,
        )

    async def _fetch_pet_profile(self, pet_id, user_id):
        return {"id": pet_id, "species": "dog", "dateOfBirth": "2024-01-01T00:00:00Z"}

    async def _fetch_health_profile(self, pet_id, user_id):
        return {"currentWeightKg": 12.0}

    async def _fetch_vaccinations(self, pet_id, user_id):
        return []

    async def _fetch_weight_log(self, pet_id, user_id):
        return []


class FakeRewriter:
    def __init__(self):
        self.calls = []

    def rewrite(self, message, intent, pet_context):
        self.calls.append({
            "message": message,
            "intent": intent,
            "pet_context": pet_context,
        })
        return RewriteResult(
            original=message,
            rewritten="optimized dog nutrition search query",
            was_rewritten=True,
            intent=intent,
            confidence=0.9,
            rewrite_method="template_fallback",
        )


class ExplodingRewriter:
    def rewrite(self, message, intent, pet_context):
        raise AssertionError("rewrite should not be called for this intent")


class TestContextPlanner(unittest.IsolatedAsyncioTestCase):
    async def test_plan_maps_sources_fetches_pet_context_and_rewrites(self):
        pet_service = FakePetService()
        rewriter = FakeRewriter()
        planner = ContextPlanner(pet_service=pet_service, rewriter=rewriter)

        plan = await planner.plan(
            message="What should my dog eat every day?",
            intent=Intent.NUTRITION,
            user_id="user-1",
            pet_id="pet-1",
        )

        self.assertEqual(plan.sources_needed, [DOTNET_API_PET, POSTGRESQL_VECTOR])
        self.assertEqual(plan.pet_context.species, "dog")
        self.assertEqual(plan.rewrite_result.rewritten, "optimized dog nutrition search query")
        self.assertTrue(plan.needs_llm_rewrite)
        self.assertEqual(len(rewriter.calls), 1)
        self.assertEqual(
            pet_service.fetch_pet_context_calls[0]["sources"],
            ["pet", "health"],
        )

    async def test_plan_does_not_rewrite_when_intent_is_not_configured_for_rewrite(self):
        planner = ContextPlanner(
            pet_service=FakePetService(),
            rewriter=ExplodingRewriter(),
        )

        plan = await planner.plan(
            message="How much does this cost?",
            intent=Intent.BILLING,
            user_id="user-1",
        )

        self.assertEqual(plan.sources_needed, [NO_DATA])
        self.assertEqual(plan.rewrite_result.rewritten, "How much does this cost?")
        self.assertFalse(plan.rewrite_result.was_rewritten)
        self.assertFalse(plan.needs_llm_rewrite)


if __name__ == "__main__":
    unittest.main()
