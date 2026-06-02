using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Invoice.Mappers
{
    public static class PendingManualRefundItemResponseMapper
    {
        public static PendingManualRefundItemResponse ToPendingManualRefundItemResponse(this InvoiceDomain invoice)
        {
            var baseDate = invoice.CancelledAt ?? invoice.UpdatedAt ?? invoice.CreatedAt;
            var pendingDays = (int)Math.Floor((DateTime.UtcNow - baseDate).TotalDays);
            if (pendingDays < 0)
            {
                pendingDays = 0;
            }

            return new PendingManualRefundItemResponse
            {
                InvoiceId = invoice.Id,
                InvoiceCode = invoice.InvoiceCode,
                AppointmentId = invoice.AppointmentId,
                OrderId = invoice.OrderId,
                InvoiceSource = invoice.InvoiceSource.ToString(),
                FinalAmount = invoice.FinalAmount,
                PaidAmount = invoice.PaidAmount,
                CancelledAt = invoice.CancelledAt,
                CancellationReason = invoice.CancellationReason,
                PendingDays = pendingDays
            };
        }
    }
}
