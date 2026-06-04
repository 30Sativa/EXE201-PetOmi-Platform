-- ============================================
-- PHASE 3 - CONTEXT PLANNING: INTENT → DATA SOURCES
-- ============================================
-- Database: PostgreSQL 15+ with pgvector extension
-- Purpose : Seed intent → data-source mapping into ai_configs table.
--           This is the runtime config used by the Python context planner
--           to determine which data sources (RAG, .NET API, etc.) to fetch
--           for each intent BEFORE calling the LLM.
--
-- Phase 3  : Python AI Service - Context Planning
-- Requires : ai_configs table from main PetAdvisor schema
-- ============================================

INSERT INTO ai_configs
    (config_key, config_value, description, version, is_active, updated_at, updated_by)
VALUES
    (
        'intent_data_sources',
        '{
            "version": 1,
            "description": "Maps each intent to ordered list of data sources needed for answering",
            "intents": {
                "general": {
                    "display_name": "General Inquiry",
                    "sources": ["postgresql_fulltext"],
                    "rag_filter": {},
                    "needs_pet_context": false,
                    "needs_llm_rewrite": false,
                    "rag_topics": []
                },
                "nutrition": {
                    "display_name": "Pet Nutrition",
                    "sources": ["dotnet_api_pet", "postgresql_vector"],
                    "rag_filter": {"topic": "nutrition"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": true,
                    "rag_topics": ["nutrition", "food", "diet", "feeding"]
                },
                "symptom": {
                    "display_name": "Medical Symptom Assessment",
                    "sources": ["dotnet_api_pet_health", "dotnet_api_pet_weight", "postgresql_vector"],
                    "rag_filter": {"topic": "symptom"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": true,
                    "rag_topics": ["symptom", "health", "disease", "treatment"]
                },
                "vaccine": {
                    "display_name": "Vaccination",
                    "sources": ["dotnet_api_pet", "dotnet_api_pet_vaccine", "postgresql_vector"],
                    "rag_filter": {"topic": "vaccine"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": true,
                    "rag_topics": ["vaccine", "vaccination", "immunization"]
                },
                "appointment": {
                    "display_name": "Appointment Scheduling",
                    "sources": ["dotnet_api_pet", "no_data"],
                    "rag_filter": {},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": false,
                    "rag_topics": []
                },
                "emergency": {
                    "display_name": "Emergency Care",
                    "sources": ["dotnet_api_pet", "postgresql_vector"],
                    "rag_filter": {"topic": "emergency"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": false,
                    "rag_topics": ["emergency", "first_aid", "poisoning"]
                },
                "billing": {
                    "display_name": "Billing & Payment",
                    "sources": ["no_data"],
                    "rag_filter": {},
                    "needs_pet_context": false,
                    "needs_llm_rewrite": false,
                    "rag_topics": []
                },
                "grooming": {
                    "display_name": "Grooming & Hygiene",
                    "sources": ["dotnet_api_pet", "postgresql_vector"],
                    "rag_filter": {"topic": "grooming"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": false,
                    "rag_topics": ["grooming", "hygiene", "bathing", "coat"]
                },
                "training": {
                    "display_name": "Pet Training",
                    "sources": ["dotnet_api_pet", "postgresql_vector"],
                    "rag_filter": {"topic": "training"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": true,
                    "rag_topics": ["training", "obedience", "commands"]
                },
                "behavior": {
                    "display_name": "Pet Behavior & Emotions",
                    "sources": ["dotnet_api_pet", "postgresql_vector"],
                    "rag_filter": {"topic": "behavior"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": true,
                    "rag_topics": ["behavior", "emotion", "body_language"]
                },
                "product": {
                    "display_name": "Pet Products & Supplies",
                    "sources": ["dotnet_api_pet", "postgresql_vector"],
                    "rag_filter": {"topic": "product"},
                    "needs_pet_context": true,
                    "needs_llm_rewrite": false,
                    "rag_topics": ["product", "supplies", "equipment"]
                }
            },
            "source_types": {
                "dotnet_api_pet": {
                    "description": "Pet profile (species, breed, age) from .NET Core API",
                    "endpoint": "/api/pets/{petId}",
                    "priority": 1
                },
                "dotnet_api_pet_health": {
                    "description": "Pet health profile (weight, conditions) from .NET Core API",
                    "endpoint": "/api/pets/{petId}/health",
                    "priority": 1
                },
                "dotnet_api_pet_vaccine": {
                    "description": "Pet vaccination records from .NET Core API",
                    "endpoint": "/api/pets/{petId}/vaccines",
                    "priority": 2
                },
                "dotnet_api_pet_medical_record": {
                    "description": "Pet medical history from .NET Core API",
                    "endpoint": "/api/pets/{petId}/medical-records",
                    "priority": 2
                },
                "dotnet_api_pet_weight": {
                    "description": "Pet weight log from .NET Core API",
                    "endpoint": "/api/pets/{petId}/weights",
                    "priority": 2
                },
                "postgresql_vector": {
                    "description": "RAG vector search over knowledge_chunks in PostgreSQL",
                    "table": "knowledge_chunks",
                    "priority": 3
                },
                "postgresql_fulltext": {
                    "description": "Full-text search over knowledge_chunks in PostgreSQL",
                    "table": "knowledge_chunks",
                    "priority": 3
                },
                "no_data": {
                    "description": "No external data needed - answer from general knowledge only",
                    "priority": 99
                }
            }
        }'::jsonb,
        'Phase 3: Intent to data-source mapping for context planning. Loaded by Python context planner at startup.',
        1,
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
-- INTENT RAG TOPICS SEED
-- Seeds rag_filter metadata into knowledge_sources.metadata for each topic.
-- This enables the match_chunks RPC function to filter by topic.
-- Run after knowledge ingestion to tag chunks with appropriate topics.
-- ============================================

INSERT INTO prompt_templates
    (template_key, template_text, variables, version, is_active, created_at)
VALUES
    (
        'query_rewrite_vi',
        'Bạn là chuyên gia viết lại câu hỏi (query rewriting) cho hệ thống RAG chăm sóc thú cưng PetOmi.

Nhiệm vụ: Chuyển câu hỏi tự nhiên của người dùng thành câu hỏi tìm kiếm tối ưu cho vector database.

QUY TẮC:
1. Gộp THÔNG TIN PET (species, age, weight) vào câu hỏi nếu có
2. THÊM context tiếng Anh vì vector model dùng English embeddings
3. GIỮ NGUYÊN ý nghĩa câu hỏi, chỉ bổ sung từ khóa tìm kiếm
4. Trả lời đúng format JSON:
{"rewritten_query": "...", "added_context": "...", "search_terms": ["...", "..."], "confidence": 0.0-1.0}

VÍ DỤ:
Input: "Con mèo tôi 3 tháng bị nôn"
Output: {"rewritten_query": "Vomiting in 3-month-old kitten causes and treatment", "added_context": "kitten 3 months old cat", "search_terms": ["vomiting kitten", "cat 3 months", "feline vomiting causes"], "confidence": 0.95}

Input: "Cho chó ăn gì tốt"
Output: {"rewritten_query": "Best dog food nutrition recommendations by age and weight", "added_context": "dog all ages", "search_terms": ["dog nutrition", "best dog food", "canine diet"], "confidence": 0.88}'::text,
        '["original_query", "pet_context", "template_result", "language"]'::jsonb,
        1,
        true,
        now()
    )
ON CONFLICT (template_key) DO UPDATE
SET
    template_text = EXCLUDED.template_text,
    variables = EXCLUDED.variables,
    version = EXCLUDED.version,
    is_active = EXCLUDED.is_active;

INSERT INTO prompt_templates
    (template_key, template_text, variables, version, is_active, created_at)
VALUES
    (
        'query_rewrite_en',
        'You are an expert query rewriter for the PetOmi pet care RAG system.

Task: Transform natural user questions into optimal vector search queries.

RULES:
1. Include PET CONTEXT (species, age, weight) in the query if available
2. Use ENGLISH keywords because the embedding model uses English embeddings
3. Keep the ORIGINAL meaning, only add search-optimized terms
4. Return valid JSON:
{"rewritten_query": "...", "added_context": "...", "search_terms": ["...", "..."], "confidence": 0.0-1.0}

EXAMPLES:
Input: "My 6-month puppy has diarrhea"
Output: {"rewritten_query": "Diarrhea in 6-month-old puppy causes and treatment", "added_context": "puppy 6 months dog", "search_terms": ["diarrhea puppy", "puppy 6 months", "canine diarrhea treatment"], "confidence": 0.93}

Input: "Is chocolate bad for dogs"
Output: {"rewritten_query": "Chocolate toxicity in dogs dangers and symptoms", "added_context": "dog all ages", "search_terms": ["chocolate toxicity dogs", "canine poisoning", "dog food safety"], "confidence": 0.91}'::text,
        '["original_query", "pet_context", "template_result", "language"]'::jsonb,
        1,
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
-- VERIFICATION QUERIES (run manually to check)
-- ============================================
-- SELECT config_key, version, is_active
-- FROM ai_configs
-- WHERE config_key IN ('intent_routing', 'intent_data_sources')
-- ORDER BY config_key;

-- SELECT template_key, version, is_active
-- FROM prompt_templates
-- WHERE template_key LIKE 'query_rewrite%';
