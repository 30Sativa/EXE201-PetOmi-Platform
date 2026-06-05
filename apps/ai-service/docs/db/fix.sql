ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(1536);
-- Tạo lại index vì dimension đã đổi
DROP INDEX IF EXISTS idx_chunks_embedding;
CREATE INDEX idx_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100) WHERE is_active = true;