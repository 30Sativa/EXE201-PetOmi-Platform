import { BadgeCheck, KeyRound, ShieldAlert, UsersRound } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatCard from "@/components/dashboard/StatCard"

const stats = [
  { label: "Clinic pending", value: "12", icon: BadgeCheck, hint: "Cần duyệt" },
  { label: "Users", value: "8,240", icon: UsersRound, hint: "Owner + Vet" },
  { label: "Roles/permissions", value: "14", icon: KeyRound, hint: "Đang áp dụng" },
  { label: "Security alerts", value: "3", icon: ShieldAlert, hint: "Trong 24h" },
]

const clinicQueue = [
  { clinic: "Happy Vet", owner: "Tran Gia", status: "Pending" },
  { clinic: "Sunrise Clinic", owner: "Le Thao", status: "Pending" },
  { clinic: "Paw House", owner: "Ngoc Anh", status: "Pending" },
]

const users = [
  { name: "Nguyen Minh Anh", role: "Owner", status: "Active" },
  { name: "Dr. Mai Nguyen", role: "Vet", status: "Active" },
  { name: "Hieu Tran", role: "Clinic Owner", status: "Review" },
]

const roles = [
  { name: "Owner", permissions: "Profile, Booking, Review" },
  { name: "Vet", permissions: "Patient, Schedule, Billing" },
  { name: "Admin", permissions: "Verify, Roles, Audit" },
]

const reports = [
  { label: "Tỷ lệ duyệt clinic", value: "92%" },
  { label: "DAU", value: "4,120" },
  { label: "Tỷ lệ hoàn tất booking", value: "87%" },
]

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Duyệt clinic" subtitle="Danh sách clinic chờ xác minh.">
          <div className="grid gap-3">
            {clinicQueue.map((item) => (
              <div key={item.clinic} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-po-text">{item.clinic}</p>
                  <p className="text-xs text-po-text-muted">Owner: {item.owner}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-po-primary-soft px-3 py-1 text-xs font-semibold text-po-primary">
                    {item.status}
                  </span>
                  <button className="rounded-full border border-po-border px-3 py-1 text-xs font-semibold text-po-text-muted transition hover:text-po-text">
                    Approve
                  </button>
                  <button className="rounded-full border border-po-border px-3 py-1 text-xs font-semibold text-po-text-muted transition hover:text-po-text">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Quản lý users" subtitle="Trạng thái tài khoản hệ thống.">
          <div className="grid gap-3">
            {users.map((user) => (
              <div key={user.name} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-po-text">{user.name}</p>
                  <p className="text-xs text-po-text-muted">{user.role}</p>
                </div>
                <span className="text-xs font-semibold text-po-primary">{user.status}</span>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Roles & permissions" subtitle="Các nhóm quyền chính trong hệ thống.">
          <div className="grid gap-3">
            {roles.map((role) => (
              <div key={role.name} className="rounded-2xl border border-po-border bg-white px-4 py-3">
                <p className="text-sm font-semibold text-po-text">{role.name}</p>
                <p className="text-xs text-po-text-muted">{role.permissions}</p>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Báo cáo thống kê" subtitle="Tổng hợp nhanh hoạt động hệ thống.">
          <div className="grid gap-3">
            {reports.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
                <p className="text-sm font-semibold text-po-text">{item.label}</p>
                <span className="text-xs font-semibold text-po-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}
