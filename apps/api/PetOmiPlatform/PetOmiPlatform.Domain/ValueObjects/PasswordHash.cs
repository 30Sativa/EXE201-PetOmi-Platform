using PetOmiPlatform.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.ValueObjects
{
    public sealed class PasswordHash 
    {
        public string Value { get; }
        public PasswordHash(string? hash)
        {
            if (hash != null && string.IsNullOrWhiteSpace(hash))
                throw new DomainException("PasswordHash không hợp lệ");
            Value = hash;
        }
    }
}
