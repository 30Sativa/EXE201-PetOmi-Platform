using PetOmiPlatform.Domain.Exceptions;
using System.Text.RegularExpressions;

namespace PetOmiPlatform.Domain.ValueObjects
{
    public sealed class PhoneNumber : IEquatable<PhoneNumber>
    {
        private static readonly Regex PhoneRegex = new(
            @"^(0[0-9]{9,10})$",
            RegexOptions.Compiled);

        public string Value { get; }

        public PhoneNumber(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new DomainException("Số điện thoại không được để trống");

            value = value.Trim();

            if (!PhoneRegex.IsMatch(value))
                throw new DomainException("Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số bắt đầu bằng 0");

            Value = value;
        }

        public bool Equals(PhoneNumber? other) =>
            other is not null && Value == other.Value;

        public override bool Equals(object? obj) => Equals(obj as PhoneNumber);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;

        public static implicit operator string(PhoneNumber phoneNumber) => phoneNumber.Value;
        public static explicit operator PhoneNumber(string? value) => new(value);
    }
}
