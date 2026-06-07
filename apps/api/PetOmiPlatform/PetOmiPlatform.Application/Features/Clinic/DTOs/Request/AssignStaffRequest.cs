using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class AssignStaffRequest
    {
        public Guid? VetProfileId { get; set; }
        public string? VetEmail { get; set; }
        public string Role { get; set; } = null!; // "PrimaryVet", "Assistant" hoặc "Cashier"
    }
}
