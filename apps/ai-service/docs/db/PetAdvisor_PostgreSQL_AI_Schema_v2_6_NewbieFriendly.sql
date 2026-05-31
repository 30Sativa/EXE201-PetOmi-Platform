-- ============================================
-- PET ADVISOR AI - POSTGRESQL SCHEMA v2.6 NEWBIE FRIENDLY
-- ============================================
-- Database: PostgreSQL 15+ with pgvector extension
-- Purpose : AI Service only: RAG knowledge base, AI configs, prompt templates, request analytics
-- Note    : Conversations + Messages moved to SQL Server Core Backend
-- Removed : trigger, raw_request, raw_response, latency_breakdown, metadata pet cache
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector; -- Bật pgvector để lưu embedding vector

-- ============================================
-- 1. KNOWLEDGE SOURCES
-- Lưu thông tin nguồn tài liệu gốc: article, faq, vet guide...
-- ============================================

CREATE TABLE knowledge_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                                  -- Khóa chính của source
    title text NOT NULL,                                                            -- Tên tài liệu / bài viết
    source_type text CHECK (source_type IN ('article', 'faq', 'vet_guide', 'drug_info')), -- Loại nguồn kiến thức
    url text,                                                                       -- Link gốc nếu crawl từ web
    content_hash varchar(64) UNIQUE,                                                -- SHA-256 để tránh import trùng tài liệu
    chunk_count int DEFAULT 0,                                                      -- Số chunk được tách từ source này
    metadata jsonb DEFAULT '{}',                                                    -- Thông tin phụ: author, category, verified_date...
    created_at timestamptz DEFAULT now(),                                           -- Ngày tạo record
    is_active boolean DEFAULT true                                                  -- Soft delete: true=còn dùng, false=ẩn
);

COMMENT ON TABLE knowledge_sources IS 'Danh sách tài liệu gốc dùng để build RAG knowledge base';

-- ============================================
-- 2. KNOWLEDGE CHUNKS
-- Lưu từng đoạn nhỏ của tài liệu + embedding để vector search
-- ============================================

CREATE TABLE knowledge_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                                  -- Khóa chính của chunk
    source_id uuid REFERENCES knowledge_sources(id) ON DELETE CASCADE,              -- Chunk thuộc source nào
    chunk_index int NOT NULL,                                                       -- Thứ tự chunk trong source
    section_title text,                                                             -- Tên section nếu có
    chunk_hash varchar(64),                                                         -- Hash riêng của chunk để detect thay đổi nội dung
    source_url text,                                                                -- Link source cụ thể cho chunk này
    content text NOT NULL,                                                          -- Nội dung text của chunk
    embedding vector(768),                                                          -- Vector embedding; 768 nếu dùng bge-base-en-v1.5
    embedding_model text DEFAULT 'bge-base-en-v1.5',                                -- Tên model tạo embedding
    embedding_version int DEFAULT 1,                                                -- Version pipeline embedding/chunking
    token_count int DEFAULT 0,                                                      -- Số token ước tính của chunk
    metadata jsonb DEFAULT '{}',                                                    -- Metadata để filter RAG: topic, section...
    is_active boolean DEFAULT true,                                                 -- Soft delete chunk
    created_at timestamptz DEFAULT now(),                                           -- Ngày tạo chunk

    CONSTRAINT uq_source_chunk_version UNIQUE (source_id, chunk_index, embedding_version) -- Không trùng chunk cùng version
);

CREATE INDEX idx_chunks_embedding ON knowledge_chunks                               -- Index vector search cosine similarity
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
    WHERE is_active = true;

CREATE INDEX idx_chunks_metadata ON knowledge_chunks USING gin(metadata);           -- Index filter metadata jsonb

CREATE INDEX idx_chunks_version ON knowledge_chunks(embedding_model, embedding_version) -- Index lọc model/version
    WHERE is_active = true;

COMMENT ON TABLE knowledge_chunks IS 'Các đoạn kiến thức nhỏ + embedding để AI Service truy vấn RAG';

-- ============================================
-- 3. CRAWL LOGS
-- Log quá trình crawl/import tài liệu
-- ============================================

CREATE TABLE crawl_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                                  -- Khóa chính log crawl
    url text,                                                                       -- URL đã crawl
    status text CHECK (status IN ('success','failed','skipped')),                   -- Kết quả crawl
    crawled_at timestamptz DEFAULT now(),                                           -- Thời điểm crawl
    error text                                                                      -- Lỗi nếu status = failed
);

-- ============================================
-- 4. REQUEST LOGS
-- Chỉ lưu analytics summary. Raw payload + latency breakdown để Datadog/Loki/logging service xử lý.
-- ============================================

