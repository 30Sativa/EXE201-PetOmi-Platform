import {
  AlertTriangle,
  CalendarClock,
  FileText,
  HeartPulse,
  Pill,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"

import Avatar from "@/components/ui/Avatar"
import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { formatDate, formatTime } from "@/lib/format"
import type { PetHealthOverviewResponse } from "@/types"

interface PetHealthOverviewPanelProps {
  overview: PetHealthOverviewResponse
}

const scopeLabel: Record<string, string> = {
  EmergencySummary: "Emergency summary",
  ClinicVisit: "Clinic visit",
  FullHealthProfile: "Full health profile",
}

export default function PetHealthOverviewPanel({
  overview,
}: PetHealthOverviewPanelProps) {
  const { pet, owner, healthProfile, access } = overview

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 rounded-[24px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15 md:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={pet.avatarUrl} alt={pet.name} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-extrabold text-po-text">
                {pet.name}
              </h2>
              <span className="rounded-full bg-po-primary-soft px-2.5 py-0.5 text-xs font-semibold text-po-primary">
                {scopeLabel[access.scope] ?? access.scope}
              </span>
            </div>
            <p className="mt-1 text-sm text-po-text-muted">
              {[pet.species, pet.breed, pet.gender, pet.ageText]
                .filter(Boolean)
                .join(" · ") || "Pet profile"}
            </p>
            <p className="mt-2 text-xs text-po-text-subtle">
              PetOmi ID: {pet.publicPetCode ?? "-"} · Access: {access.source}
            </p>
          </div>
        </div>
        <div className="grid content-center gap-1 rounded-2xl bg-po-surface-muted px-4 py-3 text-sm">
          <span className="font-semibold text-po-text">Access window</span>
          <span className="text-po-text-muted">
            {access.expiresAt ? formatDate(access.expiresAt) : "Clinic relationship"}
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard
          icon={HeartPulse}
          label="Weight"
          value={
            healthProfile?.currentWeightKg
              ? `${healthProfile.currentWeightKg} kg`
              : "-"
          }
          note={healthProfile?.updatedAt ? `Updated ${formatDate(healthProfile.updatedAt)}` : "No profile update"}
        />
        <InfoCard
          icon={ShieldCheck}
          label="Microchip"
          value={healthProfile?.microchipNumber ?? "-"}
          note={healthProfile?.isNeutered ?? "Neuter status not recorded"}
        />
        <InfoCard
          icon={Stethoscope}
          label="Owner contact"
          value={owner?.fullName ?? owner?.email ?? "Hidden by scope"}
          note={[owner?.phone, owner?.email].filter(Boolean).join(" · ") || "Not shared"}
        />
      </div>

      {overview.alerts.length > 0 ? (
        <DashboardSection title="Clinical alerts">
          <div className="grid gap-2">
            {overview.alerts.map((alert, index) => (
              <div
                key={`${alert.type}-${index}`}
                className="flex items-start gap-3 rounded-2xl border border-po-warning/25 bg-po-warning-soft px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-po-warning" />
                <div>
                  <p className="text-sm font-bold text-po-text">{alert.title}</p>
                  <p className="text-xs text-po-text-muted">
                    {alert.type} · {alert.severity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardSection title="Medical records">
          {overview.medicalRecords.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No records in this scope"
              description="This share does not include medical records, or none have been recorded yet."
            />
          ) : (
            <div className="grid gap-3">
              {overview.medicalRecords.slice(0, 6).map((record) => (
                <RecordRow
                  key={record.medicalRecordId}
                  title={record.title}
                  meta={`${record.recordType} · ${formatDate(record.recordDate)}`}
                  note={record.description ?? record.clinicName ?? undefined}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Examinations">
          {overview.examinations.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No examinations in this scope"
              description="Examination detail is hidden for this access scope or not available yet."
            />
          ) : (
            <div className="grid gap-3">
              {overview.examinations.slice(0, 6).map((exam) => (
                <RecordRow
                  key={exam.examinationId}
                  title={exam.diagnosis || exam.chiefComplaint || "Examination"}
                  meta={`${exam.status} · ${formatDate(exam.createdAt)}`}
                  note={exam.examinationNotes ?? exam.treatmentPlan ?? undefined}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Prescriptions">
          {overview.prescriptions.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No prescriptions in this scope"
              description="Prescription details are hidden for this access scope or not available yet."
            />
          ) : (
            <div className="grid gap-3">
              {overview.prescriptions.slice(0, 6).map((prescription) => (
                <RecordRow
                  key={prescription.prescriptionId}
                  title={prescription.medicationName}
                  meta={`${prescription.dosage} · ${prescription.frequency} · ${prescription.durationDays} days`}
                  note={prescription.instructions ?? undefined}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Appointments">
          {overview.appointments.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No appointments in this scope"
              description="Appointment history is hidden for this access scope or not available yet."
            />
          ) : (
            <div className="grid gap-3">
              {overview.appointments.slice(0, 6).map((appointment) => (
                <RecordRow
                  key={appointment.appointmentId}
                  title={appointment.appointmentType}
                  meta={`${appointment.status} · ${formatDate(appointment.appointmentDate)} ${formatTime(appointment.startTime)}`}
                  note={appointment.notes ?? (appointment.isWalkIn ? "Walk-in" : undefined)}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof HeartPulse
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-po-border bg-white p-4">
      <div className="flex items-center gap-2 text-po-text-muted">
        <Icon className="size-4" />
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <p className="mt-2 break-words text-lg font-extrabold text-po-text">{value}</p>
      <p className="mt-1 text-xs text-po-text-muted">{note}</p>
    </div>
  )
}

function RecordRow({
  title,
  meta,
  note,
}: {
  title: string
  meta: string
  note?: string
}) {
  return (
    <div className="rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3">
      <p className="font-bold text-po-text">{title}</p>
      <p className="mt-1 text-xs text-po-text-muted">{meta}</p>
      {note ? <p className="mt-2 text-sm text-po-text-muted">{note}</p> : null}
    </div>
  )
}
