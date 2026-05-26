using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IInvoiceRepository
    {
        Task AddAsync(InvoiceDomain invoice);
        Task AddItemsAsync(IEnumerable<InvoiceItemDomain> items);
        Task<InvoiceDomain?> GetByIdAsync(Guid invoiceId);
        Task<InvoiceDomain?> GetByInvoiceCodeAsync(string invoiceCode);
        Task<InvoiceDomain?> GetByAppointmentIdAsync(Guid appointmentId);
        Task<InvoiceDomain?> GetByPaymentReferenceAsync(string paymentReference);
        Task<IEnumerable<InvoiceItemDomain>> GetItemsByInvoiceIdAsync(Guid invoiceId);
        Task<IEnumerable<InvoiceDomain>> GetByClinicIdAsync(Guid clinicId, int page, int pageSize);
        Task<bool> HasActiveInvoiceAsync(Guid appointmentId);
        Task UpdateAsync(InvoiceDomain invoice);
    }
}
