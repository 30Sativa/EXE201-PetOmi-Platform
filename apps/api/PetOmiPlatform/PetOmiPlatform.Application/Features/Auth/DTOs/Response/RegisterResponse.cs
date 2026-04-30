using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Feature.Auth.DTOs.Response
{
    public class RegisterResponse
    {
        public Guid UserId { get; set; }
        public string Email { get; set; }
    }
}
