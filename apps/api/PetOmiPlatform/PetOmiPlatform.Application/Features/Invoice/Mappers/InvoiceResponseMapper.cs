using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Invoice.Mappers
{
    public static class InvoiceResponseMapper
    {
        public static InvoiceResponse ToResponse(
            this InvoiceDomain invoice,
            IEnumerable<InvoiceItemDomain>? items = null)
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
                PaymentWebhookAt = invoice.PaymentWebhookAt,
                PaymentMethod = invoice.PaymentMethod?.ToString(),
                Notes = invoice.Notes,
                PaidAt = invoice.PaidAt,
                CreatedAt = invoice.CreatedAt,
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
