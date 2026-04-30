using PetOmiPlatform.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace PetOmiPlatform.Domain.ValueObjects
{
    public sealed class Email : IEquatable<Email>
    {
        // Regex chuẩn hơn 
        private static readonly Regex EmailRegex = new(
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public string Value { get; }
        public string NormalizedValue { get; }

        public Email(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new DomainException("Email không được để trống");

            value = value.Trim();

            if (!EmailRegex.IsMatch(value))
                throw new DomainException("Email không hợp lệ");

            Value = value;
            NormalizedValue = value.ToLowerInvariant();
        }

        public bool Equals(Email? other) =>
            other is not null && NormalizedValue == other.NormalizedValue;

        public override bool Equals(object? obj) => Equals(obj as Email);
        public override int GetHashCode() => NormalizedValue.GetHashCode();
        public override string ToString() => Value;
    }
}
