from app.routing.intents import Intent

SourceType = str

POSTGRESQL_VECTOR = "postgresql_vector"
POSTGRESQL_FULLTEXT = "postgresql_fulltext"
DOTNET_API_PET = "dotnet_api_pet"
DOTNET_API_HEALTH = "dotnet_api_pet_health"
DOTNET_API_VACCINE = "dotnet_api_pet_vaccine"
DOTNET_API_MEDICAL_RECORD = "dotnet_api_pet_medical_record"
DOTNET_API_WEIGHT = "dotnet_api_pet_weight"
NO_DATA = "no_data"


class DataSourceMap:
    """Maps each intent to the ordered list of data sources needed to answer it.

    Each entry is a list because some intents need data from multiple sources
    (e.g., SYMPTOM needs both pet health profile AND RAG knowledge chunks).

    Priority order (left to right):
      1. dotnet_api_*  → pet-specific context (species, age, weight…)
         → comes from .NET Core backend (SQL Server) via internal REST call
      2. postgresql_*  → shared knowledge base (RAG chunks, articles…)
         → comes from AI service's own PostgreSQL database
    """

    _MAP: dict[Intent, list[SourceType]] = {
        Intent.NUTRITION: [
            DOTNET_API_PET,
            POSTGRESQL_VECTOR,
        ],
        Intent.SYMPTOM: [
            DOTNET_API_HEALTH,
            DOTNET_API_WEIGHT,
            POSTGRESQL_VECTOR,
        ],
        Intent.VACCINE: [
            DOTNET_API_PET,
            DOTNET_API_VACCINE,
            POSTGRESQL_VECTOR,
        ],
        Intent.APPOINTMENT: [
            DOTNET_API_PET,
            NO_DATA,
        ],
        Intent.EMERGENCY: [
            DOTNET_API_PET,
            POSTGRESQL_VECTOR,
        ],
        Intent.BILLING: [
            NO_DATA,
        ],
        Intent.GROOMING: [
            DOTNET_API_PET,
            POSTGRESQL_VECTOR,
        ],
        Intent.TRAINING: [
            DOTNET_API_PET,
            POSTGRESQL_VECTOR,
        ],
        Intent.BEHAVIOR: [
            DOTNET_API_PET,
            POSTGRESQL_VECTOR,
        ],
        Intent.PRODUCT: [
            DOTNET_API_PET,
            POSTGRESQL_VECTOR,
        ],
        Intent.GENERAL: [
            POSTGRESQL_FULLTEXT,
        ],
    }

    @classmethod
    def get_sources(cls, intent: Intent) -> list[SourceType]:
        return cls._MAP.get(intent, [NO_DATA])

    @classmethod
    def needs_pet_context(cls, intent: Intent) -> bool:
        sources = cls.get_sources(intent)
        pet_sources = {
            DOTNET_API_PET,
            DOTNET_API_HEALTH,
            DOTNET_API_VACCINE,
            DOTNET_API_MEDICAL_RECORD,
            DOTNET_API_WEIGHT,
        }
        return bool(set(sources) & pet_sources)

    @classmethod
    def needs_rag(cls, intent: Intent) -> bool:
        sources = cls.get_sources(intent)
        rag_sources = {POSTGRESQL_VECTOR, POSTGRESQL_FULLTEXT}
        return bool(set(sources) & rag_sources)

    @classmethod
    def is_llm_rewrite_candidate(cls, intent: Intent) -> bool:
        return intent in (
            Intent.NUTRITION,
            Intent.SYMPTOM,
            Intent.VACCINE,
            Intent.BEHAVIOR,
            Intent.TRAINING,
        )

    @classmethod
    def rag_filter_topics(cls, intent: Intent) -> list[str]:
        topic_map = {
            Intent.NUTRITION: [],
        }
        return topic_map.get(intent, [])

    @classmethod
    def needs_dotnet_api(cls, intent: Intent) -> bool:
        sources = cls.get_sources(intent)
        dotnet_sources = {
            DOTNET_API_PET,
            DOTNET_API_HEALTH,
            DOTNET_API_VACCINE,
            DOTNET_API_MEDICAL_RECORD,
            DOTNET_API_WEIGHT,
        }
        return bool(set(sources) & dotnet_sources)


ALL_SOURCES = {
    DOTNET_API_PET: "Pet profile (species, breed, age) from .NET Core API",
    DOTNET_API_HEALTH: "Pet health profile (weight, conditions) from .NET Core API",
    DOTNET_API_VACCINE: "Pet vaccination records from .NET Core API",
    DOTNET_API_MEDICAL_RECORD: "Pet medical history from .NET Core API",
    DOTNET_API_WEIGHT: "Pet weight log from .NET Core API",
    POSTGRESQL_VECTOR: "RAG vector search over knowledge_chunks in PostgreSQL",
    POSTGRESQL_FULLTEXT: "Full-text search over knowledge_chunks in PostgreSQL",
    NO_DATA: "No external data needed",
}