CREATE TABLE request_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                                  -- Khóa chính request log

    timestamp timestamptz DEFAULT now(),                                            -- Thời điểm request tới AI Service
    date_key date DEFAULT CURRENT_DATE,                                             -- Ngày để thống kê nhanh theo ngày

    user_id uuid NOT NULL,                                                          -- UserId từ SQL Server Core Backend
    conversation_id uuid,                                                           -- ConversationId từ SQL Server, nullable nếu request chưa có conversation
    pet_id uuid,                                                                    -- PetId từ SQL Server, nullable nếu chat general

    message text NOT NULL CHECK (char_length(message) <= 100),                      -- Tin nhắn đã cắt ngắn tối đa 100 ký tự để tránh lưu PII dài
    message_length int,                                                             -- Độ dài thật của message trước khi truncate

    urgency_level text CHECK (urgency_level IN ('critical', 'high', 'normal')),     -- Mức khẩn cấp do AI pipeline phân loại
    intent text CHECK (intent IN ('nutrition', 'symptom', 'vaccine', 'general', 'emergency')), -- Intent của câu hỏi
    context_complete boolean,                                                       -- Đã đủ context pet chưa? species/age/weight...

    rag_used boolean DEFAULT false,                                                 -- Request có dùng RAG không
    chunks_found int DEFAULT 0,                                                     -- Số chunk tìm thấy từ vector search
    chunks_used int DEFAULT 0,                                                      -- Số chunk thật sự đưa vào prompt
    avg_similarity decimal(4,3),                                                    -- Similarity trung bình của chunks dùng
    max_similarity decimal(4,3),                                                    -- Similarity cao nhất để debug chất lượng RAG
    rag_latency_ms int,                                                             -- Thời gian query RAG tính bằng ms

    gpt_used boolean DEFAULT false,                                                 -- Có gọi GPT/LLM không
    model text,                                                                     -- Model đã dùng, ví dụ gpt-4o-mini
    tokens_input int DEFAULT 0,                                                     -- Token input
    tokens_output int DEFAULT 0,                                                    -- Token output
    cost_usd decimal(10,6) DEFAULT 0,                                               -- Chi phí ước tính USD

    latency_ms int NOT NULL,                                                        -- Tổng thời gian xử lý request end-to-end

    response_status text CHECK (response_status IN ('success', 'error', 'timeout', 'rate_limited')), -- Trạng thái response
    error_message text,                                                             -- Message lỗi ngắn nếu có
    response_length int,                                                            -- Độ dài response trả về
    vet_recommendation text CHECK (vet_recommendation IN ('urgent', 'watch', 'monitor', 'none')), -- Gợi ý vet dạng text enum

    CONSTRAINT chk_message_length_consistency
        CHECK (message_length IS NULL OR message_length >= char_length(message))     -- Length thật phải >= message đã truncate
);

CREATE INDEX idx_logs_timestamp ON request_logs(timestamp DESC);                    -- Xem log mới nhất
CREATE INDEX idx_logs_date_key ON request_logs(date_key);                           -- Thống kê theo ngày
CREATE INDEX idx_logs_user_id ON request_logs(user_id, timestamp DESC);             -- Xem lịch sử request theo user
CREATE INDEX idx_logs_conversation ON request_logs(conversation_id, timestamp)      -- Xem log theo conversation
    WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_logs_pet ON request_logs(pet_id, timestamp DESC)                   -- Xem log theo pet
    WHERE pet_id IS NOT NULL;
CREATE INDEX idx_logs_urgency ON request_logs(urgency_level, timestamp);            -- Thống kê critical/high/normal
CREATE INDEX idx_logs_intent ON request_logs(intent, date_key);                     -- Thống kê intent theo ngày
CREATE INDEX idx_logs_gpt_used ON request_logs(gpt_used, date_key) WHERE gpt_used = true; -- Đếm request có gọi GPT
CREATE INDEX idx_logs_rag_used ON request_logs(rag_used, date_key);                 -- Đếm request có dùng RAG
CREATE INDEX idx_logs_cost_user ON request_logs(user_id, date_key, cost_usd)        -- Tính cost theo user/ngày
    WHERE gpt_used = true;
CREATE INDEX idx_logs_status_date ON request_logs(response_status, date_key)        -- Tìm lỗi/timeout theo ngày
    WHERE response_status != 'success';

COMMENT ON TABLE request_logs IS 'Analytics summary cho AI request. Không lưu raw payload trong DB';

-- ============================================
-- 5. AI CONFIGS
-- Chỉ lưu config cần đổi runtime. Keyword tiếng Việt để trong code/file config, không seed DB.
-- ============================================

CREATE TABLE ai_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                                  -- Khóa chính config
    config_key text UNIQUE NOT NULL,                                                -- Tên config, ví dụ guardrails
    config_value jsonb NOT NULL,                                                    -- Giá trị config dạng JSON
    description text,                                                               -- Mô tả config dùng để làm gì
    version int DEFAULT 1,                                                          -- Version config
    is_active boolean DEFAULT true,                                                 -- Config còn dùng không
    updated_at timestamptz DEFAULT now(),                                           -- Lần update cuối
    updated_by text                                                                 -- Ai update config
);

INSERT INTO ai_configs (config_key, config_value, description) VALUES
('guardrails', '{
    "daily_request_limit": 300,
    "max_tokens_per_request": 1500,
    "max_message_length": 500,
    "timeout_seconds": 10,
    "similarity_threshold": 0.75
}'::jsonb, 'Safety limits and cost controls. Keyword lists are loaded from application config files.'),

