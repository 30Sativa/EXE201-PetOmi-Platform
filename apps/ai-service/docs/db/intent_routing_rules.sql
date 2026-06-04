-- ============================================
-- INTENT ROUTING CONFIG SEED
-- ============================================
-- Database: PostgreSQL 15+
-- Purpose : Runtime metadata for Hybrid Router + LLM classifier prompt seed.
-- Phase 2 : Python AI Service - Hybrid Router
--
-- Important architecture note:
-- - Rule keyword/regex matching is owned by Python code in:
--   app/routing/rule_based_router.py
-- - This file must not create a second DB-owned source of truth for those
--   rules unless the Python service also adds a repository/cache loader.
-- - The existing schema already provides ai_configs and prompt_templates.
-- ============================================

-- ============================================
-- INTENT ROUTING METADATA
-- Stores non-keyword routing metadata used by downstream RAG/context logic.
-- ============================================

INSERT INTO ai_configs
    (config_key, config_value, description, version, is_active, updated_at, updated_by)
VALUES
    (
        'intent_routing',
        '{
            "version": 2,
            "rule_source": "app/routing/rule_based_router.py",
            "llm_classifier": {
                "model": "gpt-4o-mini",
                "confidence_threshold": 0.70,
                "fallback_threshold": 0.60,
                "temperature": 0.0,
                "max_tokens": 256
            },
            "intents": {
                "appointment": {
                    "display_name": "Appointment Scheduling",
                    "required_fields": [],
                    "rag_filter": {"topic": "appointment"},
                    "default_urgency_level": "normal"
                },
                "nutrition": {
                    "display_name": "Pet Nutrition",
                    "required_fields": ["species", "age"],
                    "rag_filter": {"topic": "nutrition"},
                    "default_urgency_level": "normal"
                },
                "symptom": {
                    "display_name": "Medical Symptom Assessment",
                    "required_fields": ["species", "age", "weight"],
                    "rag_filter": {"topic": "symptom"},
                    "default_urgency_level": "high"
                },
                "vaccine": {
                    "display_name": "Vaccination",
                    "required_fields": ["age"],
                    "rag_filter": {"topic": "vaccine"},
                    "default_urgency_level": "normal"
                },
                "emergency": {
                    "display_name": "Emergency Care",
                    "required_fields": [],
                    "rag_filter": {"topic": "emergency"},
                    "default_urgency_level": "critical",
                    "always_recommend_vet": true
                },
                "billing": {
                    "display_name": "Billing & Payment",
                    "required_fields": [],
                    "rag_filter": {"topic": "billing"},
                    "default_urgency_level": "normal"
                },
                "grooming": {
                    "display_name": "Grooming & Hygiene",
                    "required_fields": ["species"],
                    "rag_filter": {"topic": "grooming"},
                    "default_urgency_level": "normal"
                },
                "training": {
                    "display_name": "Pet Training",
                    "required_fields": ["species", "age"],
                    "rag_filter": {"topic": "training"},
                    "default_urgency_level": "normal"
                },
                "behavior": {
                    "display_name": "Pet Behavior & Emotions",
                    "required_fields": ["species", "age"],
                    "rag_filter": {"topic": "behavior"},
                    "default_urgency_level": "normal"
                },
                "product": {
                    "display_name": "Pet Products & Supplies",
                    "required_fields": [],
                    "rag_filter": {"topic": "product"},
                    "default_urgency_level": "normal"
                },
                "general": {
                    "display_name": "General Inquiry",
                    "required_fields": [],
                    "rag_filter": {},
                    "default_urgency_level": "normal"
                }
            }
        }'::jsonb,
        'Hybrid router metadata only. Keyword and regex classification stays in Python code until a DB-backed rule loader is implemented.',
        2,
        true,
        now(),
        'system'
    )
ON CONFLICT (config_key) DO UPDATE
SET
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    is_active = EXCLUDED.is_active,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;

-- ============================================
-- LLM CLASSIFIER PROMPT TEMPLATE
-- Uses the existing prompt_templates table from the main AI schema.
-- ============================================

INSERT INTO prompt_templates
    (template_key, template_text, variables, version, is_active, created_at)
VALUES
    (
        'intent_classification',
        'You are an expert pet care intent classifier for the PetOmi platform.
You must classify Vietnamese or English user messages.

Classify the user message into exactly one intent:
- appointment: vet appointment scheduling, booking time slots, dat lich kham, hen gio
- nutrition: food, diet, feeding, vitamins, supplements, dinh duong, thuc an, cho an
- symptom: health symptoms, disease concerns, treatment questions, trieu chung, benh, dau, sot, non, bo an
- vaccine: vaccination schedules, immunization, booster shots, tiem phong, vac xin, lich tiem
- emergency: life-threatening symptoms, poisoning, seizures, choking, difficulty breathing, khan cap, cap cuu, ngo doc, co giat, kho tho
- billing: prices, costs, payments, insurance, refunds, promotions, gia ca, chi phi, thanh toan, hoa don
- grooming: bathing, fur care, nail trimming, ear cleaning, hygiene, tam, chai long, cat mong, ve sinh
- training: obedience training, commands, behavior correction, tricks, huan luyen, day lenh
- behavior: emotional issues, body language, social or behavioral problems, hanh vi, cam xuc, ngon ngu co the
- product: pet supplies, toys, equipment, product recommendations, san pham, do dung, thiet bi
- general: greetings, small talk, platform/meta questions, chao hoi, tro chuyen chung

User message:
{message}

Context:
- Pet type: {pet_type}
- Language: {language}

Rules:
- Life-threatening symptoms must be emergency with critical urgency.
- Non-critical health symptoms should be symptom with high urgency.
- Pure greetings or unclear small talk should be general with normal urgency.
- Reply with intent labels in English exactly as listed above.
- The reasoning can be brief and may use the same language as the user.
- Return valid JSON only.

JSON shape:
{
  "intent": "appointment|nutrition|symptom|vaccine|emergency|billing|grooming|training|behavior|product|general",
  "confidence": 0.0,
  "urgency_level": "critical|high|normal",
  "reasoning": "brief reason"
}'::text,
        '["message", "pet_type", "language"]'::jsonb,
        2,
        true,
        now()
    )
ON CONFLICT (template_key) DO UPDATE
SET
    template_text = EXCLUDED.template_text,
    variables = EXCLUDED.variables,
    version = EXCLUDED.version,
    is_active = EXCLUDED.is_active;

-- ============================================
-- OPTIONAL CHECKS
-- ============================================
-- SELECT config_key, version, is_active
-- FROM ai_configs
-- WHERE config_key = 'intent_routing';
--
-- SELECT template_key, version, is_active
-- FROM prompt_templates
-- WHERE template_key = 'intent_classification';
