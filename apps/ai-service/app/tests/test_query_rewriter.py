import unittest
from unittest.mock import MagicMock, patch

from app.context.query_rewriter import (
    QueryRewriter,
    RewriteResult,
    _is_rewrite_candidate,
    _apply_template,
    _detect_language,
    REWRITE_MIN_LENGTH,
)
from app.context.pet_context_service import PetContext
from app.routing.intents import Intent


class PetContextForTest(PetContext):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class TestIsRewriteCandidate(unittest.TestCase):
    def test_short_message_not_candidate(self):
        self.assertFalse(_is_rewrite_candidate("ok"))
        self.assertFalse(_is_rewrite_candidate(""))

    def test_long_message_with_trigger_is_candidate(self):
        msg = "Con mèo của tôi bị nôn. Làm sao để chữa?"
        self.assertTrue(_is_rewrite_candidate(msg))

    def test_vietnamese_trigger_word(self):
        self.assertTrue(_is_rewrite_candidate("Con chó tôi bị sốt bao nhiêu?"))
        self.assertTrue(_is_rewrite_candidate("Làm sao để cho ăn?"))

    def test_english_trigger_word(self):
        self.assertTrue(_is_rewrite_candidate("How much should I feed my dog?"))
        self.assertTrue(_is_rewrite_candidate("Why is my cat vomiting?"))

    def test_long_message_without_trigger_not_candidate(self):
        self.assertFalse(_is_rewrite_candidate("Con mèo"))

    def test_exactly_at_min_length_with_trigger(self):
        msg = "a" * (REWRITE_MIN_LENGTH - 1) + "?"
        self.assertFalse(_is_rewrite_candidate(msg))

    def test_at_min_length_with_trigger(self):
        msg = "a" * REWRITE_MIN_LENGTH + "?"
        self.assertTrue(_is_rewrite_candidate(msg))


class TestDetectLanguage(unittest.TestCase):
    def test_vietnamese_detected(self):
        self.assertEqual(_detect_language("Con mèo của tôi bị bệnh"), "vi")

    def test_english_detected(self):
        self.assertEqual(_detect_language("My dog is sick"), "en")

    def test_mixed_defaults_to_vi(self):
        self.assertEqual(_detect_language("Con cho nay bi gi?"), "vi")

    def test_english_punctuation(self):
        self.assertEqual(_detect_language("How much should I feed? Why?"), "en")


class TestApplyTemplate(unittest.TestCase):
    def setUp(self):
        self.pet_ctx = PetContextForTest(
            pet_id="pet-123",
            pet_name="Buddy",
            species="dog",
            age="2 years",
            age_months=24,
            weight_kg=12.5,
            breed="Golden Retriever",
        )

    def test_nutrition_template_applied(self):
        result = _apply_template(
            "Cho chó ăn gì tốt?",
            Intent.NUTRITION,
            self.pet_ctx,
        )
        self.assertIn("dog", result.lower())
        self.assertNotEqual(result, "Cho chó ăn gì tốt?")

    def test_symptom_template_applied(self):
        result = _apply_template(
            "Con mèo bị nôn",
            Intent.SYMPTOM,
            self.pet_ctx,
        )
        self.assertIn("cat", result.lower())
        self.assertNotEqual(result, "Con mèo bị nôn")

    def test_vaccine_template_applied(self):
        result = _apply_template(
            "Khi nào cần tiêm vaccine?",
            Intent.VACCINE,
            self.pet_ctx,
        )
        self.assertIn("vaccine", result.lower())

    def test_general_intent_returns_original(self):
        result = _apply_template(
            "Chào bạn",
            Intent.GENERAL,
            self.pet_ctx,
        )
        self.assertEqual(result, "Chào bạn")

    def test_billing_intent_returns_original(self):
        result = _apply_template(
            "Giá khám là bao nhiêu?",
            Intent.BILLING,
            self.pet_ctx,
        )
        self.assertEqual(result, "Giá khám là bao nhiêu?")

    def test_missing_pet_context_uses_fallback(self):
        ctx = PetContextForTest()
        result = _apply_template(
            "Con bị nôn",
            Intent.SYMPTOM,
            ctx,
        )
        self.assertIn("pet", result.lower())


