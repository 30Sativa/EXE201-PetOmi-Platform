using PetOmiPlatform.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.ValueObjects
{
    public sealed class Email : IEquatable<Email>
    {
        public string Value { get; }
        public string NormalizedValue { get; }

        public Email(string value)
        {
            if(string.IsNullOrEmpty(value)) throw new DomainException("Email không được để trống");
            if(!value.Contains("@")) throw new DomainException("Email không hợp lệ");

            Value = value.Trim();
            NormalizedValue = Value.ToLower();
        }

        public bool Equals(Email? other)
        {
            return other is not null &&  NormalizedValue == other.NormalizedValue;
        }

        public override bool Equals(object? obj)
        {
            return Equals(obj as Email);
        }

        public override int GetHashCode()
        {
            return NormalizedValue.GetHashCode();
        }
    }
}
