using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Exceptions
{
    // ConflictException.cs — khi resource đã tồn tại
    // ví dụ: email đã đăng ký, order đã được xử lý
    public class ConflictException : Exception
    {
        public ConflictException(string name, object key)
            : base($"{name} with '{key}' already exists.") { }

        public ConflictException(string message)
            : base(message) { }
    }
}
