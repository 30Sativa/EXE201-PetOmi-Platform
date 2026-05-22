using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class InvoiceMapper
    {
        public static InvoiceDomain ToDomain(this Invoice entity) =>
            InvoiceDomain.Reconstitute(
                id: entity.InvoiceId,
                appointmentId: entity.AppointmentId,
                examinationId: entity.ExaminationId,
                clinicId: entity.ClinicId,
                totalAmount: entity.TotalAmount,
                discountAmount: entity.DiscountAmount,
                finalAmount: entity.FinalAmount,
                status: Enum.Parse<InvoiceStatus>(entity.Status),
                paymentMethod: entity.PaymentMethod is null ? null : Enum.Parse<PaymentMethod>(entity.PaymentMethod),
                notes: entity.Notes,
                paidAt: entity.PaidAt,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );

        public static Invoice ToEntity(this InvoiceDomain domain) =>
            new Invoice
            {
                InvoiceId = domain.Id,
                AppointmentId = domain.AppointmentId,
                ExaminationId = domain.ExaminationId,
                ClinicId = domain.ClinicId,
                TotalAmount = domain.TotalAmount,
                DiscountAmount = domain.DiscountAmount,
                FinalAmount = domain.FinalAmount,
                Status = domain.Status.ToString(),
                PaymentMethod = domain.PaymentMethod?.ToString(),
                Notes = domain.Notes,
                PaidAt = domain.PaidAt,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };

        public static InvoiceItemDomain ToDomain(this InvoiceItem entity) =>
            InvoiceItemDomain.Reconstitute(
                id: entity.InvoiceItemId,
                invoiceId: entity.InvoiceId,
                itemType: Enum.Parse<InvoiceItemType>(entity.ItemType),
                description: entity.Description,
                quantity: entity.Quantity,
                unitPrice: entity.UnitPrice,
                totalPrice: entity.TotalPrice,
                serviceId: entity.ServiceId,
                inventoryItemId: entity.InventoryItemId
            );

        public static InvoiceItem ToEntity(this InvoiceItemDomain domain) =>
            new InvoiceItem
            {
                InvoiceItemId = domain.Id,
                InvoiceId = domain.InvoiceId,
                ItemType = domain.ItemType.ToString(),
                Description = domain.Description,
                Quantity = domain.Quantity,
                UnitPrice = domain.UnitPrice,
                TotalPrice = domain.TotalPrice,
                ServiceId = domain.ServiceId,
                InventoryItemId = domain.InventoryItemId
            };
    }
}
