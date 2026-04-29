using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Exceptions
{
    public class ForbiddenException : Exception
    {
        public ForbiddenException(string message = "You do not have permission to perform this action.")
            : base(message) { }
    }
}
