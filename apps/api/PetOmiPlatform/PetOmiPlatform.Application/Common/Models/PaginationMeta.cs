using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Common.Models
{
    public class PaginationMeta<T>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalRecords / PageSize);
        public bool HasNext => PageNumber < TotalPages;
        public bool HasPrevious => PageNumber > 1;
    }
}
