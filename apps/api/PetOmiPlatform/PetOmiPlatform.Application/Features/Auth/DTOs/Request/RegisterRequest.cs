using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.DTOs.Request
{
    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }

        // Ma gioi thieu (tuy chon). Khong nhap cung khong sao.
        public string? ReferralCode { get; set; }
    }
}