('rag_settings', '{
    "default_top_k": 3,
    "default_embedding_model": "bge-base-en-v1.5",
    "default_embedding_version": 1,
    "default_filter_metadata": {}
}'::jsonb, 'Runtime RAG settings. No hardcoded language keywords.'),

('intent_routing', '{
    "nutrition": {"required_fields": ["species", "age"], "rag_filter": {"topic": "nutrition"}},
    "symptom": {"required_fields": ["species", "age", "weight"], "rag_filter": {"topic": "symptom"}},
    "vaccine": {"required_fields": ["age"], "rag_filter": {"topic": "vaccine"}},
    "general": {"required_fields": [], "rag_filter": {}}
}'::jsonb, 'Intent routing metadata only. Keyword classification belongs to code/config file.');

-- ============================================
-- 6. PROMPT TEMPLATES
-- Lưu prompt template để có thể chỉnh prompt mà không sửa code
-- ============================================

CREATE TABLE prompt_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                                  -- Khóa chính template
    template_key text UNIQUE NOT NULL,                                              -- Tên template, ví dụ symptom_check
    template_text text NOT NULL,                                                    -- Nội dung prompt template
    variables jsonb DEFAULT '[]',                                                   -- Danh sách biến cần truyền: pet_info, rag_chunks, message...
    version int DEFAULT 1,                                                          -- Version template
    is_active boolean DEFAULT true,                                                 -- Template còn dùng không
    created_at timestamptz DEFAULT now()                                            -- Ngày tạo template
);

-- ============================================
-- 7. RPC FUNCTIONS
-- Chỉ giữ function cần thiết cho vector search + analytics.
-- Không dùng trigger để tránh phức tạp cho giai đoạn newbie.
-- ============================================

CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(768),                                                    -- Embedding của câu hỏi user
    match_threshold float,                                                          -- Ngưỡng similarity tối thiểu, ví dụ 0.75
    match_count int,                                                                -- Số chunk muốn lấy, ví dụ 3
    filter_metadata jsonb DEFAULT '{}',                                             -- Filter metadata, ví dụ {"topic":"nutrition"}
    p_embedding_model text DEFAULT 'bge-base-en-v1.5',                              -- Model embedding truyền vào, không hardcode trong WHERE nữa
    p_embedding_version int DEFAULT 1                                               -- Version embedding/chunking muốn dùng
)
RETURNS TABLE(
    id uuid,                                                                        -- Id của chunk match
    source_id uuid,                                                                 -- Source chứa chunk
    content text,                                                                   -- Nội dung chunk
    similarity float,                                                               -- Điểm similarity, càng gần 1 càng giống
    metadata jsonb                                                                  -- Metadata của chunk
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.source_id,
        kc.content,
        1 - (kc.embedding <=> query_embedding) AS similarity,
        kc.metadata
    FROM knowledge_chunks kc
    WHERE
        kc.is_active = true
        AND kc.embedding IS NOT NULL
        AND kc.embedding_model = p_embedding_model
        AND kc.embedding_version = p_embedding_version
        AND 1 - (kc.embedding <=> query_embedding) > match_threshold
        AND (filter_metadata = '{}'::jsonb OR kc.metadata @> filter_metadata)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_request_count(p_date date DEFAULT CURRENT_DATE)
RETURNS int
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::int FROM request_logs WHERE date_key = p_date;
$$;

CREATE OR REPLACE FUNCTION get_daily_stats(check_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'date', check_date,
        'total_requests', COUNT(*),
        'critical_count', COUNT(*) FILTER (WHERE urgency_level = 'critical'),
        'high_count', COUNT(*) FILTER (WHERE urgency_level = 'high'),
        'normal_count', COUNT(*) FILTER (WHERE urgency_level = 'normal'),
        'critical_skip_rate', ROUND(AVG(CASE WHEN urgency_level = 'critical' AND NOT gpt_used THEN 1 ELSE 0 END)::numeric, 2),
        'rag_usage_rate', ROUND(AVG(CASE WHEN rag_used THEN 1 ELSE 0 END)::numeric, 2),
        'gpt_usage_rate', ROUND(AVG(CASE WHEN gpt_used THEN 1 ELSE 0 END)::numeric, 2),
        'avg_similarity', ROUND(AVG(avg_similarity)::numeric, 3),
        'avg_latency_ms', ROUND(AVG(latency_ms)::numeric, 0),
        'p95_latency', percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms),
        'p99_latency', percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms),
        'total_cost_usd', ROUND(SUM(cost_usd)::numeric, 4),
        'error_rate', ROUND(AVG(CASE WHEN response_status != 'success' THEN 1 ELSE 0 END)::numeric, 3),
        'timeout_rate', ROUND(AVG(CASE WHEN response_status = 'timeout' THEN 1 ELSE 0 END)::numeric, 3)
    )
    INTO result
    FROM request_logs
    WHERE date_key = check_date;

    RETURN result;
END;
$$;
