import logging
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PetContext:
    """Aggregated pet context fetched from .NET Core API."""

    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[str] = None
    age_months: Optional[int] = None
    weight_kg: Optional[float] = None
    gender: Optional[str] = None
    is_neutered: Optional[bool] = None
    microchip_number: Optional[str] = None
    color: Optional[str] = None

    def is_complete(self) -> bool:
        return bool(self.species and self.age_months)

    def has_weight(self) -> bool:
        return self.weight_kg is not None

    def format_for_prompt(self) -> str:
        parts = []
        if self.pet_name:
            parts.append(f"Pet name: {self.pet_name}")
        if self.species:
            parts.append(f"Species: {self.species}")
        if self.breed:
            parts.append(f"Breed: {self.breed}")
        if self.age:
            parts.append(f"Age: {self.age}")
        elif self.age_months is not None:
            parts.append(f"Age: {self.age_months} months")
        if self.weight_kg:
            parts.append(f"Weight: {self.weight_kg} kg")
        if self.gender:
            parts.append(f"Gender: {self.gender}")
        if self.is_neutered is not None:
            parts.append(f"Neutered: {'Yes' if self.is_neutered else 'No'}")
        return "; ".join(parts) if parts else "No pet context available."


@dataclass
class PetVaccinationRecord:
    vaccination_id: str
    vaccine_name: Optional[str] = None
    administered_at: Optional[str] = None
    next_due_date: Optional[str] = None
    batch_number: Optional[str] = None


@dataclass
class PetMedicalRecord:
    record_id: str
    title: Optional[str] = None
    record_type: Optional[str] = None
    clinic_name: Optional[str] = None
    vet_name: Optional[str] = None
    diagnosis: Optional[str] = None
    medication: Optional[str] = None
    created_at: Optional[str] = None


class PetContextService:
    """Fetches pet context from .NET Core API via internal AI endpoints.

    The Python AI service calls .NET internal endpoints:
      GET /internal/ai/pets/{petId}/basic-context  → Pet profile with age
      GET /internal/ai/pets/{petId}/medical-summary → Health + weight + vaccines + records
    """

    def __init__(self, base_url: Optional[str] = None, timeout: float = 5.0) -> None:
        self._base_url = (base_url or settings.dotnet_api_base_url).rstrip("/")
        self._timeout = timeout

    def _get_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if settings.ai_service_api_key:
            headers["X-Api-Key"] = settings.ai_service_api_key
        elif settings.dotnet_api_webhook_secret:
            headers["X-Api-Key"] = settings.dotnet_api_webhook_secret
        return headers

    async def fetch_pet_context(
        self,
        pet_id: str,
        user_id: str,
        sources: Optional[list[str]] = None,
    ) -> PetContext:
        if not pet_id:
            return PetContext()

        basic_task = self._fetch_basic_context(pet_id)
        medical_task = self._fetch_medical_summary(pet_id)

        results = await self._gather_tasks({
            "basic": basic_task,
            "medical": medical_task,
        })

        ctx = PetContext(pet_id=pet_id)

        basic = results.get("basic")
        if basic:
            ctx.pet_name = basic.get("name")
            ctx.species = basic.get("species")
            ctx.breed = basic.get("breed")
            ctx.gender = basic.get("gender")
            ctx.age_months = basic.get("ageMonths")
            ctx.age = basic.get("ageFormatted")

        medical = results.get("medical")
        if medical:
            hp = medical.get("healthProfile")
            if hp:
                ctx.weight_kg = hp.get("currentWeightKg")
                neutered = hp.get("isNeutered")
                if neutered is not None:
                    ctx.is_neutered = neutered.lower() in ("true", "1", "yes") if isinstance(neutered, str) else bool(neutered)
                ctx.microchip_number = hp.get("microchipNumber")
                ctx.color = hp.get("color")

        return ctx

    async def _fetch_basic_context(self, pet_id: str) -> Optional[dict]:
        url = f"{self._base_url}/internal/ai/pets/{pet_id}/basic-context"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(url, headers=self._get_headers())
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("Failed to fetch basic context %s: HTTP %d", pet_id, resp.status_code)
        except Exception as e:
            logger.warning("Exception fetching basic context %s: %s", pet_id, e)
        return None

    async def _fetch_medical_summary(self, pet_id: str) -> Optional[dict]:
        url = f"{self._base_url}/internal/ai/pets/{pet_id}/medical-summary"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(url, headers=self._get_headers())
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("Failed to fetch medical summary %s: HTTP %d", pet_id, resp.status_code)
        except Exception as e:
            logger.warning("Exception fetching medical summary %s: %s", pet_id, e)
        return None

    async def _fetch_pet_profile(self, pet_id: str, user_id: str) -> Optional[dict]:
        return await self._fetch_basic_context(pet_id)

    async def _fetch_health_profile(self, pet_id: str, user_id: str) -> Optional[dict]:
        url = f"{self._base_url}/internal/ai/pets/{pet_id}/medical-summary"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(url, headers=self._get_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("healthProfile")
        except Exception as e:
            logger.warning("Exception fetching health profile %s: %s", pet_id, e)
        return None

    async def _fetch_vaccinations(
        self, pet_id: str, user_id: str
    ) -> list[PetVaccinationRecord]:
        url = f"{self._base_url}/internal/ai/pets/{pet_id}/medical-summary"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(url, headers=self._get_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    return [PetVaccinationRecord(vaccination_id=str(v["medicalRecordId"]), vaccine_name=v.get("title"))
                             for v in data.get("vaccinations", [])]
        except Exception as e:
            logger.warning("Exception fetching vaccinations %s: %s", pet_id, e)
        return []

    async def _fetch_medical_records(
        self, pet_id: str, user_id: str
    ) -> list[PetMedicalRecord]:
        url = f"{self._base_url}/internal/ai/pets/{pet_id}/medical-summary"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(url, headers=self._get_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    return [PetMedicalRecord(record_id=str(r["medicalRecordId"]), title=r.get("title"),
                                            record_type=r.get("recordType"))
                            for r in data.get("medicalRecords", [])]
        except Exception as e:
            logger.warning("Exception fetching medical records %s: %s", pet_id, e)
        return []

    async def _fetch_weight_log(self, pet_id: str, user_id: str) -> list[dict]:
        url = f"{self._base_url}/internal/ai/pets/{pet_id}/medical-summary"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(url, headers=self._get_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("recentWeightLogs", [])
        except Exception as e:
            logger.warning("Exception fetching weight log %s: %s", pet_id, e)
        return []

    async def _gather_tasks(self, tasks: dict[str, any]) -> dict[str, any]:
        results: dict[str, any] = {}
        if not tasks:
            return results

        import asyncio

        keys = list(tasks.keys())
        done = await asyncio.gather(*tasks.values(), return_exceptions=True)
        for key, item in zip(keys, done):
            if isinstance(item, Exception):
                logger.warning("Gather exception for %s: %s", key, item)
                results[key] = None
            else:
                results[key] = item

        return results


pet_context_service = PetContextService()
