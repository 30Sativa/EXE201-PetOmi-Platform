using PetOmiPlatform.Domain.Common;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetWeightLogDomain : BaseEntity
    {
        public Guid PetId { get; private set; }
        public decimal WeightKg { get; private set; }
        public DateTime MeasuredAt { get; private set; }
        public string? Source { get; private set; }
        public string? Note { get; private set; }
        public DateTime CreatedAt { get; private set; }

        private PetWeightLogDomain() { }

        private PetWeightLogDomain(
            Guid petId,
            decimal weightKg,
            DateTime measuredAt,
            string? source,
            string? note)
        {
            Id = Guid.NewGuid();
            PetId = petId;
            WeightKg = weightKg;
            MeasuredAt = measuredAt;
            Source = source;
            Note = note;
            CreatedAt = DateTime.UtcNow;
        }

        public static PetWeightLogDomain Create(
            Guid petId,
            decimal weightKg,
            DateTime measuredAt,
            string? source,
            string? note)
        {
            ValidateWeight(weightKg);
            return new PetWeightLogDomain(petId, weightKg, measuredAt, source, note);
        }

        public static PetWeightLogDomain Reconstitute(
            Guid id,
            Guid petId,
            decimal weightKg,
            DateTime measuredAt,
            string? source,
            string? note,
            DateTime createdAt)
        {
            return new PetWeightLogDomain
            {
                Id = id,
                PetId = petId,
                WeightKg = weightKg,
                MeasuredAt = measuredAt,
                Source = source,
                Note = note,
                CreatedAt = createdAt
            };
        }

        private static void ValidateWeight(decimal weightKg)
        {
            if (weightKg <= 0)
                throw new Domain.Exceptions.DomainException("Cân nặng phải lớn hơn 0.");
            if (weightKg > 1000)
                throw new Domain.Exceptions.DomainException("Cân nặng không hợp lệ (quá lớn).");
        }
    }
}
