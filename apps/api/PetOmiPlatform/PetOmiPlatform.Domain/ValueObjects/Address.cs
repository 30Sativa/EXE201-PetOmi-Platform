using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.ValueObjects
{
    public sealed class Address : IEquatable<Address>
    {
        public string Value { get; }

        public Address(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new DomainException("Địa chỉ không được để trống");

            var trimmed = value.Trim();

            if (trimmed.Length < 10)
                throw new DomainException("Địa chỉ quá ngắn. Vui lòng nhập địa chỉ đầy đủ");

            if (trimmed.Length > 500)
                throw new DomainException("Địa chỉ quá dài. Tối đa 500 ký tự");

            Value = trimmed;
        }

        public bool Equals(Address? other) =>
            other is not null && Value == other.Value;

        public override bool Equals(object? obj) => Equals(obj as Address);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;

        public static implicit operator string(Address address) => address.Value;
        public static explicit operator Address(string? value) => new(value);
    }
}
