using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Common.Models
{
    public class PagedData<T>
    {
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public PaginationMeta<T> Meta { get; set; } = new();
    }
}
