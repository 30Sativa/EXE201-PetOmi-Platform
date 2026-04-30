using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Feature.Auth.DTOs.Request
{
    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
