from enum import Enum
from typing import Optional


class Intent(str, Enum):
    GENERAL = "general"
    NUTRITION = "nutrition"
    SYMPTOM = "symptom"
    VACCINE = "vaccine"
    EMERGENCY = "emergency"
    APPOINTMENT = "appointment"
    BILLING = "billing"
    GROOMING = "grooming"
    TRAINING = "training"
    BEHAVIOR = "behavior"
    PRODUCT = "product"

    def __str__(self) -> str:
        return self.value

    @property
    def display_name(self) -> str:
        names = {
            Intent.GENERAL: "General Inquiry",
            Intent.NUTRITION: "Pet Nutrition",
            Intent.SYMPTOM: "Medical Symptom Assessment",
            Intent.VACCINE: "Vaccination",
            Intent.EMERGENCY: "Emergency Care",
            Intent.APPOINTMENT: "Appointment Scheduling",
            Intent.BILLING: "Billing & Payment",
            Intent.GROOMING: "Grooming & Hygiene",
            Intent.TRAINING: "Pet Training",
            Intent.BEHAVIOR: "Pet Behavior & Emotions",
            Intent.PRODUCT: "Pet Products & Supplies",
        }
        return names.get(self, self.value.title())

    @classmethod
    def all_values(cls) -> list[str]:
        return [e.value for e in cls]


class UrgencyLevel(str, Enum):
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

    def __str__(self) -> str:
        return self.value


class RoutingSource(str, Enum):
    RULE_BASED = "rule_based"
    LLM_FALLBACK = "llm_fallback"
    DEFAULT = "default"


class IntentRegistry:
    @staticmethod
    def is_medical_urgent(intent: Intent) -> bool:
        return intent in (
            Intent.EMERGENCY,
            Intent.SYMPTOM,
        )

    @staticmethod
    def is_scheduling(intent: Intent) -> bool:
        return intent in (
            Intent.APPOINTMENT,
            Intent.VACCINE,
        )

    @staticmethod
    def default_urgency(intent: Intent) -> UrgencyLevel:
        defaults = {
            Intent.EMERGENCY: UrgencyLevel.CRITICAL,
            Intent.SYMPTOM: UrgencyLevel.HIGH,
            Intent.NUTRITION: UrgencyLevel.NORMAL,
            Intent.VACCINE: UrgencyLevel.NORMAL,
            Intent.APPOINTMENT: UrgencyLevel.NORMAL,
            Intent.BILLING: UrgencyLevel.NORMAL,
            Intent.GROOMING: UrgencyLevel.NORMAL,
            Intent.TRAINING: UrgencyLevel.NORMAL,
            Intent.BEHAVIOR: UrgencyLevel.NORMAL,
            Intent.PRODUCT: UrgencyLevel.NORMAL,
            Intent.GENERAL: UrgencyLevel.NORMAL,
        }
        return defaults.get(intent, UrgencyLevel.NORMAL)

    @staticmethod
    def is_emergency_keywords(message: str) -> bool:
        emergency_terms = {
            "khẩn cấp", "cấp cứu", "emergency", "urgent",
            "can't breathe", "khó thở", "choking", "ngạt",
            "seizure", "co giật", "convulsion",
            "unconscious", "ngất", "fainted",
            "poisoned", "ngộ độc", "toxic", "chất độc",
            "severe bleeding", "chảy máu nhiều",
            "dying", "chết", "sắp chết",
        }
        msg_lower = message.lower()
        return any(term in msg_lower for term in emergency_terms)
