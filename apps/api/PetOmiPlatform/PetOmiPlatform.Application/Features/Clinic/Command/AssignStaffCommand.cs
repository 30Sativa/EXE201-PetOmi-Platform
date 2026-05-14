using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record AssignStaffCommand (
        Guid RequestingUserId, // ClinicOwner
        Guid ClinicId,
        AssignStaffRequest Request) : IRequest;
    
    
}
