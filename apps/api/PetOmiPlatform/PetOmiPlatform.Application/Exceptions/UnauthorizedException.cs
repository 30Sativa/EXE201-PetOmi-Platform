using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Exceptions
{
    public class UnauthorizedException : Exception
    {
        public UnauthorizedException(string message = "Unauthorized.")
            : base(message) { }
    }
}
