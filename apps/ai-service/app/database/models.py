from typing import Any, Optional
import datetime
import decimal
import uuid

from pgvector.sqlalchemy.vector import VECTOR
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKeyConstraint, Index, Integer, Numeric, PrimaryKeyConstraint, String, Text, UniqueConstraint, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class AiConfigs(Base):
    __tablename__ = 'ai_configs'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='ai_configs_pkey'),
        UniqueConstraint('config_key', name='ai_configs_config_key_key')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    config_key: Mapped[str] = mapped_column(Text, nullable=False)
    config_value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    version: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('1'))
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('now()'))
    updated_by: Mapped[Optional[str]] = mapped_column(Text)


class CrawlLogs(Base):
    __tablename__ = 'crawl_logs'
    __table_args__ = (
        CheckConstraint("status = ANY (ARRAY['success'::text, 'failed'::text, 'skipped'::text])", name='crawl_logs_status_check'),
        PrimaryKeyConstraint('id', name='crawl_logs_pkey')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    url: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[Optional[str]] = mapped_column(Text)
    crawled_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('now()'))
    error: Mapped[Optional[str]] = mapped_column(Text)


class KnowledgeSources(Base):
    __tablename__ = 'knowledge_sources'
    __table_args__ = (
        CheckConstraint("source_type = ANY (ARRAY['article'::text, 'faq'::text, 'vet_guide'::text, 'drug_info'::text])", name='knowledge_sources_source_type_check'),
        PrimaryKeyConstraint('id', name='knowledge_sources_pkey'),
        UniqueConstraint('content_hash', name='knowledge_sources_content_hash_key'),
        {'comment': 'Danh sách tài liệu gốc dùng để build RAG knowledge base'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    source_type: Mapped[Optional[str]] = mapped_column(Text)
    url: Mapped[Optional[str]] = mapped_column(Text)
    content_hash: Mapped[Optional[str]] = mapped_column(String(64))
    chunk_count: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    metadata_: Mapped[Optional[dict]] = mapped_column('metadata', JSONB, server_default=text("'{}'::jsonb"))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('now()'))
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))

    knowledge_chunks: Mapped[list['KnowledgeChunks']] = relationship('KnowledgeChunks', back_populates='source')


class PromptTemplates(Base):
    __tablename__ = 'prompt_templates'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='prompt_templates_pkey'),
        UniqueConstraint('template_key', name='prompt_templates_template_key_key')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    template_key: Mapped[str] = mapped_column(Text, nullable=False)
    template_text: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[Optional[dict]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    version: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('1'))
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('now()'))


class RequestLogs(Base):
    __tablename__ = 'request_logs'
    __table_args__ = (
        CheckConstraint('char_length(message) <= 100', name='request_logs_message_check'),
        CheckConstraint("intent = ANY (ARRAY['nutrition'::text, 'symptom'::text, 'vaccine'::text, 'general'::text, 'emergency'::text])", name='request_logs_intent_check'),
        CheckConstraint('message_length IS NULL OR message_length >= char_length(message)', name='chk_message_length_consistency'),
        CheckConstraint("response_status = ANY (ARRAY['success'::text, 'error'::text, 'timeout'::text, 'rate_limited'::text])", name='request_logs_response_status_check'),
        CheckConstraint("urgency_level = ANY (ARRAY['critical'::text, 'high'::text, 'normal'::text])", name='request_logs_urgency_level_check'),
        CheckConstraint("vet_recommendation = ANY (ARRAY['urgent'::text, 'watch'::text, 'monitor'::text, 'none'::text])", name='request_logs_vet_recommendation_check'),
        PrimaryKeyConstraint('id', name='request_logs_pkey'),
        Index('idx_logs_conversation', 'conversation_id', 'timestamp', postgresql_where='(conversation_id IS NOT NULL)'),
        Index('idx_logs_cost_user', 'user_id', 'date_key', 'cost_usd', postgresql_where='(gpt_used = true)'),
        Index('idx_logs_date_key', 'date_key'),
        Index('idx_logs_gpt_used', 'gpt_used', 'date_key', postgresql_where='(gpt_used = true)'),
        Index('idx_logs_intent', 'intent', 'date_key'),
        Index('idx_logs_pet', 'pet_id', 'timestamp', postgresql_where='(pet_id IS NOT NULL)'),
        Index('idx_logs_rag_used', 'rag_used', 'date_key'),
        Index('idx_logs_status_date', 'response_status', 'date_key', postgresql_where="(response_status <> 'success'::text)"),
        Index('idx_logs_timestamp', 'timestamp'),
        Index('idx_logs_urgency', 'urgency_level', 'timestamp'),
        Index('idx_logs_user_id', 'user_id', 'timestamp'),
        {'comment': 'Analytics summary cho AI request. Không lưu raw payload trong DB'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('now()'))
    date_key: Mapped[Optional[datetime.date]] = mapped_column(Date, server_default=text('CURRENT_DATE'))
    conversation_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    pet_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    message_length: Mapped[Optional[int]] = mapped_column(Integer)
    urgency_level: Mapped[Optional[str]] = mapped_column(Text)
    intent: Mapped[Optional[str]] = mapped_column(Text)
    context_complete: Mapped[Optional[bool]] = mapped_column(Boolean)
    rag_used: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    chunks_found: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    chunks_used: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    avg_similarity: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(4, 3))
    max_similarity: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(4, 3))
    rag_latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    gpt_used: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    model: Mapped[Optional[str]] = mapped_column(Text)
    tokens_input: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    tokens_output: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    cost_usd: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(10, 6), server_default=text('0'))
    response_status: Mapped[Optional[str]] = mapped_column(Text)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    response_length: Mapped[Optional[int]] = mapped_column(Integer)
    vet_recommendation: Mapped[Optional[str]] = mapped_column(Text)


class KnowledgeChunks(Base):
    __tablename__ = 'knowledge_chunks'
    __table_args__ = (
        ForeignKeyConstraint(['source_id'], ['knowledge_sources.id'], ondelete='CASCADE', name='knowledge_chunks_source_id_fkey'),
        PrimaryKeyConstraint('id', name='knowledge_chunks_pkey'),
        UniqueConstraint('source_id', 'chunk_index', 'embedding_version', name='uq_source_chunk_version'),
        Index('idx_chunks_embedding', 'embedding', postgresql_ops={'embedding': 'vector_cosine_ops'}, postgresql_using='ivfflat', postgresql_where='(is_active = true)', postgresql_with={'lists': '100'}),
        Index('idx_chunks_metadata', 'metadata', postgresql_using='gin'),
        Index('idx_chunks_version', 'embedding_model', 'embedding_version', postgresql_where='(is_active = true)'),
        {'comment': 'Các đoạn kiến thức nhỏ + embedding để AI Service truy vấn RAG'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    section_title: Mapped[Optional[str]] = mapped_column(Text)
    chunk_hash: Mapped[Optional[str]] = mapped_column(String(64))
    source_url: Mapped[Optional[str]] = mapped_column(Text)
    embedding: Mapped[Optional[Any]] = mapped_column(VECTOR(1536))
    embedding_model: Mapped[Optional[str]] = mapped_column(Text, server_default=text("'bge-base-en-v1.5'::text"))
    embedding_version: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('1'))
    token_count: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    metadata_: Mapped[Optional[dict]] = mapped_column('metadata', JSONB, server_default=text("'{}'::jsonb"))
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('true'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('now()'))

    source: Mapped[Optional['KnowledgeSources']] = relationship('KnowledgeSources', back_populates='knowledge_chunks')
