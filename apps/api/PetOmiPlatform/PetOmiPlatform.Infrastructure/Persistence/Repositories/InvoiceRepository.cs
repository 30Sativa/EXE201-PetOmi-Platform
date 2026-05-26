using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Models;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly PetOmniDbContext _context;

        public InvoiceRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(InvoiceDomain invoice)
        {
            await _context.Invoices.AddAsync(invoice.ToEntity());
        }

        public async Task AddItemsAsync(IEnumerable<InvoiceItemDomain> items)
        {
            var entities = items.Select(i => i.ToEntity());
            await _context.InvoiceItems.AddRangeAsync(entities);
        }

        public async Task<InvoiceDomain?> GetByIdAsync(Guid invoiceId)
        {
            var entity = await _context.Invoices.FindAsync(invoiceId);
            return entity?.ToDomain();
        }

        public async Task<InvoiceDomain?> GetByInvoiceCodeAsync(string invoiceCode)
        {
            var entity = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceCode == invoiceCode);
            return entity?.ToDomain();
        }

        public async Task<InvoiceDomain?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            var entity = await _context.Invoices
                .Where(i => i.AppointmentId == appointmentId && i.Status != "Cancelled")
                .FirstOrDefaultAsync();
            return entity?.ToDomain();
        }

        public async Task<InvoiceDomain?> GetByPaymentReferenceAsync(string paymentReference)
        {
            var entity = await _context.Invoices
                .Where(i => i.PaymentReference == paymentReference && i.Status != "Cancelled")
                .FirstOrDefaultAsync();

            return entity?.ToDomain();
        }

        public async Task<IEnumerable<InvoiceItemDomain>> GetItemsByInvoiceIdAsync(Guid invoiceId)
        {
            return await _context.InvoiceItems
                .Where(i => i.InvoiceId == invoiceId)
                .Select(i => i.ToDomain())
                .ToListAsync();
        }

        public async Task<IEnumerable<InvoiceDomain>> GetByClinicIdAsync(Guid clinicId, int page, int pageSize)
        {
            return await _context.Invoices
                .Where(i => i.ClinicId == clinicId)
                .OrderByDescending(i => i.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => i.ToDomain())
                .ToListAsync();
        }

        public async Task<(int UnpaidCount, decimal UnpaidAmount)> GetUnpaidSummaryByClinicIdAsync(Guid clinicId)
        {
            var query = _context.Invoices.Where(i =>
                i.ClinicId == clinicId &&
                i.Status == "Unpaid");

            var count = await query.CountAsync();
            var amount = await query.SumAsync(i => (decimal?)i.FinalAmount) ?? 0m;

            return (count, amount);
        }

        public async Task<InvoiceAgingBucketSummary> GetUnpaidAgingBucketSummaryByClinicIdAsync(Guid clinicId)
        {
            var nowUtc = DateTime.UtcNow;

            var query = _context.Invoices
                .Where(i => i.ClinicId == clinicId && i.Status == "Unpaid");

            var bucket = await query
                .GroupBy(_ => 1)
                .Select(g => new InvoiceAgingBucketSummary
                {
                    Count0To7Days = g.Count(i =>
                        EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) >= 0 &&
                        EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) <= 7),
                    Amount0To7Days = g.Where(i =>
                            EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) >= 0 &&
                            EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) <= 7)
                        .Sum(i => (decimal?)i.FinalAmount) ?? 0m,

                    Count8To30Days = g.Count(i =>
                        EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) >= 8 &&
                        EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) <= 30),
                    Amount8To30Days = g.Where(i =>
                            EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) >= 8 &&
                            EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) <= 30)
                        .Sum(i => (decimal?)i.FinalAmount) ?? 0m,

                    Count31PlusDays = g.Count(i =>
                        EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) >= 31),
                    Amount31PlusDays = g.Where(i =>
                            EF.Functions.DateDiffDay(i.CreatedAt, nowUtc) >= 31)
                        .Sum(i => (decimal?)i.FinalAmount) ?? 0m
                })
                .FirstOrDefaultAsync();

            return bucket ?? new InvoiceAgingBucketSummary();
        }

        public async Task<bool> HasActiveInvoiceAsync(Guid appointmentId)
        {
            return await _context.Invoices
                .AnyAsync(i => i.AppointmentId == appointmentId && (i.Status == "Unpaid" || i.Status == "Paid"));
        }

        public async Task UpdateAsync(InvoiceDomain invoice)
        {
            var entity = await _context.Invoices.FindAsync(invoice.Id);
            if (entity == null) return;

            var updated = invoice.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
