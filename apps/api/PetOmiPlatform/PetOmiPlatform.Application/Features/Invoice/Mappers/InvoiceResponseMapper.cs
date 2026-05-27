using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Invoice.Mappers
{
    public static class InvoiceResponseMapper
    {
        public static InvoiceResponse ToResponse(
            this InvoiceDomain invoice,
            IEnumerable<InvoiceItemDomain>? items = null,
            IEnumerable<string>? warnings = null)
        {
            return new InvoiceResponse
            {
                Id = invoice.Id,
                AppointmentId = invoice.AppointmentId,
                ExaminationId = invoice.ExaminationId,
                ClinicId = invoice.ClinicId,
                InvoiceCode = invoice.InvoiceCode,
                TotalAmount = invoice.TotalAmount,
                DiscountAmount = invoice.DiscountAmount,
                FinalAmount = invoice.FinalAmount,
                Status = invoice.Status.ToString(),
                PaymentProvider = invoice.PaymentProvider.ToString(),
                PaymentReference = invoice.PaymentReference,
                QrCodeUrl = invoice.QrCodeUrl,
                BankAccountNo = invoice.BankAccountNo,
                BankCode = invoice.BankCode,
                PaidAmount = invoice.PaidAmount,
                OverpaidAmount = invoice.PaidAmount.HasValue && invoice.PaidAmount.Value > invoice.FinalAmount
                    ? invoice.PaidAmount.Value - invoice.FinalAmount
                    : 0m,
                PaymentWebhookAt = invoice.PaymentWebhookAt,
                PaymentMethod = invoice.PaymentMethod?.ToString(),
                CancellationReason = invoice.CancellationReason,
                CancelledByUserId = invoice.CancelledByUserId,
                CancelledAt = invoice.CancelledAt,
                RequiresManualRefund = invoice.RequiresManualRefund,
                RefundNote = invoice.RefundNote,
                RefundConfirmedByUserId = invoice.RefundConfirmedByUserId,
                RefundConfirmedAt = invoice.RefundConfirmedAt,
                Notes = invoice.Notes,
                PaidAt = invoice.PaidAt,
                CreatedAt = invoice.CreatedAt,
                Warnings = warnings?.ToList() ?? new List<string>(),
                Items = items?.Select(ToResponse).ToList() ?? new List<InvoiceItemResponse>()
            };
        }

        public static InvoiceItemResponse ToResponse(this InvoiceItemDomain item)
        {
            return new InvoiceItemResponse
            {
                Id = item.Id,
                ItemType = item.ItemType.ToString(),
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.TotalPrice,
                ServiceId = item.ServiceId,
                InventoryItemId = item.InventoryItemId
            };
        }
    }
}
