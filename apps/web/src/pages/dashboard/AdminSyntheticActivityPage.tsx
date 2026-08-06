import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  CheckCircle2,
  FileHeart,
  FlaskConical,
  MessageCircle,
  PawPrint,
  Search,
  UsersRound,
} from "lucide-react"

import AdminPageHeader from "@/components/dashboard/AdminPageHeader"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { getAdminSyntheticActivityApi } from "@/services/admin.service"

const DEFAULT_FROM = "2026-07-01"
const DEFAULT_TO = "2026-07-31"
type DataOrigin = "real" | "synthetic"

function formatNumber(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const datePart = value.slice(0, 10)
  const [year, month, day] = datePart.split("-")
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

export default function AdminSyntheticActivityPage() {
  const [fromDate, setFromDate] = useState(DEFAULT_FROM)
  const [toDate, setToDate] = useState(DEFAULT_TO)
  const [search, setSearch] = useState("")
  const [origin, setOrigin] = useState<DataOrigin>("real")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "synthetic-activity", fromDate, toDate, origin],
    queryFn: () => getAdminSyntheticActivityApi({ fromDate, toDate, origin }),
    enabled: Boolean(fromDate && toDate && fromDate <= toDate),
    staleTime: 30 * 1000,
  })

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    if (!keyword) return data?.users ?? []

    return (data?.users ?? []).filter((user) =>
      [user.fullName, user.email, ...user.petNames]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("vi").includes(keyword)),
    )
  }, [data?.users, search])

  const summary = data?.summary
  const maxActiveUsers = Math.max(...(data?.dailyActivity ?? []).map((day) => day.activeUsers), 1)
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate)
  const isSynthetic = data?.dataOrigin === "SYNTHETIC" || origin === "synthetic"

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        kicker="OC3 · Product adoption"
        title="Hoạt động người dùng tháng 7/2026"
        description="Đối chiếu theo từng tài khoản: tạo pet, chat AI, ghi chú sức khỏe và nhắc lịch."
        icon={FlaskConical}
        metrics={[
          { label: isSynthetic ? "Tài khoản demo" : "Tài khoản thật", value: formatNumber(summary?.usersInDataset), icon: UsersRound },
          { label: "Đủ điều kiện OC3", value: formatNumber(summary?.qualifiedUsers), icon: CheckCircle2, tone: "success" },
          { label: "Pet tạo trong kỳ", value: formatNumber(summary?.petsCreated), icon: PawPrint },
          { label: "Ngày-user hoạt động", value: formatNumber(summary?.activeUserDays), icon: CalendarDays, tone: "warning" },
        ]}
      />

      <section className={`rounded-[24px] border p-5 shadow-sm ${
        isSynthetic
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-emerald-300 bg-emerald-50 text-emerald-950"
      }`}>
        <div className="flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ring-1 ${
            isSynthetic
              ? "bg-amber-100 text-amber-700 ring-amber-300"
              : "bg-emerald-100 text-emerald-700 ring-emerald-300"
          }`}>
            {isSynthetic ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em]">
              {data?.datasetLabel ?? (isSynthetic ? "DỮ LIỆU DEMO / MÔ PHỎNG" : "DỮ LIỆU GHI NHẬN QUA HỆ THỐNG")}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6">
              {data?.notice ?? (isSynthetic
                ? "Không phải hành vi khách hàng thật và không được dùng làm bằng chứng người dùng thật."
                : "Chỉ thống kê các bản ghi thật đang có trong hệ thống; không bổ sung hoặc lùi ngày hoạt động.")}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-3 rounded-[24px] bg-white/90 p-4 shadow-sm ring-1 ring-po-border/80">
        <div className="flex h-11 items-center gap-1 rounded-2xl bg-po-surface-muted p-1 ring-1 ring-po-border/80">
          {([
            ["real", "Dữ liệu thật"],
            ["synthetic", "Demo mô phỏng"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setOrigin(value)}
              className={`h-9 rounded-xl px-3 text-xs font-extrabold transition ${
                origin === value
                  ? "bg-white text-po-primary shadow-sm"
                  : "text-po-text-muted hover:text-po-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="grid gap-1.5 text-xs font-bold text-po-text-muted">
          Từ ngày
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-11 rounded-2xl bg-white px-3 text-sm text-po-text ring-1 ring-po-border focus:outline-none focus:ring-2 focus:ring-po-primary/40"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-po-text-muted">
          Đến ngày
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-11 rounded-2xl bg-white px-3 text-sm text-po-text ring-1 ring-po-border focus:outline-none focus:ring-2 focus:ring-po-primary/40"
          />
        </label>
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên, email hoặc pet..."
            className="h-11 w-full rounded-2xl bg-white pl-10 pr-4 text-sm text-po-text ring-1 ring-po-border focus:outline-none focus:ring-2 focus:ring-po-primary/40"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFromDate(DEFAULT_FROM)
            setToDate(DEFAULT_TO)
          }}
          className="h-11 rounded-2xl bg-po-surface-muted px-4 text-sm font-bold text-po-text-muted transition hover:text-po-primary"
        >
          Tháng 7/2026
        </button>
        {invalidRange ? (
          <p className="w-full text-sm font-semibold text-po-danger">Ngày kết thúc phải sau ngày bắt đầu.</p>
        ) : null}
      </section>

      {isLoading ? (
        <div className="rounded-[28px] bg-white py-16 text-center ring-1 ring-po-border/80">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Không tải được báo cáo demo"
          description="Kiểm tra migration 050, seed 051 và quyền Admin của tài khoản hiện tại."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={MessageCircle} label="Tin nhắn chủ nuôi" value={summary?.ownerMessages} />
            <MetricCard icon={Bot} label="Phản hồi AI mô phỏng" value={summary?.aiResponses} />
            <MetricCard icon={FileHeart} label="Ghi chú sức khỏe" value={summary?.medicalNotes} />
            <MetricCard icon={CalendarDays} label="Nhắc lịch đã tạo" value={summary?.remindersCreated} />
          </div>

          <section className="rounded-[28px] bg-white/92 p-5 shadow-sm ring-1 ring-po-border/80">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-po-text">Người dùng demo hoạt động theo ngày</h3>
                <p className="mt-1 text-sm text-po-text-muted">
                  Đếm distinct account {isSynthetic ? "synthetic" : "thật"} có session hoặc thao tác dịch vụ trong từng ngày.
                </p>
              </div>
              <p className="text-sm font-bold text-po-primary">
                Trung bình phiên: {formatNumber(summary?.averageSessionMinutes)} phút
              </p>
            </div>

            <div className="mt-6 overflow-x-auto pb-2">
              <div className="flex min-w-[900px] items-end gap-2 rounded-[22px] bg-po-surface-muted/55 px-4 pb-3 pt-6">
                {(data?.dailyActivity ?? []).map((day) => {
                  const height = Math.max(8, Math.round((day.activeUsers / maxActiveUsers) * 150))
                  return (
                    <div key={day.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-[10px] font-extrabold tabular-nums text-po-text-muted opacity-0 transition group-hover:opacity-100">
                        {day.activeUsers}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-po-primary/85 transition group-hover:bg-po-primary"
                        style={{ height }}
                        title={`${formatDate(day.date)}: ${day.activeUsers} user demo hoạt động`}
                      />
                      <span className="text-[9px] font-semibold text-po-text-subtle">
                        {day.date.slice(-2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="admin-table-shell">
            <div className="border-b border-po-border/80 px-5 py-4">
              <h3 className="text-xl font-extrabold text-po-text">Chi tiết theo tài khoản demo</h3>
              <p className="mt-1 text-sm text-po-text-muted">
                {filteredUsers.length} tài khoản · đủ điều kiện khi vừa tạo pet trong kỳ vừa dùng ít nhất một dịch vụ.
              </p>
            </div>

            <div className="admin-table-scroll">
              <table className="admin-table min-w-[1240px]">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Pet</th>
                    <th className="text-center">Ngày hoạt động</th>
                    <th className="text-center">Chat</th>
                    <th className="text-center">Ghi chú</th>
                    <th className="text-center">Nhắc lịch</th>
                    <th>Hoạt động cuối</th>
                    <th className="text-center">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <p className="font-bold text-po-text">{user.fullName ?? "Demo owner"}</p>
                        <p className="mt-1 text-xs text-po-text-muted">{user.email}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                          user.isSynthetic
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {user.isSynthetic ? "Synthetic" : "Recorded"}
                        </span>
                      </td>
                      <td>
                        <p className="font-semibold text-po-text">{user.petNames.join(", ") || "—"}</p>
                        <p className="mt-1 text-xs text-po-text-muted">Tạo: {formatDate(user.firstPetCreatedAt)}</p>
                      </td>
                      <td className="text-center font-extrabold tabular-nums text-po-text">{user.activeDays}</td>
                      <td className="text-center tabular-nums text-po-text">{user.ownerMessages}</td>
                      <td className="text-center tabular-nums text-po-text">{user.medicalNotes}</td>
                      <td className="text-center tabular-nums text-po-text">{user.remindersCreated}</td>
                      <td className="text-sm text-po-text-muted">{formatDateTime(user.lastActivityAt)}</td>
                      <td className="text-center">
                        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold ${
                          user.qualifiedForScenario
                            ? "bg-po-success-soft text-po-success"
                            : "bg-po-warning-soft text-po-warning"
                        }`}>
                          {user.qualifiedForScenario ? "Đủ điều kiện" : "Chưa đủ"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PawPrint
  label: string
  value?: number
}) {
  return (
    <article className="rounded-[22px] bg-white/90 p-5 shadow-sm ring-1 ring-po-border/80">
      <span className="grid size-11 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-5 text-3xl font-extrabold tabular-nums text-po-text">{formatNumber(value)}</p>
      <p className="mt-2 text-sm font-semibold text-po-text-muted">{label}</p>
    </article>
  )
}
