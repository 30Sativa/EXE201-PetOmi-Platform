using MediatR;
using PetOmiPlatform.Application.Features.Vet.DTOs.Request;
using PetOmiPlatform.Application.Features.Vet.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Vet.Command
{
    public record CreateVetProfileCommand(Guid UserId,CreateVetProfileRequest Request) : IRequest<CreateVetProfileResponse>;
}
