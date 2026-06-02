using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Invoice.Mappers
{
    public static class InvoiceAgingItemResponseMapper
    {
        public static InvoiceAgingItemResponse ToAgingItemResponse(this InvoiceDomain invoice, DateTime todayUtc)
        {
            var pendingDays = (todayUtc.Date - invoice.CreatedAt.Date).Days;
            if (pendingDays < 0)
            {
                pendingDays = 0;
            }

            return new InvoiceAgingItemResponse
            {
                InvoiceId = invoice.Id,
                InvoiceCode = invoice.InvoiceCode,
                AppointmentId = invoice.AppointmentId,
                OrderId = invoice.OrderId,
                ClinicId = invoice.ClinicId,
                InvoiceSource = invoice.InvoiceSource.ToString(),
                FinalAmount = invoice.FinalAmount,
                PendingDays = pendingDays,
                PaymentProvider = invoice.PaymentProvider.ToString(),
                PaymentReference = invoice.PaymentReference,
                CreatedAt = invoice.CreatedAt
            };
        }
    }
}
