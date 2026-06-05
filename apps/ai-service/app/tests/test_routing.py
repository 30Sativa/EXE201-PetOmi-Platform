import unittest

from app.routing import HybridRouter, RoutingContext
from app.routing.intents import Intent, RoutingSource, UrgencyLevel


class HybridRouterRuleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.router = HybridRouter()

    def test_clear_scheduling_message_uses_rule_based_router(self) -> None:
        result = self.router.route_only_rules(
            RoutingContext(
                message=(
                    "\u0054\u00f4\u0069 \u006d\u0075\u1ed1\u006e "
                    "\u0111\u1eb7\u0074 \u006c\u1ecb\u0063\u0068 "
                    "\u006b\u0068\u00e1\u006d \u0063\u0068\u006f "
                    "\u0063\u0068\u00f3 \u006e\u0067\u00e0\u0079 "
                    "\u006d\u0061\u0069"
                )
            )
        )

        self.assertIsNotNone(result)
        self.assertEqual(Intent.APPOINTMENT, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_critical_vietnamese_medical_message_stays_in_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(
                message=(
                    "\u0043\u0068\u00f3 \u0063\u1ee7\u0061 "
                    "\u0074\u00f4\u0069 \u006b\u0068\u00f3 "
                    "\u0074\u0068\u1edf \u0076\u00e0 \u0063\u006f "
                    "\u0067\u0069\u1ead\u0074"
                )
            )
        )

        self.assertEqual(Intent.EMERGENCY, result.intent)
        self.assertEqual(UrgencyLevel.CRITICAL, result.urgency_level)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_clear_billing_message_uses_rule_based_router(self) -> None:
        result = self.router.route_only_rules(
            RoutingContext(message="How much does vaccination cost?")
        )

        self.assertIsNotNone(result)
        self.assertEqual(Intent.BILLING, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)

    def test_clear_puppy_vaccine_question_uses_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(message="What vaccines does a puppy need and when?")
        )

        self.assertEqual(Intent.VACCINE, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_clear_vomiting_monitor_question_uses_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(
                message=(
                    "My dog is not eating and has been vomiting since morning. "
                    "What signs should I monitor?"
                )
            )
        )

        self.assertEqual(Intent.SYMPTOM, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_clear_dog_feeding_amount_question_uses_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(message="How much should an 11 month old Poodle eat per day?")
        )

        self.assertEqual(Intent.NUTRITION, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_clear_kitten_meals_question_uses_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(message="What should I feed a kitten and how many meals per day?")
        )

        self.assertEqual(Intent.NUTRITION, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_vietnamese_puppy_vaccine_question_uses_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(message="Lịch tiêm phòng cơ bản cho chó con gồm những mũi nào?")
        )

        self.assertEqual(Intent.VACCINE, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_vietnamese_poodle_portion_question_uses_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(message="Poodle 11 tháng nên ăn khẩu phần như thế nào cho hợp lý?")
        )

        self.assertEqual(Intent.NUTRITION, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)

    def test_vietnamese_vomiting_monitor_question_uses_rule_based_router(self) -> None:
        result = self.router.route(
            RoutingContext(message="Bé bỏ ăn và nôn từ sáng, mình nên theo dõi dấu hiệu nào?")
        )

        self.assertEqual(Intent.SYMPTOM, result.intent)
        self.assertEqual(RoutingSource.RULE_BASED, result.routing_source)
        self.assertGreaterEqual(result.confidence, 0.70)


if __name__ == "__main__":
    unittest.main()
