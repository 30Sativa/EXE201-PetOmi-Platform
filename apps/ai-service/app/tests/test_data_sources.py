import unittest

from app.context.data_sources import (
    DataSourceMap,
    DOTNET_API_HEALTH,
    DOTNET_API_PET,
    DOTNET_API_VACCINE,
    DOTNET_API_WEIGHT,
    NO_DATA,
    POSTGRESQL_FULLTEXT,
    POSTGRESQL_VECTOR,
)
from app.routing.intents import Intent


class TestDataSourceMap(unittest.TestCase):
    def test_nutrition_sources(self):
        sources = DataSourceMap.get_sources(Intent.NUTRITION)
        self.assertIn(DOTNET_API_PET, sources)
        self.assertIn(POSTGRESQL_VECTOR, sources)

    def test_symptom_sources(self):
        sources = DataSourceMap.get_sources(Intent.SYMPTOM)
        self.assertIn(DOTNET_API_HEALTH, sources)
        self.assertIn(DOTNET_API_WEIGHT, sources)
        self.assertIn(POSTGRESQL_VECTOR, sources)

    def test_vaccine_sources(self):
        sources = DataSourceMap.get_sources(Intent.VACCINE)
        self.assertIn(DOTNET_API_PET, sources)
        self.assertIn(DOTNET_API_VACCINE, sources)
        self.assertIn(POSTGRESQL_VECTOR, sources)

    def test_appointment_sources(self):
        sources = DataSourceMap.get_sources(Intent.APPOINTMENT)
        self.assertIn(DOTNET_API_PET, sources)
        self.assertIn(NO_DATA, sources)

    def test_billing_sources(self):
        sources = DataSourceMap.get_sources(Intent.BILLING)
        self.assertEqual(sources, [NO_DATA])

    def test_general_sources(self):
        sources = DataSourceMap.get_sources(Intent.GENERAL)
        self.assertIn(POSTGRESQL_FULLTEXT, sources)

    def test_emergency_sources(self):
        sources = DataSourceMap.get_sources(Intent.EMERGENCY)
        self.assertIn(DOTNET_API_PET, sources)
        self.assertIn(POSTGRESQL_VECTOR, sources)

    def test_all_intents_have_mapping(self):
        for intent in Intent:
            sources = DataSourceMap.get_sources(intent)
            self.assertIsInstance(sources, list)
            self.assertGreater(len(sources), 0)

    def test_needs_pet_context(self):
        needs = [
            Intent.NUTRITION,
            Intent.SYMPTOM,
            Intent.VACCINE,
            Intent.GROOMING,
            Intent.TRAINING,
            Intent.BEHAVIOR,
            Intent.PRODUCT,
            Intent.EMERGENCY,
        ]
        for intent in needs:
            self.assertTrue(
                DataSourceMap.needs_pet_context(intent),
                f"{intent} should need pet context",
            )

    def test_general_does_not_need_pet_context(self):
        self.assertFalse(DataSourceMap.needs_pet_context(Intent.GENERAL))
        self.assertFalse(DataSourceMap.needs_pet_context(Intent.BILLING))

    def test_needs_rag(self):
        rag_intents = [
            Intent.NUTRITION,
            Intent.SYMPTOM,
            Intent.VACCINE,
            Intent.GROOMING,
            Intent.TRAINING,
            Intent.BEHAVIOR,
            Intent.PRODUCT,
            Intent.EMERGENCY,
            Intent.GENERAL,
        ]
        for intent in rag_intents:
            self.assertTrue(
                DataSourceMap.needs_rag(intent),
                f"{intent} should need RAG",
            )

    def test_billing_does_not_need_rag(self):
        self.assertFalse(DataSourceMap.needs_rag(Intent.BILLING))

    def test_is_llm_rewrite_candidate(self):
        candidates = [
            Intent.NUTRITION,
            Intent.SYMPTOM,
            Intent.VACCINE,
            Intent.BEHAVIOR,
            Intent.TRAINING,
        ]
        for intent in candidates:
            self.assertTrue(
                DataSourceMap.is_llm_rewrite_candidate(intent),
                f"{intent} should be LLM rewrite candidate",
            )

    def test_not_llm_rewrite_candidate(self):
        non_candidates = [
            Intent.BILLING,
            Intent.GENERAL,
            Intent.APPOINTMENT,
            Intent.EMERGENCY,
            Intent.GROOMING,
            Intent.PRODUCT,
        ]
        for intent in non_candidates:
            self.assertFalse(
                DataSourceMap.is_llm_rewrite_candidate(intent),
                f"{intent} should NOT be LLM rewrite candidate",
            )

    def test_rag_filter_topics(self):
        topics = DataSourceMap.rag_filter_topics(Intent.NUTRITION)
        self.assertEqual(topics, [])

        topics = DataSourceMap.rag_filter_topics(Intent.SYMPTOM)
        self.assertEqual(topics, [])

        topics = DataSourceMap.rag_filter_topics(Intent.VACCINE)
        self.assertEqual(topics, [])

    def test_rag_filter_topics_general_empty(self):
        topics = DataSourceMap.rag_filter_topics(Intent.GENERAL)
        self.assertEqual(topics, [])

    def test_needs_dotnet_api(self):
        needs_dotnet = [
            Intent.NUTRITION,
            Intent.SYMPTOM,
            Intent.VACCINE,
            Intent.APPOINTMENT,
            Intent.EMERGENCY,
            Intent.GROOMING,
            Intent.TRAINING,
            Intent.BEHAVIOR,
            Intent.PRODUCT,
        ]
        for intent in needs_dotnet:
            self.assertTrue(
                DataSourceMap.needs_dotnet_api(intent),
                f"{intent} should need .NET API",
            )

    def test_billing_does_not_need_dotnet_api(self):
        self.assertFalse(DataSourceMap.needs_dotnet_api(Intent.BILLING))
        self.assertFalse(DataSourceMap.needs_dotnet_api(Intent.GENERAL))


if __name__ == "__main__":
    unittest.main()