class TestQueryRewriterRewrite(unittest.TestCase):
    def setUp(self):
        self.rewriter = QueryRewriter()
        self.pet_ctx = PetContextForTest(
            pet_id="pet-123",
            pet_name="Mimi",
            species="cat",
            age="6 months",
            age_months=6,
            weight_kg=2.5,
        )

    def test_non_candidate_returns_original_unchanged(self):
        result = self.rewriter.rewrite(
            message="ok",
            intent=Intent.GENERAL,
            pet_context=self.pet_ctx,
        )
        self.assertEqual(result.rewritten, "ok")
        self.assertFalse(result.was_rewritten)
        self.assertEqual(result.rewrite_method, "not_needed")
        self.assertEqual(result.confidence, 1.0)

    def test_short_nutrition_query_uses_template(self):
        result = self.rewriter.rewrite(
            message="cho tui an gi",
            intent=Intent.NUTRITION,
            pet_context=self.pet_ctx,
        )

        self.assertTrue(result.was_rewritten)
        self.assertIn("recommended food", result.rewritten)
        self.assertIn("dog", result.rewritten)

    def test_non_llm_candidate_uses_template(self):
        result = self.rewriter.rewrite(
            message="What is the price for grooming?",
            intent=Intent.BILLING,
            pet_context=self.pet_ctx,
        )
        self.assertEqual(result.rewrite_method, "original")
        self.assertEqual(result.rewritten, "What is the price for grooming?")
        self.assertFalse(result.was_rewritten)

    def test_llm_candidate_nutrition(self):
        result = self.rewriter.rewrite(
            message="Con mèo 6 tháng tuổi nên ăn gì?",
            intent=Intent.NUTRITION,
            pet_context=self.pet_ctx,
        )
        self.assertIn(result.rewrite_method, ("llm", "template_fallback"))
        self.assertTrue(result.was_rewritten)
        self.assertIsNotNone(result.rewritten)
        self.assertNotEqual(result.rewritten, "Con mèo 6 tháng tuổi nên ăn gì?")
        self.assertGreater(result.confidence, 0.0)

    def test_llm_candidate_symptom(self):
        result = self.rewriter.rewrite(
            message="My cat is vomiting blood",
            intent=Intent.SYMPTOM,
            pet_context=self.pet_ctx,
        )
        self.assertIn(result.rewrite_method, ("llm", "template_fallback"))
        self.assertTrue(result.was_rewritten)
        self.assertIsNotNone(result.rewritten)
        self.assertNotEqual(result.rewritten, "My cat is vomiting blood")

    def test_result_contains_all_required_fields(self):
        result = self.rewriter.rewrite(
            message="How to train a dog to sit?",
            intent=Intent.TRAINING,
            pet_context=self.pet_ctx,
        )
        self.assertIsInstance(result, RewriteResult)
        self.assertEqual(result.original, "How to train a dog to sit?")
        self.assertIsNotNone(result.rewritten)
        self.assertIsInstance(result.was_rewritten, bool)
        self.assertEqual(result.intent, Intent.TRAINING)
        self.assertGreaterEqual(result.confidence, 0.0)
        self.assertLessEqual(result.confidence, 1.0)
        self.assertIsInstance(result.warnings, list)

    def test_rewrite_method_is_documented(self):
        valid_methods = {
            "not_needed", "original", "template", "template_fallback", "llm"
        }
        for intent in Intent:
            pet_ctx = PetContextForTest(species="dog", age_months=12)
            result = self.rewriter.rewrite(
                message="How much food should I give my dog per day?",
                intent=intent,
                pet_context=pet_ctx,
            )
            self.assertIn(
                result.rewrite_method,
                valid_methods,
                f"Unknown method '{result.rewrite_method}' for intent {intent}",
            )

    def test_confidence_in_valid_range(self):
        test_cases = [
            "What should I feed my dog?",
            "Con mèo 3 tháng bị tiêu chảy phải làm sao?",
            "When to vaccinate my puppy?",
            "Why is my cat aggressive?",
        ]
        for msg in test_cases:
            result = self.rewriter.rewrite(
                message=msg,
                intent=Intent.NUTRITION,
                pet_context=self.pet_ctx,
            )
            self.assertGreaterEqual(
                result.confidence, 0.0,
                f"Confidence too low for: {msg}",
            )
            self.assertLessEqual(
                result.confidence, 1.0,
                f"Confidence too high for: {msg}",
            )

    def test_all_intents_produce_valid_result(self):
        for intent in Intent:
            result = self.rewriter.rewrite(
                message="How much should I feed my pet?",
                intent=intent,
                pet_context=self.pet_ctx,
            )
            self.assertIsInstance(result, RewriteResult)
            self.assertEqual(result.intent, intent)
            self.assertIsNotNone(result.rewritten)
            self.assertIsInstance(result.warnings, list)


class TestQueryRewriterValidation(unittest.TestCase):
    """Validate rewrite output BEFORE using it to search.

    These tests ensure the rewritten query is safe and useful for RAG search.
    """

    def setUp(self):
        self.rewriter = QueryRewriter()
        self.pet_ctx = PetContextForTest(
            pet_id="pet-abc",
            species="dog",
            age_months=24,
            weight_kg=15.0,
        )

    def test_rewritten_query_not_empty(self):
        result = self.rewriter.rewrite(
            message="Con cho cua toi bi non",
            intent=Intent.NUTRITION,
            pet_context=self.pet_ctx,
        )
        self.assertTrue(len(result.rewritten.strip()) > 0)

    def test_rewritten_query_has_reasonable_length(self):
        result = self.rewriter.rewrite(
            message="What should my dog eat for better health?",
            intent=Intent.NUTRITION,
            pet_context=self.pet_ctx,
        )
        self.assertLessEqual(len(result.rewritten), 500)

    def test_original_preserved_in_result(self):
        original = "Con mèo 3 tháng bị ho"
        result = self.rewriter.rewrite(
            message=original,
            intent=Intent.SYMPTOM,
            pet_context=self.pet_ctx,
        )
        self.assertEqual(result.original, original)

    def test_rewritten_query_is_safe_for_search(self):
        dangerous_inputs = [
            "'; DROP TABLE knowledge_chunks; --",
            "<script>alert('xss')</script>",
            "\u0000\u0000",
        ]
        for dangerous in dangerous_inputs:
            result = self.rewriter.rewrite(
                message=dangerous,
                intent=Intent.NUTRITION,
                pet_context=self.pet_ctx,
            )
            self.assertIsNotNone(result.rewritten)
            self.assertLessEqual(len(result.rewritten), 500)

    def test_warnings_list_is_always_populated(self):
        result = self.rewriter.rewrite(
            message="ok",
            intent=Intent.GENERAL,
            pet_context=self.pet_ctx,
        )
        self.assertIsInstance(result.warnings, list)
        self.assertGreater(len(result.warnings), 0)

    def test_llm_raw_response_is_none_when_not_used(self):
        result = self.rewriter.rewrite(
            message="ok",
            intent=Intent.NUTRITION,
            pet_context=self.pet_ctx,
        )
        self.assertIsNone(result.llm_raw_response)


if __name__ == "__main__":
    unittest.main()
