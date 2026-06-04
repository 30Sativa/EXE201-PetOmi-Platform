import unittest

from app.chat.chat_service import (
    _build_pet_medical_answer,
    _build_pet_profile_answer,
    _build_prompt,
    _rewrite_context_for_message,
)
from app.context.pet_context_service import PetContext


class ChatProfileContextTests(unittest.TestCase):
    def test_build_prompt_accepts_direct_pet_context_response(self):
        prompt, sources = _build_prompt(
            intent="general",
            intent_instruction="General",
            user_message="cho tui ten gi",
            pet_profile={
                "petId": "pet-1",
                "name": "Cao",
                "species": "Dog",
                "breed": "Poodle",
                "ageFormatted": "2 years",
            },
            pet_medical=None,
            recent_messages=None,
            rag_chunks=[],
        )

        self.assertIn("- Tên: Cao", prompt)
        self.assertIn("- Loài: Dog", prompt)
        self.assertIn("- Giống: Poodle", prompt)
        self.assertEqual(sources, [])

    def test_pet_name_question_answers_from_profile_context(self):
        answer = _build_pet_profile_answer(
            "chó tui tên gì",
            {
                "petId": "pet-1",
                "name": "Cảo",
                "species": "Dog",
            },
        )

        self.assertIsNotNone(answer)
        self.assertIn("Cảo", answer)

    def test_pet_name_question_answers_from_parallel_fetch_wrapper(self):
        answer = _build_pet_profile_answer(
            "cho tui ten gi",
            {
                "source": "pet_basic_context",
                "success": True,
                "data": {
                    "petId": "pet-1",
                    "name": "Cao",
                    "species": "Dog",
                },
                "error": None,
            },
        )

        self.assertIsNotNone(answer)
        self.assertIn("Cao", answer)

    def test_build_prompt_includes_saved_medical_history(self):
        prompt, sources = _build_prompt(
            intent="symptom",
            intent_instruction="Symptom",
            user_message="tien su benh nhu nao",
            pet_profile={"name": "Bong"},
            pet_medical={
                "healthProfile": {
                    "currentWeightKg": 4.2,
                    "isNeutered": "No",
                    "allergies": "Chicken",
                    "chronicConditions": "Skin allergy",
                },
                "recentWeightLogs": [
                    {"weightKg": 4.2, "measuredAt": "2026-06-01T00:00:00"}
                ],
                "vaccinations": [
                    {
                        "title": "Rabies shot",
                        "recordType": "Vaccine",
                        "recordDate": "2026-05-01",
                    }
                ],
                "medicalRecords": [
                    {
                        "title": "Skin check",
                        "recordType": "Illness",
                        "description": "Itchy skin",
                        "recordDate": "2026-04-10",
                    }
                ],
            },
            recent_messages=None,
            rag_chunks=[],
        )

        self.assertIn("Chicken", prompt)
        self.assertIn("Skin allergy", prompt)
        self.assertIn("Rabies shot", prompt)
        self.assertIn("Skin check", prompt)
        self.assertIn("Tình trạng triệt sản: No", prompt)
        self.assertEqual(sources, [])

    def test_medical_history_question_answers_from_context(self):
        answer = _build_pet_medical_answer(
            "tien su benh nhu nao",
            {"name": "Bong"},
            {
                "healthProfile": {
                    "allergies": "Chicken",
                    "chronicConditions": "Skin allergy",
                },
                "medicalRecords": [
                    {
                        "title": "Skin check",
                        "recordType": "Illness",
                        "description": "Itchy skin",
                        "recordDate": "2026-04-10",
                    }
                ],
            },
        )

        self.assertIsNotNone(answer)
        self.assertIn("Bong", answer)
        self.assertIn("Chicken", answer)
        self.assertIn("Skin check", answer)

    def test_rewrite_context_prefers_explicit_puppy_stage(self):
        ctx = PetContext(species="dog", age="1 year 11 months", age_months=23)
        rewrite_ctx = _rewrite_context_for_message(
            "What vaccines does a puppy need?",
            ctx,
        )

        self.assertEqual(rewrite_ctx.species, "dog")
        self.assertEqual(rewrite_ctx.age, "puppy")
        self.assertIsNone(rewrite_ctx.age_months)

    def test_rewrite_context_drops_profile_age_when_question_has_age(self):
        ctx = PetContext(species="dog", age="1 year 11 months", age_months=23)
        rewrite_ctx = _rewrite_context_for_message(
            "Poodle 11 months feeding amount",
            ctx,
        )

        self.assertEqual(rewrite_ctx.species, "dog")
        self.assertIsNone(rewrite_ctx.age)
        self.assertIsNone(rewrite_ctx.age_months)

    def test_rewrite_context_drops_profile_breed(self):
        ctx = PetContext(
            species="dog",
            breed="British Shorthair",
            age="1 year 11 months",
            age_months=23,
        )
        rewrite_ctx = _rewrite_context_for_message(
            "My pet is vomiting",
            ctx,
        )

        self.assertEqual(rewrite_ctx.species, "dog")
        self.assertEqual(rewrite_ctx.age_months, 23)
        self.assertIsNone(rewrite_ctx.breed)


if __name__ == "__main__":
    unittest.main()
