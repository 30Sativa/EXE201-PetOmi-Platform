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

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Clinic> Clinics { get; set; }

    public virtual DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }

    public virtual DbSet<ExternalLogin> ExternalLogins { get; set; }

    public virtual DbSet<LoginOtptoken> LoginOtptokens { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

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

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=(local);Database=PetOmni_DB;Trusted_Connection=True;TrustServerCertificate=True;");

    // DbSet cho bảng Pets — hồ sơ thú cưng
    public virtual DbSet<Pet> Pets { get; set; }

//    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
//#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
//        => optionsBuilder.UseSqlServer("Data Source=(local);Database=PetOmni_DB;Trusted_Connection=True;TrustServerCertificate=True;");


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
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
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("ClinicID");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.ClinicName).HasMaxLength(200);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.LicenseNumber).HasMaxLength(100);
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
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("VetClinicID");
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
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("VetProfileID");
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

        // Cấu hình bảng Pets
        modelBuilder.Entity<Pet>(entity =>
        {
            entity.HasKey(e => e.PetId).HasName("PK__Pets__48E53862");

            entity.Property(e => e.PetId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("PetID");
            entity.Property(e => e.OwnerUserId)
                .HasColumnName("OwnerUserID");
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Species).HasMaxLength(50);
            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(20);
            entity.Property(e => e.IsNeutered).HasMaxLength(20);
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500)
                .HasColumnName("AvatarURL");
            entity.Property(e => e.Color).HasMaxLength(200);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            // FK: Pet → User (chủ nuôi)
            entity.HasOne(d => d.Owner)
                .WithMany()
                .HasForeignKey(d => d.OwnerUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Pets_OwnerUser");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
