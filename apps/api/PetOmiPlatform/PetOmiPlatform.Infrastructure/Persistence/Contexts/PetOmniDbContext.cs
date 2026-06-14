using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Persistence.Contexts;

public partial class PetOmniDbContext : DbContext
{
    public PetOmniDbContext()
    {
    }

    public PetOmniDbContext(DbContextOptions<PetOmniDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Appointment> Appointments { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Clinic> Clinics { get; set; }

    public virtual DbSet<ClinicReview> ClinicReviews { get; set; }

    public virtual DbSet<ClinicPaymentAccount> ClinicPaymentAccounts { get; set; }

    public virtual DbSet<SystemSetting> SystemSettings { get; set; }

    public virtual DbSet<ClinicService> ClinicServices { get; set; }

    public virtual DbSet<DoctorSchedule> DoctorSchedules { get; set; }

    public virtual DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }

    public virtual DbSet<ExternalLogin> ExternalLogins { get; set; }

    public virtual DbSet<Inventory> Inventories { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<InvoiceItem> InvoiceItems { get; set; }

    public virtual DbSet<LoginOtptoken> LoginOtptokens { get; set; }

    public virtual DbSet<MedicalExamination> MedicalExaminations { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<PaymentTransaction> PaymentTransactions { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<Pet> Pets { get; set; }

    public virtual DbSet<PetHealthProfile> PetHealthProfiles { get; set; }

    public virtual DbSet<PetHealthShareAccessLog> PetHealthShareAccessLogs { get; set; }

    public virtual DbSet<PetHealthShareToken> PetHealthShareTokens { get; set; }

    public virtual DbSet<PetMedicalRecord> PetMedicalRecords { get; set; }

    public virtual DbSet<PetPhoto> PetPhotos { get; set; }

    public virtual DbSet<PetUserAccess> PetUserAccesses { get; set; }

    public virtual DbSet<PetWeightLog> PetWeightLogs { get; set; }

    public virtual DbSet<Prescription> Prescriptions { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Reminder> Reminders { get; set; }

    public virtual DbSet<ReminderPreference> ReminderPreferences { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<RolePermission> RolePermissions { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserDevice> UserDevices { get; set; }

    public virtual DbSet<UserProfile> UserProfiles { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    public virtual DbSet<UserSession> UserSessions { get; set; }

    public virtual DbSet<VetClinic> VetClinics { get; set; }

    public virtual DbSet<VetClinicRole> VetClinicRoles { get; set; }

    public virtual DbSet<VetClinicRolePermission> VetClinicRolePermissions { get; set; }

    public virtual DbSet<VetProfile> VetProfiles { get; set; }

    public virtual DbSet<Conversation> Conversations { get; set; }
    public virtual DbSet<ChatMessage> ChatMessages { get; set; }
    public virtual DbSet<ChatSubscriptionPlan> ChatSubscriptionPlans { get; set; }
    public virtual DbSet<ChatSubscription> ChatSubscriptions { get; set; }
    public virtual DbSet<ChatSubscriptionPayment> ChatSubscriptionPayments { get; set; }

//    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
//#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
//        => optionsBuilder.UseSqlServer("Data Source=(local);Database=PetOmni_DB;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.AppointmentId).HasName("PK_Appointments");

            entity.HasIndex(e => new { e.ClinicId, e.AppointmentDate, e.Status }, "IX_Appointments_Clinic_Date");

            entity.HasIndex(e => new { e.Status, e.CreatedAt }, "IX_Appointments_Pending_CreatedAt").HasFilter("([Status]='Pending')");

            entity.HasIndex(e => new { e.PetId, e.AppointmentDate }, "IX_Appointments_Pet").IsDescending(false, true);

            entity.HasIndex(e => new { e.VetClinicId, e.AppointmentDate }, "IX_Appointments_VetClinic_Date").HasFilter("([VetClinicID] IS NOT NULL)");

            entity.Property(e => e.AppointmentId)
                .HasColumnName("AppointmentID")
                .ValueGeneratedNever();
            entity.Property(e => e.AppointmentType)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("Checkup");
            entity.Property(e => e.BookedByUserId).HasColumnName("BookedByUserID");
            entity.Property(e => e.CancellationReason).HasMaxLength(300);
            entity.Property(e => e.CancelledAt).HasColumnType("datetime");
            entity.Property(e => e.CancelledByUserId).HasColumnName("CancelledByUserID");
            entity.Property(e => e.CheckedInAt).HasColumnType("datetime");
            entity.Property(e => e.CheckedInByUserId).HasColumnName("CheckedInByUserID");
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.ConfirmedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.EndTime).HasPrecision(0);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.ServiceId).HasColumnName("ServiceID");
            entity.Property(e => e.StartTime).HasPrecision(0);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Pending");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.VetClinicId).HasColumnName("VetClinicID");

            entity.HasOne(d => d.BookedByUser).WithMany(p => p.AppointmentBookedByUsers)
                .HasForeignKey(d => d.BookedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_BookedBy");

            entity.HasOne(d => d.CancelledByUser).WithMany(p => p.AppointmentCancelledByUsers)
                .HasForeignKey(d => d.CancelledByUserId)
                .HasConstraintName("FK_Appointments_CancelledBy");

            entity.HasOne(d => d.CheckedInByUser).WithMany(p => p.AppointmentCheckedInByUsers)
                .HasForeignKey(d => d.CheckedInByUserId)
                .HasConstraintName("FK_Appointments_CheckedInBy");

            entity.HasOne(d => d.Clinic).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Clinic");

            entity.HasOne(d => d.Pet).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Pet");

            entity.HasOne(d => d.Service).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_Appointments_Service");

            entity.HasOne(d => d.VetClinic).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.VetClinicId)
                .HasConstraintName("FK_Appointments_VetClinic");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditLogId).HasName("PK__AuditLog__EB5F6CDDF97F5908");

            entity.ToTable("AuditLog");

            entity.Property(e => e.AuditLogId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("AuditLogID");
            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.Category)
                .HasMaxLength(50)
                .HasDefaultValue("System");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.EntityId).HasColumnName("EntityID");
            entity.Property(e => e.EntityType).HasMaxLength(100);
            entity.Property(e => e.Ipaddress)
                .HasMaxLength(50)
                .HasColumnName("IPAddress");
            entity.Property(e => e.Severity)
                .HasMaxLength(20)
                .HasDefaultValue("Info");
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__AuditLog__UserID__2739D489");
        });

        modelBuilder.Entity<Clinic>(entity =>
        {
            entity.HasKey(e => e.ClinicId).HasName("PK__Clinics__3347C2FD4612783E");

            entity.HasIndex(e => e.LicenseNumber, "UQ__Clinics__E8890166B2846302").IsUnique();

            entity.Property(e => e.ClinicId)
                .HasColumnName("ClinicID")
                .ValueGeneratedNever();
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.ClinicName).HasMaxLength(200);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.LicenseImageUrl).HasMaxLength(500);
            entity.Property(e => e.LicenseCloudinaryPublicId).HasMaxLength(500);
            entity.Property(e => e.LicenseNumber).HasMaxLength(100);
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            entity.Property(e => e.LogoCloudinaryPublicId).HasMaxLength(500);
            entity.Property(e => e.Longitude).HasColumnType("float");
            entity.Property(e => e.Latitude).HasColumnType("float");
            entity.Property(e => e.AppointmentBufferMins).HasDefaultValue(0);
            entity.Property(e => e.OpeningHours).HasMaxLength(500);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.RejectedReason).HasMaxLength(500);
            entity.Property(e => e.ReviewedByAdminId).HasColumnName("ReviewedByAdminID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.ReviewedByAdmin).WithMany(p => p.Clinics)
                .HasForeignKey(d => d.ReviewedByAdminId)
                .HasConstraintName("FK__Clinics__Reviewe__5DCAEF64");
        });

