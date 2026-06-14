using System;

namespace PetOmiPlatform.Application.Features.Auth.Services
{
    public static class AuthRedirectUrlBuilder
    {
        public const string MobileClient = "mobile";
        public const string WebClient = "web";

        private const string DefaultFrontendUrl = "http://localhost:5173";
        private const string DefaultMobileDeepLink = "petomi://";

        public static string NormalizeClient(string? client)
        {
            return IsMobileClient(client) ? MobileClient : WebClient;
        }

        public static string Build(
            string? client,
            string? frontendUrl,
            string? mobileDeepLink,
            string pathAndQuery)
        {
            var isMobile = IsMobileClient(client);
            var baseUrl = isMobile
                ? NormalizeMobileBase(mobileDeepLink)
                : NormalizeWebBase(frontendUrl);

            var path = NormalizePath(pathAndQuery, isMobile);
            return $"{baseUrl}{path}";
        }

        private static bool IsMobileClient(string? client)
        {
            return string.Equals(client, MobileClient, StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizeWebBase(string? frontendUrl)
        {
            var value = string.IsNullOrWhiteSpace(frontendUrl)
                ? DefaultFrontendUrl
                : frontendUrl.Trim();

            return value.TrimEnd('/');
        }

        private static string NormalizeMobileBase(string? mobileDeepLink)
        {
            var value = string.IsNullOrWhiteSpace(mobileDeepLink)
                ? DefaultMobileDeepLink
                : mobileDeepLink.Trim();

            var schemeSeparatorIndex = value.IndexOf("://", StringComparison.Ordinal);
            if (schemeSeparatorIndex >= 0)
            {
                var suffix = value[(schemeSeparatorIndex + 3)..];
                if (string.IsNullOrEmpty(suffix.Trim('/')))
                {
                    return value[..(schemeSeparatorIndex + 3)];
                }
            }

            return value.TrimEnd('/') + "/";
        }

        private static string NormalizePath(string pathAndQuery, bool isMobile)
        {
            var value = pathAndQuery.TrimStart('/');
            return isMobile ? value : "/" + value;
        }
    }
}
