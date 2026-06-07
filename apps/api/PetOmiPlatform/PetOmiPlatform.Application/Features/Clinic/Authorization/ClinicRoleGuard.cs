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
                throw new ForbiddenException("Tai khoan chua duoc phan quyen tai phong kham nay.");

            return staff;
        }

        public static VetClinicDomain RequireMedicalWriter(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.PrimaryVetId)
            {
                throw new ForbiddenException("Chi ClinicOwner hoac PrimaryVet moi co quyen cap nhat ho so kham.");
            }

            return staff;
        }

        public static VetClinicDomain RequirePrescriptionWriter(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.PrimaryVetId)
            {
                throw new ForbiddenException("Chi ClinicOwner hoac PrimaryVet moi co quyen ke don thuoc.");
            }

            return staff;
        }

        public static VetClinicDomain RequireInvoiceWriter(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.AssistantId)
            {
                throw new ForbiddenException("Chi ClinicOwner hoac Assistant moi co quyen tao va thu hoa don.");
            }

            return staff;
        }

        public static VetClinicDomain RequireInvoiceViewer(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId &&
                staff.RoleId != ClinicRoleConstants.AssistantId)
            {
                throw new ForbiddenException("Chi ClinicOwner hoac Assistant moi co quyen xem hoa don.");
            }

            return staff;
        }

        public static VetClinicDomain RequireClinicOwner(VetClinicDomain? staff)
        {
            staff = RequireActiveStaff(staff);

            if (staff.RoleId != ClinicRoleConstants.ClinicOwnerId)
            {
                throw new ForbiddenException("Chi ClinicOwner moi co quyen cau hinh tai khoan thanh toan.");
            }

            return staff;
        }
    }
}
