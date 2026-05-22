using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class InvoiceDomain : BaseEntity
    {
        public Guid AppointmentId { get; private set; }
        public Guid? ExaminationId { get; private set; }
        public Guid ClinicId { get; private set; }

        public decimal TotalAmount { get; private set; }
        public decimal DiscountAmount { get; private set; }
        public decimal FinalAmount { get; private set; }    // TotalAmount - DiscountAmount

        public InvoiceStatus Status { get; private set; }
        public PaymentMethod? PaymentMethod { get; private set; }
        public string? Notes { get; private set; }

        public DateTime? PaidAt { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private InvoiceDomain() { }

        public static InvoiceDomain Create(
            Guid appointmentId,
            Guid clinicId,
            decimal totalAmount,
            decimal discountAmount = 0,
            Guid? examinationId = null,
            string? notes = null)
        {
            if (totalAmount < 0)
                throw new DomainException("Tổng tiền không được âm.");
            if (discountAmount < 0)
                throw new DomainException("Giảm giá không được âm.");
            if (discountAmount > totalAmount)
                throw new DomainException("Giảm giá không được lớn hơn tổng tiền.");

            return new InvoiceDomain
            {
                Id = Guid.NewGuid(),
                AppointmentId = appointmentId,
                ExaminationId = examinationId,
                ClinicId = clinicId,
                TotalAmount = totalAmount,
                DiscountAmount = discountAmount,
                FinalAmount = totalAmount - discountAmount,
                Status = InvoiceStatus.Unpaid,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static InvoiceDomain Reconstitute(
            Guid id, Guid appointmentId, Guid? examinationId, Guid clinicId,
            decimal totalAmount, decimal discountAmount, decimal finalAmount,
            InvoiceStatus status, PaymentMethod? paymentMethod, string? notes,
            DateTime? paidAt, DateTime createdAt, DateTime? updatedAt)
        {
            return new InvoiceDomain
            {
                Id = id,
                AppointmentId = appointmentId,
                ExaminationId = examinationId,
                ClinicId = clinicId,
                TotalAmount = totalAmount,
                DiscountAmount = discountAmount,
                FinalAmount = finalAmount,
                Status = status,
                PaymentMethod = paymentMethod,
                Notes = notes,
                PaidAt = paidAt,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        /// <summary>Thanh toán hóa đơn (Unpaid → Paid)</summary>
        public void Pay(PaymentMethod method)
        {
            if (Status != InvoiceStatus.Unpaid)
                throw new DomainException("Chỉ có thể thanh toán hóa đơn chưa thanh toán.");

            Status = InvoiceStatus.Paid;
            PaymentMethod = method;
            PaidAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Hủy hóa đơn — chỉ được hủy khi chưa thanh toán</summary>
        public void Cancel()
        {
            if (Status == InvoiceStatus.Paid)
                throw new DomainException("Không thể hủy hóa đơn đã thanh toán.");
            if (Status == InvoiceStatus.Cancelled)
                throw new DomainException("Hóa đơn đã được hủy rồi.");

            Status = InvoiceStatus.Cancelled;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
