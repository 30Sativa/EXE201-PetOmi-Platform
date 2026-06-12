using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Clinic.Authorization
{
    public static class ClinicRoleGuard
    {
        public static VetClinicDomain RequireActiveStaff(VetClinicDomain? staff)
        {
            if (staff == null || !staff.IsActive)
                throw new ForbiddenException("Tài khoản chưa được phân quyền tại phòng khám này.");

            return staff;
        }

        public static VetClinicDomain RequireMedicalWriter(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.PrimaryVetId)
            {
                throw new ForbiddenException("Chỉ ClinicOwner hoặc PrimaryVet mới có quyền cập nhật hồ sơ khám.");
            }

            return staff;
        }

        public static VetClinicDomain RequirePrescriptionWriter(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.PrimaryVetId)
            {
                throw new ForbiddenException("Chỉ ClinicOwner hoặc PrimaryVet mới có quyền kê đơn thuốc.");
            }

            return staff;
        }

        public static VetClinicDomain RequireInvoiceWriter(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.CashierId)
            {
                throw new ForbiddenException("Chỉ ClinicOwner hoặc Cashier mới có quyền tạo và thu hóa đơn.");
            }

            return staff;
        }

        public static VetClinicDomain RequireInvoiceViewer(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.CashierId)
            {
                throw new ForbiddenException("Chỉ ClinicOwner hoặc Cashier mới có quyền xem hóa đơn.");
            }

            return staff;
        }

        public static VetClinicDomain RequireClinicOwner(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId)
            {
                throw new ForbiddenException("Chỉ ClinicOwner mới có quyền cấu hình tài khoản thanh toán.");
            }

            return staff;
        }
    }
}
