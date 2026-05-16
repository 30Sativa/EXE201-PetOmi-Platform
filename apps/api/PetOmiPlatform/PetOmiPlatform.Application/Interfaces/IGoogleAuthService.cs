using PetOmiPlatform.Application.Common.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IGoogleAuthService
    {
        Task<GoogleUserInfo> GetUserInfoAsync(string accessToken);
    }
}