        modelBuilder.Entity<ClinicPaymentAccount>(entity =>
        {
            entity.HasIndex(e => new { e.ClinicId, e.Provider, e.IsActive }, "IX_ClinicPaymentAccounts_ClinicProvider");

            entity.Property(e => e.ClinicPaymentAccountId)
                .HasColumnName("ClinicPaymentAccountID")
                .ValueGeneratedNever();
            entity.Property(e => e.AccountName).HasMaxLength(200);
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.BankCode).HasMaxLength(30);
            entity.Property(e => e.BankName).HasMaxLength(100);
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Provider).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Clinic).WithMany(p => p.ClinicPaymentAccounts)
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClinicPaymentAccounts_Clinic");
        });

        modelBuilder.Entity<ClinicService>(entity =>
        {
            entity.HasKey(e => e.ServiceId);

            entity.HasIndex(e => e.ClinicId, "IX_ClinicServices_ClinicID");

            entity.Property(e => e.ServiceId)
                .HasColumnName("ServiceID")
                .ValueGeneratedNever();
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DurationMins).HasDefaultValue(30);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ServiceName).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Clinic).WithMany(p => p.ClinicServices)
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClinicServices_Clinic");
        });

        modelBuilder.Entity<DoctorSchedule>(entity =>
        {
            entity.HasKey(e => e.ScheduleId);

            entity.HasIndex(e => e.VetClinicId, "IX_DoctorSchedules_VetClinicID");

            entity.Property(e => e.ScheduleId)
                .HasColumnName("ScheduleID")
                .ValueGeneratedNever();
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.VetClinicId).HasColumnName("VetClinicID");

            entity.HasOne(d => d.VetClinic).WithMany(p => p.DoctorSchedules)
                .HasForeignKey(d => d.VetClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DoctorSchedules_VetClinic");
        });

        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.HasKey(e => e.VerificationTokenId).HasName("PK__EmailVer__764051B133BA9C60");

            entity.HasIndex(e => e.Token, "UQ__EmailVer__1EB4F817BED37782").IsUnique();

            entity.Property(e => e.VerificationTokenId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("VerificationTokenID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.Token).HasMaxLength(255);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.EmailVerificationTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__EmailVeri__UserI__7C4F7684");
        });

        modelBuilder.Entity<ExternalLogin>(entity =>
        {
            entity.HasKey(e => e.ExternalLoginId).HasName("PK__External__A8FDB38E2F4A91D6");

            entity.HasIndex(e => new { e.Provider, e.ProviderKey }, "UQ_ExternalLogins").IsUnique();

            entity.Property(e => e.ExternalLoginId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("ExternalLoginID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Provider).HasMaxLength(50);
            entity.Property(e => e.ProviderKey).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.ExternalLogins)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ExternalL__UserI__5224328E");
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasKey(e => e.ItemId);

            entity.ToTable("Inventory");

            entity.HasIndex(e => e.ClinicId, "IX_Inventory_ClinicID");

            entity.Property(e => e.ItemId)
                .HasColumnName("ItemID")
                .ValueGeneratedNever();
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.ItemName).HasMaxLength(200);
            entity.Property(e => e.LowStockThreshold).HasDefaultValue(10);
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.ImageCloudinaryPublicId).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Clinic).WithMany(p => p.Inventories)
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Inventory_Clinic");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(e => e.AppointmentId, "IX_Invoices_AppointmentID_Active")
                .IsUnique()
                .HasFilter("([AppointmentID] IS NOT NULL AND [Status] IN ('Unpaid', 'Paid'))");

            entity.HasIndex(e => e.OrderId, "IX_Invoices_OrderID_Active")
                .IsUnique()
                .HasFilter("([OrderID] IS NOT NULL AND [Status] IN ('Unpaid', 'Paid'))");

            entity.HasIndex(e => new { e.ClinicId, e.CreatedAt }, "IX_Invoices_ClinicID").IsDescending(false, true);
            entity.HasIndex(e => e.InvoiceCode, "UQ_Invoices_InvoiceCode").IsUnique();

            entity.Property(e => e.InvoiceId)
                .HasColumnName("InvoiceID")
                .ValueGeneratedNever();
            entity.Property(e => e.AppointmentId).HasColumnName("AppointmentID");
            entity.Property(e => e.BankAccountNo).HasMaxLength(50);
            entity.Property(e => e.BankCode).HasMaxLength(30);
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ExaminationId).HasColumnName("ExaminationID");
            entity.Property(e => e.FinalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.InvoiceCode).HasMaxLength(30);
            entity.Property(e => e.InvoiceSource)
                .HasMaxLength(20)
                .HasDefaultValue("Appointment");
            entity.Property(e => e.CancellationReason).HasMaxLength(500);
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.CancelledAt).HasColumnType("datetime");
            entity.Property(e => e.CancelledByUserId).HasColumnName("CancelledByUserID");
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.PaidAt).HasColumnType("datetime");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PaymentProvider)
                .HasMaxLength(20)
                .HasDefaultValue("Manual");
            entity.Property(e => e.PaymentReference).HasMaxLength(100);
            entity.Property(e => e.PaymentWebhookAt).HasColumnType("datetime");
            entity.Property(e => e.PaymentMethod).HasMaxLength(30);
            entity.Property(e => e.QrCodeUrl).HasMaxLength(1000);
            entity.Property(e => e.RefundConfirmedAt).HasColumnType("datetime");
            entity.Property(e => e.RefundConfirmedByUserId).HasColumnName("RefundConfirmedByUserID");
            entity.Property(e => e.RefundNote).HasMaxLength(500);
            entity.Property(e => e.RequiresManualRefund).HasDefaultValue(false);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Unpaid");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Appointment).WithOne(p => p.Invoice)
                .HasForeignKey<Invoice>(d => d.AppointmentId)
                .HasConstraintName("FK_Invoices_Appointment");

            entity.HasOne(d => d.Order).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_Invoices_Order");

            entity.HasOne(d => d.Clinic).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Invoices_Clinic");

            entity.HasOne(d => d.Examination).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.ExaminationId)
                .HasConstraintName("FK_Invoices_Examination");
        });

        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasIndex(e => e.InvoiceId, "IX_InvoiceItems_InvoiceID");

            entity.Property(e => e.InvoiceItemId)
                .HasColumnName("InvoiceItemID")
                .ValueGeneratedNever();
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.InventoryItemId).HasColumnName("InventoryItemID");
            entity.Property(e => e.InvoiceId).HasColumnName("InvoiceID");
            entity.Property(e => e.ItemType).HasMaxLength(30);
            entity.Property(e => e.OrderItemId).HasColumnName("OrderItemID");
            entity.Property(e => e.PrescriptionId).HasColumnName("PrescriptionID");
            entity.Property(e => e.Quantity).HasDefaultValue(1);
            entity.Property(e => e.ServiceId).HasColumnName("ServiceID");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.InventoryItem).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.InventoryItemId)
                .HasConstraintName("FK_InvoiceItems_Inventory");

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("FK_InvoiceItems_Invoice");

            entity.HasOne(d => d.OrderItem).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.OrderItemId)
                .HasConstraintName("FK_InvoiceItems_OrderItem");

            entity.HasOne(d => d.Prescription).WithMany()
                .HasForeignKey(d => d.PrescriptionId)
                .HasConstraintName("FK_InvoiceItems_Prescription");

            entity.HasOne(d => d.Service).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_InvoiceItems_Service");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasIndex(e => new { e.ClinicId, e.CreatedAt }, "IX_Orders_Clinic_CreatedAt").IsDescending(false, true);
            entity.HasIndex(e => new { e.ClinicId, e.Status }, "IX_Orders_Clinic_Status");

            entity.Property(e => e.OrderId)
                .HasColumnName("OrderID")
                .ValueGeneratedNever();
            entity.Property(e => e.AppointmentId).HasColumnName("AppointmentID");
            entity.Property(e => e.CancelledAt).HasColumnType("datetime");
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.ConfirmedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.CreatedByUserId).HasColumnName("CreatedByUserID");
            entity.Property(e => e.CustomerUserId).HasColumnName("CustomerUserID");
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.OrderType)
                .HasMaxLength(30)
                .HasDefaultValue("Retail");
            entity.Property(e => e.PaidAt).HasColumnType("datetime");
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Draft");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Appointment).WithMany()
                .HasForeignKey(d => d.AppointmentId)
                .HasConstraintName("FK_Orders_Appointment");

            entity.HasOne(d => d.Clinic).WithMany()
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Clinic");

            entity.HasOne(d => d.CreatedByUser).WithMany()
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_CreatedBy");

            entity.HasOne(d => d.CustomerUser).WithMany()
                .HasForeignKey(d => d.CustomerUserId)
                .HasConstraintName("FK_Orders_CustomerUser");

            entity.HasOne(d => d.Pet).WithMany()
                .HasForeignKey(d => d.PetId)
                .HasConstraintName("FK_Orders_Pet");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasIndex(e => e.OrderId, "IX_OrderItems_OrderID");
            entity.HasIndex(e => e.InventoryItemId, "IX_OrderItems_InventoryItemID");

            entity.Property(e => e.OrderItemId)
                .HasColumnName("OrderItemID")
                .ValueGeneratedNever();
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.InventoryItemId).HasColumnName("InventoryItemID");
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.PrescriptionId).HasColumnName("PrescriptionID");
            entity.Property(e => e.Quantity).HasDefaultValue(1);
            entity.Property(e => e.SourceType)
                .HasMaxLength(30)
                .HasDefaultValue("Retail");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.InventoryItem).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.InventoryItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Inventory");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_OrderItems_Order");

            entity.HasOne(d => d.Prescription).WithMany()
                .HasForeignKey(d => d.PrescriptionId)
                .HasConstraintName("FK_OrderItems_Prescription");
        });

        modelBuilder.Entity<LoginOtptoken>(entity =>
        {
            entity.HasKey(e => e.LoginOtpid).HasName("PK__LoginOTP__8E5FA00DAF50BECF");

            entity.ToTable("LoginOTPTokens");

            entity.Property(e => e.LoginOtpid)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("LoginOTPID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.Ipaddress)
                .HasMaxLength(50)
                .HasColumnName("IPAddress");
            entity.Property(e => e.Otpcode)
                .HasMaxLength(10)
                .HasColumnName("OTPCode");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.LoginOtptokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__LoginOTPT__UserI__09A971A2");
        });

        modelBuilder.Entity<MedicalExamination>(entity =>
        {
            entity.HasKey(e => e.ExaminationId);

            entity.HasIndex(e => e.AppointmentId, "IX_MedicalExaminations_AppointmentID").IsUnique();

            entity.HasIndex(e => new { e.PetId, e.CreatedAt }, "IX_MedicalExaminations_PetID").IsDescending(false, true);

            entity.Property(e => e.ExaminationId)
                .HasColumnName("ExaminationID")
                .ValueGeneratedNever();
            entity.Property(e => e.AppointmentId).HasColumnName("AppointmentID");
            entity.Property(e => e.ChiefComplaint).HasMaxLength(500);
            entity.Property(e => e.CompletedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("InProgress");
            entity.Property(e => e.TemperatureC).HasColumnType("decimal(4, 1)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.VetClinicId).HasColumnName("VetClinicID");
            entity.Property(e => e.WeightKg).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Appointment).WithOne(p => p.MedicalExamination)
                .HasForeignKey<MedicalExamination>(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MedicalExaminations_Appointment");

            entity.HasOne(d => d.Pet).WithMany(p => p.MedicalExaminations)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MedicalExaminations_Pet");

            entity.HasOne(d => d.VetClinic).WithMany(p => p.MedicalExaminations)
                .HasForeignKey(d => d.VetClinicId)
                .HasConstraintName("FK_MedicalExaminations_VetClinic");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.TokenId).HasName("PK__Password__658FEE8AD94BA356");

            entity.HasIndex(e => e.Token, "UQ__Password__1EB4F81748C36C09").IsUnique();

            entity.Property(e => e.TokenId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("TokenID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.Ipaddress)
                .HasMaxLength(50)
                .HasColumnName("IPAddress");
            entity.Property(e => e.Token).HasMaxLength(255);
            entity.Property(e => e.UsedAt).HasColumnType("datetime");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.PasswordResetTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PasswordR__UserI__02FC7413");
        });

        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasIndex(e => new { e.Provider, e.ProviderTransactionId }, "UQ_PaymentTransactions_ProviderTransaction")
                .IsUnique();

            entity.HasIndex(e => new { e.ClinicId, e.IsMatched, e.CreatedAt }, "IX_PaymentTransactions_Reconcile")
                .IsDescending(false, false, true);

            entity.HasIndex(e => new { e.InvoiceId, e.CreatedAt }, "IX_PaymentTransactions_Invoice")
                .IsDescending(false, true);

            entity.Property(e => e.PaymentTransactionId)
                .HasColumnName("PaymentTransactionID")
                .ValueGeneratedNever();
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Gateway).HasMaxLength(100);
            entity.Property(e => e.InvoiceId).HasColumnName("InvoiceID");
            entity.Property(e => e.IsMatched).HasDefaultValue(false);
            entity.Property(e => e.Provider).HasMaxLength(20);
            entity.Property(e => e.ProviderTransactionId).HasMaxLength(100);
            entity.Property(e => e.ReferenceCode).HasMaxLength(100);
            entity.Property(e => e.ReviewNote).HasMaxLength(500);
            entity.Property(e => e.ReviewedAt).HasColumnType("datetime");
            entity.Property(e => e.ReviewedByUserId).HasColumnName("ReviewedByUserID");
            entity.Property(e => e.TransferAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TransactionDate).HasColumnType("datetime");
            entity.Property(e => e.TransferContent).HasMaxLength(500);
            entity.Property(e => e.TransferType).HasMaxLength(10);

            entity.HasOne(d => d.Clinic).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PaymentTransactions_Clinic");

            entity.HasOne(d => d.Invoice).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("FK_PaymentTransactions_Invoice");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.PermissionId).HasName("PK__Permissi__EFA6FB0F967367F8");

            entity.HasIndex(e => e.PermissionName, "UQ__Permissi__0FFDA357B51590BB").IsUnique();

            entity.Property(e => e.PermissionId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PermissionID");
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.PermissionName).HasMaxLength(100);
        });

        modelBuilder.Entity<Pet>(entity =>
        {
            entity.HasKey(e => e.PetId).HasName("PK__Pets__48E538024F5F401D");

            entity.Property(e => e.PetId)
                .HasColumnName("PetID")
                .ValueGeneratedNever();
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500)
                .HasColumnName("AvatarURL");
            entity.Property(e => e.AvatarCloudinaryPublicId)
                .HasMaxLength(500);
            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Gender).HasMaxLength(20);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.OwnerUserId).HasColumnName("OwnerUserID");
            entity.Property(e => e.PublicPetCode).HasMaxLength(20);
            entity.Property(e => e.Species).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.OwnerUser).WithMany(p => p.Pets)
                .HasForeignKey(d => d.OwnerUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Pets_OwnerUser");
        });

        modelBuilder.Entity<PetHealthProfile>(entity =>
        {
            entity.HasKey(e => e.PetHealthProfileId).HasName("PK__PetHealt__AFC727A4758A9A41");

            entity.HasIndex(e => e.PetId, "UQ__PetHealt__48E5380376BDF0C6").IsUnique();

            entity.Property(e => e.PetHealthProfileId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PetHealthProfileID");
            entity.Property(e => e.Color).HasMaxLength(200);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.CurrentWeightKg).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.IsNeutered).HasMaxLength(20);
            entity.Property(e => e.MicrochipNumber).HasMaxLength(100);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Pet).WithOne(p => p.PetHealthProfile)
                .HasForeignKey<PetHealthProfile>(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetHealthProfiles_Pet");
        });

        modelBuilder.Entity<PetHealthShareToken>(entity =>
        {
            entity.HasKey(e => e.ShareTokenId).HasName("PK_PetHealthShareTokens");

            entity.HasIndex(e => e.DisplayCode, "UX_PetHealthShareTokens_DisplayCode_Active")
                .IsUnique()
                .HasFilter("([RevokedAt] IS NULL)");

            entity.HasIndex(e => new { e.PetId, e.CreatedAt }, "IX_PetHealthShareTokens_PetID_CreatedAt")
                .IsDescending(false, true);

            entity.HasIndex(e => e.TokenHash, "IX_PetHealthShareTokens_TokenHash");

            entity.Property(e => e.ShareTokenId)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ShareTokenID");
            entity.Property(e => e.AccessMode)
                .HasMaxLength(30)
                .HasDefaultValue("Temporary");
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CreatedByUserId).HasColumnName("CreatedByUserID");
            entity.Property(e => e.DisplayCode).HasMaxLength(20);
            entity.Property(e => e.MaxUses);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.OwnerUserId).HasColumnName("OwnerUserID");
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.Scope).HasMaxLength(40);
            entity.Property(e => e.TokenHash).HasMaxLength(256);
            entity.Property(e => e.UsedCount).HasDefaultValue(0);

            entity.HasOne(d => d.Clinic).WithMany()
                .HasForeignKey(d => d.ClinicId)
                .HasConstraintName("FK_PetHealthShareTokens_Clinic");

            entity.HasOne(d => d.CreatedByUser).WithMany()
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetHealthShareTokens_CreatedBy");

            entity.HasOne(d => d.OwnerUser).WithMany()
                .HasForeignKey(d => d.OwnerUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetHealthShareTokens_Owner");

            entity.HasOne(d => d.Pet).WithMany()
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetHealthShareTokens_Pet");
        });

        modelBuilder.Entity<PetHealthShareAccessLog>(entity =>
        {
            entity.HasKey(e => e.AccessLogId).HasName("PK_PetHealthShareAccessLogs");

            entity.HasIndex(e => new { e.PetId, e.CreatedAt }, "IX_PetHealthShareAccessLogs_Pet_CreatedAt")
                .IsDescending(false, true);

            entity.Property(e => e.AccessLogId)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("AccessLogID");
            entity.Property(e => e.AccessedByUserId).HasColumnName("AccessedByUserID");
            entity.Property(e => e.AccessType).HasMaxLength(40);
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.FailureReason).HasMaxLength(200);
            entity.Property(e => e.IpAddress).HasMaxLength(64);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.Result).HasMaxLength(30);
            entity.Property(e => e.ShareTokenId).HasColumnName("ShareTokenID");
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasOne(d => d.AccessedByUser).WithMany()
                .HasForeignKey(d => d.AccessedByUserId)
                .HasConstraintName("FK_PetHealthShareAccessLogs_User");

            entity.HasOne(d => d.Clinic).WithMany()
                .HasForeignKey(d => d.ClinicId)
                .HasConstraintName("FK_PetHealthShareAccessLogs_Clinic");

            entity.HasOne(d => d.Pet).WithMany()
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetHealthShareAccessLogs_Pet");

            entity.HasOne(d => d.ShareToken).WithMany()
                .HasForeignKey(d => d.ShareTokenId)
                .HasConstraintName("FK_PetHealthShareAccessLogs_Token");
        });

        modelBuilder.Entity<PetMedicalRecord>(entity =>
        {
            entity.HasKey(e => e.MedicalRecordId).HasName("PK__PetMedic__4411BBC26CD90F12");

            entity.Property(e => e.MedicalRecordId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("MedicalRecordID");
            entity.Property(e => e.AttachmentUrl)
                .HasMaxLength(500)
                .HasColumnName("AttachmentURL");
            entity.Property(e => e.AttachmentCloudinaryPublicId)
                .HasMaxLength(500);
            entity.Property(e => e.ClinicName).HasMaxLength(200);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Dosage).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MedicationName).HasMaxLength(200);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.RecordType).HasMaxLength(50);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.VetName).HasMaxLength(200);

            entity.HasOne(d => d.Pet).WithMany(p => p.PetMedicalRecords)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetMedicalRecords_Pet");
        });

        modelBuilder.Entity<PetPhoto>(entity =>
        {
            entity.HasKey(e => e.PhotoId).HasName("PK__PetPhoto__21B7B5820250996F");

            entity.Property(e => e.PhotoId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PhotoID");
            entity.Property(e => e.Caption).HasMaxLength(255);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .HasColumnName("ImageURL");
            entity.Property(e => e.CloudinaryPublicId)
                .HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.TakenAt).HasColumnType("datetime");

            entity.HasOne(d => d.Pet).WithMany(p => p.PetPhotos)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetPhotos_Pet");
        });

        modelBuilder.Entity<PetUserAccess>(entity =>
        {
            entity.HasKey(e => e.PetUserAccessId).HasName("PK__PetUserA__0B160EB0F06D2B4E");

            entity.ToTable("PetUserAccess");

            entity.HasIndex(e => new { e.PetId, e.UserId, e.AccessRole }, "UQ_PetUserAccess_Pet_User_Role").IsUnique();

            entity.Property(e => e.PetUserAccessId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PetUserAccessID");
            entity.Property(e => e.AccessRole).HasMaxLength(50);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.GrantedByUserId).HasColumnName("GrantedByUserID");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.RevokedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.GrantedByUser).WithMany(p => p.PetUserAccessGrantedByUsers)
                .HasForeignKey(d => d.GrantedByUserId)
                .HasConstraintName("FK_PetUserAccess_GrantedByUser");

            entity.HasOne(d => d.Pet).WithMany(p => p.PetUserAccesses)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetUserAccess_Pet");

            entity.HasOne(d => d.User).WithMany(p => p.PetUserAccessUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetUserAccess_User");
        });

        modelBuilder.Entity<PetWeightLog>(entity =>
        {
            entity.HasKey(e => e.WeightLogId).HasName("PK__PetWeigh__3A1BEDB5C0BA1E96");

            entity.Property(e => e.WeightLogId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("WeightLogID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.MeasuredAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.Source).HasMaxLength(50);
            entity.Property(e => e.WeightKg).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Pet).WithMany(p => p.PetWeightLogs)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PetWeightLogs_Pet");
        });

        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasIndex(e => e.ExaminationId, "IX_Prescriptions_ExaminationID");

            entity.Property(e => e.PrescriptionId)
                .HasColumnName("PrescriptionID")
                .ValueGeneratedNever();
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Dosage).HasMaxLength(100);
            entity.Property(e => e.ExaminationId).HasColumnName("ExaminationID");
            entity.Property(e => e.Frequency).HasMaxLength(100);
            entity.Property(e => e.Instructions).HasMaxLength(500);
            entity.Property(e => e.InventoryItemId).HasColumnName("InventoryItemID");
            entity.Property(e => e.MedicationName).HasMaxLength(200);

            entity.HasOne(d => d.Examination).WithMany(p => p.Prescriptions)
                .HasForeignKey(d => d.ExaminationId)
                .HasConstraintName("FK_Prescriptions_Examination");

            entity.HasOne(d => d.InventoryItem).WithMany(p => p.Prescriptions)
                .HasForeignKey(d => d.InventoryItemId)
                .HasConstraintName("FK_Prescriptions_Inventory");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.RefreshTokenId).HasName("PK__RefreshT__F5845E59B117F980");

            entity.Property(e => e.RefreshTokenId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("RefreshTokenID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.CreatedByIp)
                .HasMaxLength(50)
                .HasColumnName("CreatedByIP");
            entity.Property(e => e.DeviceId).HasColumnName("DeviceID");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.LastUsedAt).HasColumnType("datetime");
            entity.Property(e => e.RevokedAt).HasColumnType("datetime");
            entity.Property(e => e.TokenHash).HasMaxLength(255);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Device).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.DeviceId)
                .HasConstraintName("FK__RefreshTo__Devic__17F790F9");

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RefreshTo__UserI__17036CC0");
        });

        modelBuilder.Entity<Reminder>(entity =>
        {
            entity.HasKey(e => e.ReminderId).HasName("PK__Reminder__01A830A7DA1A7FDB");

            entity.Property(e => e.ReminderId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("ReminderID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CreatedByUserId).HasColumnName("CreatedByUserID");
            entity.Property(e => e.EntityId).HasColumnName("EntityID");
            entity.Property(e => e.EntityType).HasMaxLength(50);
            entity.Property(e => e.IsEnabled).HasDefaultValue(true);
            entity.Property(e => e.Message).HasMaxLength(1000);
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.ReminderType).HasMaxLength(50);
            entity.Property(e => e.RepeatRule).HasMaxLength(1000);
            entity.Property(e => e.SourceType)
                .HasMaxLength(30)
                .HasDefaultValue("SYSTEM");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.ReminderCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .HasConstraintName("FK_Reminders_CreatedBy");

            entity.HasOne(d => d.Pet).WithMany(p => p.Reminders)
                .HasForeignKey(d => d.PetId)
                .HasConstraintName("FK_Reminders_Pet");

            entity.HasOne(d => d.User).WithMany(p => p.ReminderUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reminders_User");
        });

        modelBuilder.Entity<ReminderPreference>(entity =>
        {
            entity.HasKey(e => e.PreferenceId).HasName("PK__Reminder__E228490F7F5C045D");

            entity.Property(e => e.PreferenceId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PreferenceID");
            entity.Property(e => e.Channel)
                .HasMaxLength(100)
                .HasDefaultValue("PushEmail");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsEnabled).HasDefaultValue(true);
            entity.Property(e => e.ReminderType).HasMaxLength(50);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.ReminderPreferences)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReminderPreferences_User");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Roles__8AFACE3A5A2CAC37");

            entity.HasIndex(e => e.RoleName, "UQ__Roles__8A2B616028191C7E").IsUnique();

            entity.Property(e => e.RoleId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("RoleID");
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(e => e.RolePermissionId).HasName("PK__RolePerm__120F469A00EA0504");

            entity.HasIndex(e => new { e.RoleId, e.PermissionId }, "UQ_RolePermissions").IsUnique();

            entity.Property(e => e.RolePermissionId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("RolePermissionID");
            entity.Property(e => e.PermissionId).HasColumnName("PermissionID");
            entity.Property(e => e.RoleId).HasColumnName("RoleID");

            entity.HasOne(d => d.Permission).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.PermissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RolePermi__Permi__5070F446");

            entity.HasOne(d => d.Role).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RolePermi__RoleI__4F7CD00D");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CCAC95136827");

            entity.HasIndex(e => e.NormalizedEmail, "UQ__Users__368B291A1024941C").IsUnique();

            entity.Property(e => e.UserId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("UserID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LastLoginAt).HasColumnType("datetime");
            entity.Property(e => e.LockoutUntil).HasColumnType("datetime");
            entity.Property(e => e.NormalizedEmail).HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<UserDevice>(entity =>
        {
            entity.HasKey(e => e.DeviceId).HasName("PK__UserDevi__49E12331177E4E8C");

            entity.HasIndex(e => new { e.UserId, e.DeviceFingerprint }, "UQ_UserDeviceFingerprint").IsUnique();

            entity.Property(e => e.DeviceId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("DeviceID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeviceFingerprint).HasMaxLength(255);
            entity.Property(e => e.DeviceName)
                .HasMaxLength(255)
                .HasDefaultValue("Unknown Device");
            entity.Property(e => e.DeviceToken).HasMaxLength(500);
            entity.Property(e => e.DeviceType).HasMaxLength(50);
            entity.Property(e => e.LastLoginAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.UserDevices)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserDevic__UserI__114A936A");
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.ProfileId).HasName("PK__UserProf__290C888449EE63BC");

            entity.HasIndex(e => e.UserId, "UQ__UserProf__1788CCADB125E17F").IsUnique();

            entity.Property(e => e.ProfileId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("ProfileID");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500)
                .HasColumnName("AvatarURL");
            entity.Property(e => e.AvatarCloudinaryPublicId)
                .HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithOne(p => p.UserProfile)
                .HasForeignKey<UserProfile>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserProfi__UserI__4316F928");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.UserRoleId).HasName("PK__UserRole__3D978A55F614E180");

            entity.HasIndex(e => new { e.UserId, e.RoleId }, "UQ_UserRoles").IsUnique();

            entity.Property(e => e.UserRoleId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("UserRoleID");
            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserRoles__RoleI__5629CD9C");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserRoles__UserI__5535A963");
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(e => e.SessionId).HasName("PK__UserSess__C9F4927031417D09");

            entity.Property(e => e.SessionId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("SessionID");
            entity.Property(e => e.AccessTokenJti)
                .HasMaxLength(255)
                .HasColumnName("AccessTokenJTI");
            entity.Property(e => e.ActiveClinicId).HasColumnName("ActiveClinicID");
            entity.Property(e => e.ActiveRole).HasMaxLength(20);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeviceId).HasColumnName("DeviceID");
            entity.Property(e => e.Ipaddress)
                .HasMaxLength(50)
                .HasColumnName("IPAddress");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LastActivityAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.LogoutAt).HasColumnType("datetime");
            entity.Property(e => e.RefreshTokenId).HasColumnName("RefreshTokenID");
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.ActiveClinic).WithMany(p => p.UserSessions)
                .HasForeignKey(d => d.ActiveClinicId)
                .HasConstraintName("FK_UserSessions_ActiveClinic");

            entity.HasOne(d => d.Device).WithMany(p => p.UserSessions)
                .HasForeignKey(d => d.DeviceId)
                .HasConstraintName("FK__UserSessi__Devic__208CD6FA");

            entity.HasOne(d => d.RefreshToken).WithMany(p => p.UserSessions)
                .HasForeignKey(d => d.RefreshTokenId)
                .HasConstraintName("FK__UserSessi__Refre__1F98B2C1");

            entity.HasOne(d => d.User).WithMany(p => p.UserSessions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserSessi__UserI__1EA48E88");
        });

        modelBuilder.Entity<VetClinic>(entity =>
        {
            entity.HasKey(e => e.VetClinicId).HasName("PK__VetClini__E23C1A4CB4AA8415");

            entity.ToTable("VetClinic");

            entity.Property(e => e.VetClinicId)
                .HasColumnName("VetClinicID")
                .ValueGeneratedNever();
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.VetProfileId).HasColumnName("VetProfileID");

            entity.HasOne(d => d.Clinic).WithMany(p => p.VetClinics)
                .HasForeignKey(d => d.ClinicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__VetClinic__Clini__74AE54BC");

            entity.HasOne(d => d.Role).WithMany(p => p.VetClinics)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__VetClinic__RoleI__75A278F5");

            entity.HasOne(d => d.VetProfile).WithMany(p => p.VetClinics)
                .HasForeignKey(d => d.VetProfileId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__VetClinic__VetPr__73BA3083");
        });

        modelBuilder.Entity<VetClinicRole>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__VetClini__8AFACE3A87AD9BBA");

            entity.HasIndex(e => e.RoleName, "UQ__VetClini__8A2B61602510BC59").IsUnique();

            entity.Property(e => e.RoleId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("RoleID");
            entity.Property(e => e.RoleName).HasMaxLength(100);
        });

        modelBuilder.Entity<VetClinicRolePermission>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VetClini__3214EC27F1A1710E");

            entity.HasIndex(e => new { e.RoleId, e.PermissionId }, "UQ_VetClinicRolePermissions").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("ID");
            entity.Property(e => e.PermissionId).HasColumnName("PermissionID");
            entity.Property(e => e.RoleId).HasColumnName("RoleID");

            entity.HasOne(d => d.Permission).WithMany(p => p.VetClinicRolePermissions)
                .HasForeignKey(d => d.PermissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__VetClinic__Permi__6E01572D");

            entity.HasOne(d => d.Role).WithMany(p => p.VetClinicRolePermissions)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__VetClinic__RoleI__6D0D32F4");
        });

        modelBuilder.Entity<VetProfile>(entity =>
        {
            entity.HasKey(e => e.VetProfileId).HasName("PK__VetProfi__CEF0EDC12373850D");

            entity.HasIndex(e => e.UserId, "UQ__VetProfi__1788CCAD3C8AA3B1").IsUnique();

            entity.Property(e => e.VetProfileId)
                .HasColumnName("VetProfileID")
                .ValueGeneratedNever();
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LicenseNumber).HasMaxLength(100);
            entity.Property(e => e.Specialization).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithOne(p => p.VetProfile)
                .HasForeignKey<VetProfile>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__VetProfil__UserI__6477ECF3");
        });

        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.HasKey(e => e.SettingId).HasName("PK__SystemSetting__1F7F6B5E2A1B3C4D");
            entity.ToTable("SystemSetting");
            entity.Property(e => e.SettingId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("SettingID");
            entity.Property(e => e.Category).HasMaxLength(50).HasDefaultValue("General");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.HasIndex(e => e.SettingKey).IsUnique();
        });

        modelBuilder.Entity<ChatSubscriptionPlan>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PK_ChatSubscriptionPlans");

            entity.HasIndex(e => e.Code, "UX_ChatSubscriptionPlans_Code").IsUnique();

            entity.Property(e => e.PlanId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PlanID");
            entity.Property(e => e.Code).HasMaxLength(40);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.PriceMonthly).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BillingCycleDays).HasDefaultValue(30);
            entity.Property(e => e.MonthlyMessageQuota).HasDefaultValue(20);
            entity.Property(e => e.PriorityLevel).HasDefaultValue(0);
            entity.Property(e => e.DeepRagEnabled).HasDefaultValue(false);
            entity.Property(e => e.ImageUploadEnabled).HasDefaultValue(false);
            entity.Property(e => e.MaxImageUploadsPerMonth).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.SortOrder).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<ChatSubscription>(entity =>
        {
            entity.HasKey(e => e.SubscriptionId).HasName("PK_ChatSubscriptions");

            entity.HasIndex(e => new { e.OwnerUserId, e.PetId, e.ExpiresAt }, "IX_ChatSubscriptions_OwnerPet_ExpiresAt")
                .IsDescending(false, false, true);
            entity.HasIndex(e => new { e.ScopeType, e.OwnerUserId, e.PetId, e.IsActive }, "UX_ChatSubscriptions_ActiveOwnerPet")
                .IsUnique()
                .HasFilter("([ScopeType]='OwnerPet' AND [OwnerUserID] IS NOT NULL AND [PetID] IS NOT NULL AND [IsActive]=(1))");

            entity.Property(e => e.SubscriptionId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("SubscriptionID");
            entity.Property(e => e.ScopeType).HasMaxLength(30);
            entity.Property(e => e.OwnerUserId).HasColumnName("OwnerUserID");
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.PlanId).HasColumnName("PlanID");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.StartsAt).HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.CancelledAt).HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.OwnerUser).WithMany()
                .HasForeignKey(d => d.OwnerUserId)
                .HasConstraintName("FK_ChatSubscriptions_OwnerUser");

            entity.HasOne(d => d.Pet).WithMany()
                .HasForeignKey(d => d.PetId)
                .HasConstraintName("FK_ChatSubscriptions_Pet");

            entity.HasOne(d => d.Clinic).WithMany()
                .HasForeignKey(d => d.ClinicId)
                .HasConstraintName("FK_ChatSubscriptions_Clinic");

            entity.HasOne(d => d.Plan).WithMany(p => p.ChatSubscriptions)
                .HasForeignKey(d => d.PlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChatSubscriptions_Plan");
        });

        modelBuilder.Entity<ChatSubscriptionPayment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK_ChatSubscriptionPayments");

            entity.HasIndex(e => e.PaymentReference, "UX_ChatSubscriptionPayments_PaymentReference").IsUnique();
            entity.HasIndex(e => new { e.Provider, e.ProviderTransactionId }, "UX_ChatSubscriptionPayments_ProviderTransaction")
                .IsUnique()
                .HasFilter("([ProviderTransactionID] IS NOT NULL)");
            entity.HasIndex(e => new { e.OwnerUserId, e.CreatedAt }, "IX_ChatSubscriptionPayments_Owner_CreatedAt")
                .IsDescending(false, true);

            entity.Property(e => e.PaymentId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PaymentID");
            entity.Property(e => e.SubscriptionId).HasColumnName("SubscriptionID");
            entity.Property(e => e.PlanId).HasColumnName("PlanID");
            entity.Property(e => e.OwnerUserId).HasColumnName("OwnerUserID");
            entity.Property(e => e.PetId).HasColumnName("PetID");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Currency).HasMaxLength(10).HasDefaultValue("VND");
            entity.Property(e => e.Provider).HasMaxLength(20);
            entity.Property(e => e.PaymentReference).HasMaxLength(100);
            entity.Property(e => e.ProviderTransactionId)
                .HasMaxLength(100)
                .HasColumnName("ProviderTransactionID");
            entity.Property(e => e.QrCodeUrl).HasMaxLength(1000);
            entity.Property(e => e.BankAccountNo).HasMaxLength(50);
            entity.Property(e => e.BankCode).HasMaxLength(30);
            entity.Property(e => e.PaidAt).HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.RawPayload).HasColumnType("nvarchar(max)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Subscription).WithMany(p => p.ChatSubscriptionPayments)
                .HasForeignKey(d => d.SubscriptionId)
                .HasConstraintName("FK_ChatSubscriptionPayments_Subscription");

            entity.HasOne(d => d.Plan).WithMany(p => p.ChatSubscriptionPayments)
                .HasForeignKey(d => d.PlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChatSubscriptionPayments_Plan");

            entity.HasOne(d => d.OwnerUser).WithMany()
                .HasForeignKey(d => d.OwnerUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChatSubscriptionPayments_OwnerUser");

            entity.HasOne(d => d.Pet).WithMany()
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChatSubscriptionPayments_Pet");
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(e => e.ConversationId).HasName("PK__Conversations__376C63F3A1B2E8D9");

            entity.HasIndex(e => e.UserId);

            entity.Property(e => e.ConversationId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("ConversationID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.User).WithMany(p => p.Conversations)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Pet).WithMany(p => p.Conversations)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("Messages");

            entity.HasKey(e => e.MessageId).HasName("PK__ChatMessages__3A4F8D2E9C1B7F6A");

            entity.HasIndex(e => e.ConversationId);
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.MessageId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("MessageID");
            entity.Property(e => e.Content).HasColumnType("nvarchar(max)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Intent).HasMaxLength(50);
            entity.Property(e => e.Model).HasMaxLength(100);
            entity.Property(e => e.SourcesJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.RagUsed).HasDefaultValue(false);
            entity.Property(e => e.SenderRole).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending");
            entity.Property(e => e.UrgencyLevel).HasMaxLength(20);
            entity.Property(e => e.VetRecommendation).HasMaxLength(20);
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Conversation).WithMany(p => p.ChatMessages)
                .HasForeignKey(d => d.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClinicReview>(entity =>
        {
            entity.HasKey(e => e.ClinicReviewId).HasName("PK_ClinicReviews");

            entity.ToTable("ClinicReviews");

            entity.HasIndex(e => new { e.ClinicId, e.IsActive }, "IX_ClinicReviews_Clinic_Active");
            entity.HasIndex(e => new { e.OwnerUserId, e.CreatedAt }, "IX_ClinicReviews_Owner_Created");

            entity.Property(e => e.ClinicReviewId)
                .HasColumnName("ClinicReviewID")
                .ValueGeneratedNever();
            entity.Property(e => e.ClinicId).HasColumnName("ClinicID");
            entity.Property(e => e.OwnerUserId).HasColumnName("OwnerUserID");
            entity.Property(e => e.AppointmentId).HasColumnName("AppointmentID");
            entity.Property(e => e.ReviewContent).HasMaxLength(1000);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Approved");
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
