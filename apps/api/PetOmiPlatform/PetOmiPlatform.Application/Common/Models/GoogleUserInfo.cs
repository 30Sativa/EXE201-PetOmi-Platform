using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Common.Models
{
    public record GoogleUserInfo(
    string ProviderKey,
    string Email,
    string? Name
);
}
