using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Response
{
    public class PetActivityResponse
    {
        // Unique identifier of the activity entry.
        public Guid ActivityId { get; set; }

        // The pet this activity belongs to.
        public Guid PetId { get; set; }

        // Type of activity: MedicalRecord, WeightLog, Photo, Reminder, Appointment, HealthProfile
        public string ActivityType { get; set; } = null!;

        // Human-readable title for the activity.
        public string Title { get; set; } = null!;

        // Optional detailed description of the activity.
        public string? Description { get; set; }

        // When the activity occurred (record date, appointment date, measurement time).
        public DateTime OccurredAt { get; set; }

        // When this record was created in the system.
        public DateTime CreatedAt { get; set; }

        // ID of the source entity (MedicalRecordId, WeightLogId, PhotoId, etc.).
        public Guid? SourceId { get; set; }

        // Icon identifier for display purposes (e.g., "syringe", "scale", "camera").
        public string Icon { get; set; } = null!;

        // Display color for the activity type (hex code).
        public string Color { get; set; } = null!;

        // Additional metadata specific to the activity type (JSON string).
        public string? Metadata { get; set; }
    }

    // Paginated response for pet timeline queries.
    public class PetTimelineResponse
    {
        // List of activity entries sorted by occurredAt descending (newest first).
        public List<PetActivityResponse> Activities { get; set; } = new();

        // Total number of activities across all pages.
        public int TotalCount { get; set; }

        // Current page number (1-indexed).
        public int Page { get; set; }

        // Number of items per page.
        public int PageSize { get; set; }

        // Whether there are more pages after this one.
        public bool HasNextPage { get; set; }
    }
}
