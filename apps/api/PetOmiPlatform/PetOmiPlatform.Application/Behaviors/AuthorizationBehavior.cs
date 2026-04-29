using MediatR;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Behaviors
{
    public class AuthorizationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    {
        private readonly ICurrentUserService _user;

        public AuthorizationBehavior(ICurrentUserService user)
        {
            _user = user;
        }
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            if (_user.UserId == null)
                throw new UnauthorizedAccessException();

            return await next();
        }
    }
}
