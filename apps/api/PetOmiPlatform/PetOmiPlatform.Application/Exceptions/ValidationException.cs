using FluentValidation.Results;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Exceptions
{
    public class ValidationException : Exception
    {
        public IReadOnlyList<string> Errors { get; }

        public ValidationException(IEnumerable<ValidationFailure> failures)
            : base("One or more validation errors occurred.")
        {
            Errors = failures.Select(f => f.ErrorMessage).ToList();
        }

        // overload nếu không dùng FluentValidation
        public ValidationException(IEnumerable<string> errors)
            : base("One or more validation errors occurred.")
        {
            Errors = errors.ToList();
        }
    }
}
