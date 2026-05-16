using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace PetOmiPlatform.Infrastructure.External
{
    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly HttpClient _httpClient;

        public GoogleAuthService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<GoogleUserInfo> GetUserInfoAsync(string accessToken)
        {
            // Gọi Google API để lấy thông tin user
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.GetAsync(
                "https://www.googleapis.com/oauth2/v3/userinfo");

            if (!response.IsSuccessStatusCode)
                throw new Exception("Không thể lấy thông tin từ Google.");

            var content = await response.Content.ReadAsStringAsync();

            var json = JsonDocument.Parse(content).RootElement;

            return new GoogleUserInfo(
                ProviderKey: json.GetProperty("sub").GetString()!,
                Email: json.GetProperty("email").GetString()!,
                Name: json.TryGetProperty("name", out var name) ? name.GetString() : null
            );
        }
    }
}
