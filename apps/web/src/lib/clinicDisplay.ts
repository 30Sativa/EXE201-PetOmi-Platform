const normalize = (value: string) => value.replace(/[\s_-]/g, "").toLowerCase()

export function appointmentStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    checkedin: "Đã check-in",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    rejected: "Bị từ chối",
    expired: "Hết hạn",
    noshow: "Không đến",
  }

  return map[normalize(status)] ?? status
}

export function appointmentStatusKey(status: string) {
  return normalize(status)
}

export function appointmentTypeLabel(type: string) {
  const map: Record<string, string> = {
    checkup: "Khám tổng quát",
    vaccination: "Tiêm phòng",
    surgery: "Phẫu thuật",
    emergency: "Cấp cứu",
    grooming: "Làm đẹp",
    followup: "Tái khám",
  }

  return map[normalize(type)] ?? type
}

export function invoiceStatusLabel(status: string) {
  const map: Record<string, string> = {
    unpaid: "Chưa thu",
    paid: "Đã thanh toán",
    cancelled: "Đã hủy",
  }

  return map[normalize(status)] ?? status
}

export function invoiceSourceLabel(source: string) {
  const map: Record<string, string> = {
    appointment: "Lịch hẹn",
    order: "Đơn hàng",
    retail: "Bán lẻ",
    mixed: "Tổng hợp",
  }

  return map[normalize(source)] ?? source
}

export function staffRoleLabel(role: string) {
  const map: Record<string, string> = {
    primaryvet: "Bác sĩ chính",
    assistant: "Trợ lý",
  }

  return map[normalize(role)] ?? role
}

export function petSpeciesLabel(species: string) {
  const map: Record<string, string> = {
    dog: "Chó",
    cat: "Mèo",
    other: "Khác",
  }

  return map[normalize(species)] ?? species
}

export function clinicStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Bị từ chối",
    suspended: "Tạm khóa",
  }

  return map[normalize(status)] ?? status
}

export function examinationStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Đang khám",
    inprogress: "Đang khám",
    completed: "Hoàn tất",
  }

  return map[normalize(status)] ?? status
}

export function sePayReconciliationStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Đang chờ",
    matched: "Đã match",
    dismissed: "Đã bỏ qua",
    unmatched: "Chưa match",
  }

  return map[normalize(status)] ?? status
}
