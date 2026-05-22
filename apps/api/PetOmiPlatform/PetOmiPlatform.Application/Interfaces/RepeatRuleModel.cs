using System;
using System.Text.Json.Serialization;

namespace PetOmiPlatform.Application.Interfaces
{
    public class RepeatRuleModel
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public RepeatType Type { get; set; }
        public int Interval { get; set; } = 1;
        public int? Occurrences { get; set; }
        public DateTime? Until { get; set; }
        public string[]? TimesPerDay { get; set; }
        public int? DayOfMonth { get; set; }
    }

    public enum RepeatType
    {
        None,
        Daily,
        Weekly,
        Monthly
    }
}
