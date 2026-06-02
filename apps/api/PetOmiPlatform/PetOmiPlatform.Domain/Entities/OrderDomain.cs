using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class OrderDomain : BaseEntity
    {
        public Guid ClinicId { get; private set; }
        public Guid? CustomerUserId { get; private set; }
        public Guid? PetId { get; private set; }
        public Guid? AppointmentId { get; private set; }
        public OrderType OrderType { get; private set; }
        public OrderStatus Status { get; private set; }
        public decimal TotalAmount { get; private set; }
        public string? Notes { get; private set; }
        public Guid CreatedByUserId { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public DateTime? ConfirmedAt { get; private set; }
        public DateTime? PaidAt { get; private set; }
        public DateTime? CancelledAt { get; private set; }

        private OrderDomain() { }

        public static OrderDomain Create(
            Guid clinicId,
            Guid createdByUserId,
            OrderType orderType,
            Guid? customerUserId = null,
            Guid? petId = null,
            Guid? appointmentId = null,
            string? notes = null)
        {
            if (clinicId == Guid.Empty)
                throw new DomainException("ClinicId khong hop le.");
            if (createdByUserId == Guid.Empty)
                throw new DomainException("Nguoi tao don khong hop le.");

            return new OrderDomain
            {
                Id = Guid.NewGuid(),
                ClinicId = clinicId,
                CustomerUserId = customerUserId,
                PetId = petId,
                AppointmentId = appointmentId,
                OrderType = orderType,
                Status = OrderStatus.Draft,
                TotalAmount = 0,
                Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
                CreatedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static OrderDomain Reconstitute(
            Guid id,
            Guid clinicId,
            Guid? customerUserId,
            Guid? petId,
            Guid? appointmentId,
            OrderType orderType,
            OrderStatus status,
            decimal totalAmount,
            string? notes,
            Guid createdByUserId,
            DateTime createdAt,
            DateTime? updatedAt,
            DateTime? confirmedAt,
            DateTime? paidAt,
            DateTime? cancelledAt)
        {
            return new OrderDomain
            {
                Id = id,
                ClinicId = clinicId,
                CustomerUserId = customerUserId,
                PetId = petId,
                AppointmentId = appointmentId,
                OrderType = orderType,
                Status = status,
                TotalAmount = totalAmount,
                Notes = notes,
                CreatedByUserId = createdByUserId,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
                ConfirmedAt = confirmedAt,
                PaidAt = paidAt,
                CancelledAt = cancelledAt
            };
        }

        public void UpdateTotal(decimal totalAmount)
        {
            if (totalAmount < 0)
                throw new DomainException("Tong tien don hang khong duoc am.");
            if (Status == OrderStatus.Paid || Status == OrderStatus.Cancelled)
                throw new DomainException("Khong the cap nhat tong tien don hang da thanh toan hoac da huy.");

            TotalAmount = totalAmount;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Confirm()
        {
            if (Status != OrderStatus.Draft)
                throw new DomainException($"Chi co the xac nhan don hang dang Draft. Trang thai hien tai: {Status}");
            if (TotalAmount < 0)
                throw new DomainException("Tong tien don hang khong hop le.");

            Status = OrderStatus.Confirmed;
            ConfirmedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkInvoiced()
        {
            if (Status != OrderStatus.Draft && Status != OrderStatus.Confirmed)
                throw new DomainException($"Khong the tao hoa don cho don hang o trang thai {Status}.");

            Status = OrderStatus.Invoiced;
            if (!ConfirmedAt.HasValue)
                ConfirmedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkPaid()
        {
            if (Status == OrderStatus.Cancelled)
                throw new DomainException("Khong the thanh toan don hang da huy.");
            if (Status == OrderStatus.Paid)
                return;

            Status = OrderStatus.Paid;
            PaidAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Cancel()
        {
            if (Status == OrderStatus.Paid)
                throw new DomainException("Khong the huy don hang da thanh toan. Hay huy hoa don va xu ly hoan tien/hoan kho neu can.");
            if (Status == OrderStatus.Cancelled)
                throw new DomainException("Don hang da duoc huy.");

            Status = OrderStatus.Cancelled;
            CancelledAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
