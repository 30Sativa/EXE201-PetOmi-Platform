using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Common.Interfaces
{
    // Command nào implement interface này sẽ được tự động audit
    public interface IAuditableCommand
    {
        Guid? UserId { get; }
        string Action { get; }
        string Category { get; }
    }
}
