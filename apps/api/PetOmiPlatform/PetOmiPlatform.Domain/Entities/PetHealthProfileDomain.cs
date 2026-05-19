using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetHealthProfileDomain : BaseEntity
    {
        public Guid PetId { get; private set; }
        public decimal? CurrentWeightKg { get; private set; }
        public string? Color { get; private set; }
        public string? IsNeutered { get; private set; }
        public string? Allergies { get; private set; }
        public string? ChronicConditions { get; private set; }
        public string? MicrochipNumber { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private PetHealthProfileDomain() { }

        private PetHealthProfileDomain(
            Guid petId,
            decimal? currentWeightKg,
            string? color,
            string? isNeutered,
            string? allergies,
            string? chronicConditions,
            string? microchipNumber)
        {
            Id = Guid.NewGuid();
            PetId = petId;
            CurrentWeightKg = currentWeightKg;
            Color = color;
            IsNeutered = isNeutered;
            Allergies = allergies;
            ChronicConditions = chronicConditions;
            MicrochipNumber = microchipNumber;
            CreatedAt = DateTime.UtcNow;
        }

        public static PetHealthProfileDomain Create(
            Guid petId,
            decimal? currentWeightKg,
            string? color,
            string? isNeutered,
            string? allergies,
            string? chronicConditions,
            string? microchipNumber)
        {
            ValidateIsNeutered(isNeutered);
            return new PetHealthProfileDomain(
                petId, currentWeightKg, color, isNeutered,
                allergies, chronicConditions, microchipNumber);
        }

        public static PetHealthProfileDomain Reconstitute(
            Guid id,
            Guid petId,
            decimal? currentWeightKg,
            string? color,
            string? isNeutered,
            string? allergies,
            string? chronicConditions,
            string? microchipNumber,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new PetHealthProfileDomain
            {
                Id = id,
                PetId = petId,
                CurrentWeightKg = currentWeightKg,
                Color = color,
                IsNeutered = isNeutered,
                Allergies = allergies,
                ChronicConditions = chronicConditions,
                MicrochipNumber = microchipNumber,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public void UpdateHealthInfo(
            decimal? currentWeightKg,
            string? color,
            string? isNeutered,
            string? allergies,
            string? chronicConditions,
            string? microchipNumber)
        {
            if (currentWeightKg != null) CurrentWeightKg = currentWeightKg;
            if (color != null) Color = color;
            if (isNeutered != null) ValidateAndSetIsNeutered(isNeutered);
            if (allergies != null) Allergies = allergies;
            if (chronicConditions != null) ChronicConditions = chronicConditions;
            if (microchipNumber != null) MicrochipNumber = microchipNumber;
            UpdatedAt = DateTime.UtcNow;
        }

        private void ValidateAndSetIsNeutered(string? isNeutered)
        {
            var validValues = new[] { "Yes", "No", "Unknown" };
            if (!Array.Exists(validValues, v => v.Equals(isNeutered, StringComparison.OrdinalIgnoreCase)))
                throw new DomainException("Giá trị IsNeutered không hợp lệ. Chỉ chấp nhận: Yes, No, Unknown.");
            IsNeutered = isNeutered;
        }

        private static void ValidateIsNeutered(string? isNeutered)
        {
            if (isNeutered == null) return;
            var validValues = new[] { "Yes", "No", "Unknown" };
            if (!Array.Exists(validValues, v => v.Equals(isNeutered, StringComparison.OrdinalIgnoreCase)))
                throw new DomainException("Giá trị IsNeutered không hợp lệ. Chỉ chấp nhận: Yes, No, Unknown.");
        }
    }
}
