import unittest

from app.context.pet_context_service import PetContext


class TestPetContext(unittest.TestCase):
    def test_is_complete_with_species_and_age(self):
        ctx = PetContext(species="dog", age_months=12)
        self.assertTrue(ctx.is_complete())

    def test_is_complete_without_species(self):
        ctx = PetContext(species=None, age_months=12)
        self.assertFalse(ctx.is_complete())

    def test_is_complete_without_age(self):
        ctx = PetContext(species="cat", age_months=None)
        self.assertFalse(ctx.is_complete())

    def test_is_complete_empty(self):
        ctx = PetContext()
        self.assertFalse(ctx.is_complete())

    def test_has_weight_true(self):
        ctx = PetContext(weight_kg=10.5)
        self.assertTrue(ctx.has_weight())

    def test_has_weight_false(self):
        ctx = PetContext(weight_kg=None)
        self.assertFalse(ctx.has_weight())

    def test_format_for_prompt_full(self):
        ctx = PetContext(
            pet_name="Buddy",
            species="dog",
            breed="Golden Retriever",
            age="2 years",
            age_months=24,
            weight_kg=15.5,
            gender="Male",
            is_neutered=True,
        )
        formatted = ctx.format_for_prompt()
        self.assertIn("Buddy", formatted)
        self.assertIn("dog", formatted)
        self.assertIn("Golden Retriever", formatted)
        self.assertIn("2 years", formatted)
        self.assertIn("15.5 kg", formatted)
        self.assertIn("Male", formatted)
        self.assertIn("Yes", formatted)

    def test_format_for_prompt_partial(self):
        ctx = PetContext(species="cat", age_months=6)
        formatted = ctx.format_for_prompt()
        self.assertIn("cat", formatted)
        self.assertIn("6 months", formatted)
        self.assertNotIn("Buddy", formatted)
        self.assertNotIn("Weight", formatted)

    def test_format_for_prompt_empty(self):
        ctx = PetContext()
        formatted = ctx.format_for_prompt()
        self.assertIn("No pet context", formatted)

    def test_format_for_prompt_age_months_only(self):
        ctx = PetContext(species="rabbit", age_months=18)
        formatted = ctx.format_for_prompt()
        self.assertIn("rabbit", formatted)
        self.assertIn("18 months", formatted)


class TestPetContextService(unittest.IsolatedAsyncioTestCase):
    async def test_gather_tasks_awaits_existing_coroutines(self):
        from app.context.pet_context_service import PetContextService

        async def ok():
            return {"value": 1}

        service = PetContextService(base_url="http://localhost")
        result = await service._gather_tasks({"pet": ok()})

        self.assertEqual(result["pet"], {"value": 1})


if __name__ == "__main__":
    unittest.main()
