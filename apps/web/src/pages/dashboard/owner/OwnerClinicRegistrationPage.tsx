import { useMemo, useState } from "react"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  UploadCloud,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import ImageUploadField from "@/components/ui/ImageUploadField"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { createClinicApi, getMyClinicApi } from "@/services/clinic.service"
import { cn, getErrorMessage } from "@/lib/utils"
import type { CreateClinicRequest, MyClinicResponse } from "@/types"

type FormState = {
  clinicName: string
  provinceCode: string
  districtCode: string
  wardCode: string
  addressDetail: string
  phone: string
  email: string
  licenseImageUrl: string
  licenseCloudinaryPublicId: string
  logoUrl: string
  logoCloudinaryPublicId: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

type WardOption = {
  code: string
  name: string
}

type DistrictOption = {
  code: string
  name: string
  wards: WardOption[]
}

type ProvinceOption = {
  code: string
  name: string
  districts: DistrictOption[]
}

const ADDRESS_OPTIONS: ProvinceOption[] = [
  {
    code: "hcm",
    name: "TP. Hồ Chí Minh",
    districts: [
      {
        code: "hcm-thu-duc",
        name: "TP. Thủ Đức",
        wards: [
          { code: "hcm-thu-duc-thao-dien", name: "Phường Thảo Điền" },
          { code: "hcm-thu-duc-an-phu", name: "Phường An Phú" },
          { code: "hcm-thu-duc-linh-trung", name: "Phường Linh Trung" },
        ],
      },
      {
        code: "hcm-q1",
        name: "Quận 1",
        wards: [
          { code: "hcm-q1-ben-nghe", name: "Phường Bến Nghé" },
          { code: "hcm-q1-ben-thanh", name: "Phường Bến Thành" },
          { code: "hcm-q1-da-kao", name: "Phường Đa Kao" },
        ],
      },
      {
        code: "hcm-q7",
        name: "Quận 7",
        wards: [
          { code: "hcm-q7-tan-phong", name: "Phường Tân Phong" },
          { code: "hcm-q7-tan-phu", name: "Phường Tân Phú" },
          { code: "hcm-q7-phu-my", name: "Phường Phú Mỹ" },
        ],
      },
    ],
  },
  {
    code: "hn",
    name: "Hà Nội",
    districts: [
      {
        code: "hn-ba-dinh",
        name: "Quận Ba Đình",
        wards: [
          { code: "hn-ba-dinh-truc-bach", name: "Phường Trúc Bạch" },
          { code: "hn-ba-dinh-lieu-giai", name: "Phường Liễu Giai" },
          { code: "hn-ba-dinh-ngoc-ha", name: "Phường Ngọc Hà" },
        ],
      },
      {
        code: "hn-cau-giay",
        name: "Quận Cầu Giấy",
        wards: [
          { code: "hn-cau-giay-dich-vong", name: "Phường Dịch Vọng" },
          { code: "hn-cau-giay-yen-hoa", name: "Phường Yên Hòa" },
          { code: "hn-cau-giay-mai-dich", name: "Phường Mai Dịch" },
        ],
      },
      {
        code: "hn-dong-da",
        name: "Quận Đống Đa",
        wards: [
          { code: "hn-dong-da-lang-ha", name: "Phường Láng Hạ" },
          { code: "hn-dong-da-cat-linh", name: "Phường Cát Linh" },
          { code: "hn-dong-da-o-cho-dua", name: "Phường Ô Chợ Dừa" },
        ],
      },
    ],
  },
  {
    code: "dn",
    name: "Đà Nẵng",
    districts: [
      {
        code: "dn-hai-chau",
        name: "Quận Hải Châu",
        wards: [
          { code: "dn-hai-chau-thach-thang", name: "Phường Thạch Thang" },
          { code: "dn-hai-chau-hai-chau-1", name: "Phường Hải Châu I" },
          { code: "dn-hai-chau-binh-hien", name: "Phường Bình Hiên" },
        ],
      },
      {
        code: "dn-son-tra",
        name: "Quận Sơn Trà",
        wards: [
          { code: "dn-son-tra-an-hai-bac", name: "Phường An Hải Bắc" },
          { code: "dn-son-tra-phuoc-my", name: "Phường Phước Mỹ" },
          { code: "dn-son-tra-tho-quang", name: "Phường Thọ Quang" },
        ],
      },
    ],
  },
  {
    code: "ct",
    name: "Cần Thơ",
    districts: [
      {
        code: "ct-ninh-kieu",
        name: "Quận Ninh Kiều",
        wards: [
          { code: "ct-ninh-kieu-an-khanh", name: "Phường An Khánh" },
          { code: "ct-ninh-kieu-cai-khe", name: "Phường Cái Khế" },
          { code: "ct-ninh-kieu-tan-an", name: "Phường Tân An" },
        ],
      },
      {
        code: "ct-cai-rang",
        name: "Quận Cái Răng",
        wards: [
          { code: "ct-cai-rang-le-binh", name: "Phường Lê Bình" },
          { code: "ct-cai-rang-hung-phu", name: "Phường Hưng Phú" },
          { code: "ct-cai-rang-ba-lang", name: "Phường Ba Láng" },
        ],
      },
    ],
  },
  {
    code: "bd",
    name: "Bình Dương",
    districts: [
      {
        code: "bd-thu-dau-mot",
        name: "TP. Thủ Dầu Một",
        wards: [
          { code: "bd-tdm-phu-cuong", name: "Phường Phú Cường" },
          { code: "bd-tdm-hiep-thanh", name: "Phường Hiệp Thành" },
          { code: "bd-tdm-phu-loi", name: "Phường Phú Lợi" },
        ],
      },
      {
        code: "bd-di-an",
        name: "TP. Dĩ An",
        wards: [
          { code: "bd-di-an-di-an", name: "Phường Dĩ An" },
          { code: "bd-di-an-an-binh", name: "Phường An Bình" },
          { code: "bd-di-an-tan-dong-hiep", name: "Phường Tân Đông Hiệp" },
        ],
      },
    ],
  },
  {
    code: "dnai",
    name: "Đồng Nai",
    districts: [
      {
        code: "dnai-bien-hoa",
        name: "TP. Biên Hòa",
        wards: [
          { code: "dnai-bien-hoa-tan-mai", name: "Phường Tân Mai" },
          { code: "dnai-bien-hoa-thong-nhat", name: "Phường Thống Nhất" },
          { code: "dnai-bien-hoa-tan-phong", name: "Phường Tân Phong" },
        ],
      },
      {
        code: "dnai-long-khanh",
        name: "TP. Long Khánh",
        wards: [
          { code: "dnai-long-khanh-xuan-an", name: "Phường Xuân An" },
          { code: "dnai-long-khanh-xuan-binh", name: "Phường Xuân Bình" },
          { code: "dnai-long-khanh-bao-vinh", name: "Phường Bảo Vinh" },
        ],
      },
    ],
  },
]

const initialForm: FormState = {
  clinicName: "",
  provinceCode: "",
  districtCode: "",
  wardCode: "",
  addressDetail: "",
  phone: "",
  email: "",
  licenseImageUrl: "",
  licenseCloudinaryPublicId: "",
  logoUrl: "",
  logoCloudinaryPublicId: "",
}

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "success" as const
    case "rejected":
      return "danger" as const
    case "pending":
      return "warning" as const
    default:
      return "default" as const
  }
}

function statusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "Đã duyệt"
    case "rejected":
      return "Bị từ chối"
    case "pending":
      return "Đang chờ duyệt"
    default:
      return status
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function toNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function findProvince(code: string) {
  return ADDRESS_OPTIONS.find((province) => province.code === code)
}

function findDistrict(provinceCode: string, districtCode: string) {
  return findProvince(provinceCode)?.districts.find((district) => district.code === districtCode)
}

function findWard(provinceCode: string, districtCode: string, wardCode: string) {
  return findDistrict(provinceCode, districtCode)?.wards.find((ward) => ward.code === wardCode)
}

function composeAddress(form: FormState) {
  const province = findProvince(form.provinceCode)
  const district = findDistrict(form.provinceCode, form.districtCode)
  const ward = findWard(form.provinceCode, form.districtCode, form.wardCode)

  return [
    form.addressDetail.trim(),
    ward?.name,
    district?.name,
    province?.name,
  ].filter(Boolean).join(", ")
}

export default function OwnerClinicRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(initialForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const { data: myClinic, isLoading: loadingClinic } = useQuery({
    queryKey: ["owner", "my-clinic"],
    queryFn: getMyClinicApi,
    retry: false,
  })

  const selectedProvince = findProvince(form.provinceCode)
  const selectedDistrict = findDistrict(form.provinceCode, form.districtCode)

  const clearFeedback = () => {
    setMessage("")
    setErrorMessage("")
  }

  const createClinicMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateClinicRequest = {
        clinicName: form.clinicName.trim(),
        address: toNullable(composeAddress(form)),
        phone: toNullable(form.phone),
        email: toNullable(form.email),
        licenseImageUrl: toNullable(form.licenseImageUrl),
        licenseCloudinaryPublicId: toNullable(form.licenseCloudinaryPublicId),
        logoUrl: toNullable(form.logoUrl),
        logoCloudinaryPublicId: toNullable(form.logoCloudinaryPublicId),
      }

      return createClinicApi(payload)
    },
    onSuccess: async () => {
      setErrorMessage("")
      setMessage("Đã gửi hồ sơ phòng khám. Admin sẽ duyệt trước khi bạn mở dashboard phòng khám.")
      toast.success("Đã gửi hồ sơ phòng khám.")
      setForm(initialForm)
      setFormErrors({})
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner", "my-clinic"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ])
    },
    onError: (error) => {
      const errorText = getErrorMessage(error, "Đăng ký phòng khám thất bại. Vui lòng thử lại.")
      setMessage("")
      setErrorMessage(errorText)
      toast.error(errorText)
    },
  })

  const isLoading = loadingClinic

  const clinicCompleteness = useMemo(() => {
    const fields = [
      form.clinicName,
      form.email,
      form.phone,
      form.provinceCode,
      form.districtCode,
      form.wardCode,
      form.addressDetail,
      form.licenseImageUrl,
    ]
    const filled = fields.filter((value) => value.trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [form])

  const updateValue = (field: keyof FormState, value: string) => {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      }

      if (field === "provinceCode") {
        next.districtCode = ""
        next.wardCode = ""
      }

      if (field === "districtCode") {
        next.wardCode = ""
      }

      if (field === "licenseImageUrl" && !value) {
        next.licenseCloudinaryPublicId = ""
      }
      if (field === "logoUrl" && !value) {
        next.logoCloudinaryPublicId = ""
      }

      return next
    })

    setFormErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const updateField =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateValue(field, event.target.value)
    }

  const validateClinicStep = () => {
    const errors: FormErrors = {}

    if (form.clinicName.trim().length < 2) {
      errors.clinicName = "Tên phòng khám cần có ít nhất 2 ký tự."
    }
    if (!form.licenseImageUrl.trim()) {
      errors.licenseImageUrl = "Upload ảnh giấy phép để admin có thể đối chiếu."
    }
    if (!form.email.trim()) {
      errors.email = "Nhập email để admin liên hệ khi cần."
    } else if (!isEmail(form.email.trim())) {
      errors.email = "Email chưa đúng định dạng."
    }
    if (!form.phone.trim()) {
      errors.phone = "Nhập số điện thoại liên hệ của phòng khám."
    }
    if (!form.provinceCode) {
      errors.provinceCode = "Chọn tỉnh/thành phố."
    }
    if (!form.districtCode) {
      errors.districtCode = "Chọn quận/huyện."
    }
    if (!form.wardCode) {
      errors.wardCode = "Chọn phường/xã."
    }
    if (!form.addressDetail.trim()) {
      errors.addressDetail = "Nhập số nhà và tên đường."
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleClinicSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearFeedback()
    if (!validateClinicStep() || myClinic) return
    createClinicMutation.mutate()
  }

  return (
    <div className="grid gap-5 md:gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FlowStep
          icon={Building2}
          title="1. Hồ sơ phòng khám"
          text={myClinic ? "Đã gửi hồ sơ phòng khám" : "Nhập thông tin để admin review"}
          active={!myClinic}
          done={Boolean(myClinic)}
        />
        <FlowStep
          icon={ClipboardCheck}
          title="2. Admin duyệt"
          text={myClinic ? statusLabel(myClinic.status) : "Chờ sau khi gửi hồ sơ"}
          done={myClinic?.status === "Approved"}
          disabled
        />
      </div>

      {isLoading ? (
        <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80">
          <LoadingSpinner />
        </div>
      ) : myClinic ? (
        <ExistingClinicPanel clinic={myClinic} onOpenClinic={() => navigate("/dashboard/clinic")} />
      ) : (
        <ClinicProfileStep
          form={form}
          errors={formErrors}
          completion={clinicCompleteness}
          message={message}
          errorMessage={errorMessage}
          isSubmitting={createClinicMutation.isPending}
          provinceOptions={ADDRESS_OPTIONS}
          districtOptions={selectedProvince?.districts ?? []}
          wardOptions={selectedDistrict?.wards ?? []}
          composedAddress={composeAddress(form)}
          onCancel={() => navigate("/dashboard/owner")}
          onSubmit={handleClinicSubmit}
          onChange={updateField}
          onValueChange={updateValue}
        />
      )}
    </div>
  )
}

function ClinicProfileStep({
  form,
  errors,
  completion,
  message,
  errorMessage,
  isSubmitting,
  provinceOptions,
  districtOptions,
  wardOptions,
  composedAddress,
  onCancel,
  onSubmit,
  onChange,
  onValueChange,
}: {
  form: FormState
  errors: FormErrors
  completion: number
  message: string
  errorMessage: string
  isSubmitting: boolean
  provinceOptions: ProvinceOption[]
  districtOptions: DistrictOption[]
  wardOptions: WardOption[]
  composedAddress: string
  onCancel: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onValueChange: (field: keyof FormState, value: string) => void
}) {
  const [isImageUploading, setIsImageUploading] = useState(false)
  const isSaving = isSubmitting || isImageUploading

  return (
    <DashboardSection
      title="Thông tin phòng khám"
      subtitle="Nhập thông tin admin cần để kiểm tra giấy phép, địa chỉ và kênh liên hệ của phòng khám."
      action={
        <div className="min-w-[150px] rounded-2xl bg-po-surface-muted px-3 py-2 ring-1 ring-po-border/70">
          <p className="text-xs font-semibold text-po-text-subtle">Độ đầy đủ hồ sơ</p>
          <div className="mt-2 h-2 rounded-full bg-white">
            <div
              className="h-2 rounded-full bg-po-primary transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="flex flex-wrap items-center gap-3 rounded-[24px] bg-po-success-soft px-4 py-3 text-sm text-po-success ring-1 ring-po-success/15">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="font-semibold">
            Ban co the upload anh hoac PDF giay phep roi gui ho so phong kham ngay.
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Tên phòng khám"
            value={form.clinicName}
            onChange={onChange("clinicName")}
            placeholder="PetOmi Clinic Thảo Điền"
            error={errors.clinicName}
            required
          />
          <InputField
            label="Email phòng khám"
            value={form.email}
            onChange={onChange("email")}
            placeholder="clinic@example.com"
            type="email"
            error={errors.email}
            required
          />
          <InputField
            label="Số điện thoại"
            value={form.phone}
            onChange={onChange("phone")}
            placeholder="090..."
            error={errors.phone}
            required
          />
        </div>

        <div className="grid gap-4 rounded-[26px] bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-po-text">Ảnh giấy phép</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">
                Upload ảnh từ máy để admin xem trực tiếp, không cần tự paste link.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-po-text-muted ring-1 ring-po-border/80">
              <UploadCloud className="size-3.5" />
              JPG, PNG, WEBP, PDF
            </span>
          </div>
          <ImageUploadField
            value={form.licenseImageUrl}
            onChange={(url) => onValueChange("licenseImageUrl", url)}
            onUploadComplete={(result) => onValueChange("licenseCloudinaryPublicId", result.publicId)}
            imageType="clinic_license"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            emptyLabel="Upload anh/PDF giay phep"
            replaceLabel="Thay anh/PDF"
            helpText="JPG, PNG, WEBP hoac PDF, toi da 5MB"
            previewClassName="h-40 w-full rounded-2xl border border-po-border object-cover"
            maxSizeMb={5}
            disabled={isSaving}
            onUploadStateChange={setIsImageUploading}
          />
          {errors.licenseImageUrl ? (
            <p className="text-xs font-semibold leading-5 text-po-danger">{errors.licenseImageUrl}</p>
          ) : null}
        </div>

        <div className="grid gap-4 rounded-[26px] bg-po-surface-muted/40 p-4 ring-1 ring-po-border/70 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-po-text">Ảnh logo phòng khám (không bắt buộc)</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">
                Nên upload để hiển thị thương hiệu ở trang tìm clinic và dashboard.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-po-text-muted ring-1 ring-po-border/80">
              <UploadCloud className="size-3.5" />
              JPG, PNG, WEBP
            </span>
          </div>
          <ImageUploadField
            value={form.logoUrl}
            onChange={(url) => onValueChange("logoUrl", url)}
            onUploadComplete={(result) => onValueChange("logoCloudinaryPublicId", result.publicId)}
            imageType="clinic_logo"
            previewClassName="h-32 w-32 rounded-2xl border border-po-border object-cover"
            maxSizeMb={5}
            showHelpText={false}
            disabled={isSaving}
            onUploadStateChange={setIsImageUploading}
          />
        </div>

        <div className="grid gap-4 rounded-[26px] bg-white p-4 ring-1 ring-po-border/80 md:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
              <MapPin className="size-4" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-po-text">Địa chỉ phòng khám</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">
                Chọn theo danh mục để hạn chế sai chính tả. FE sẽ ghép thành chuỗi địa chỉ gửi về backend.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Tỉnh/Thành phố"
              value={form.provinceCode}
              onChange={onChange("provinceCode")}
              options={provinceOptions.map((province) => ({
                value: province.code,
                label: province.name,
              }))}
              placeholder="Chọn tỉnh/thành"
              error={errors.provinceCode}
              required
            />
            <SelectField
              label="Quận/Huyện"
              value={form.districtCode}
              onChange={onChange("districtCode")}
              options={districtOptions.map((district) => ({
                value: district.code,
                label: district.name,
              }))}
              placeholder="Chọn quận/huyện"
              error={errors.districtCode}
              disabled={!form.provinceCode}
              required
            />
            <SelectField
              label="Phường/Xã"
              value={form.wardCode}
              onChange={onChange("wardCode")}
              options={wardOptions.map((ward) => ({
                value: ward.code,
                label: ward.name,
              }))}
              placeholder="Chọn phường/xã"
              error={errors.wardCode}
              disabled={!form.districtCode}
              required
            />
          </div>

          <InputField
            label="Số nhà, tên đường"
            value={form.addressDetail}
            onChange={onChange("addressDetail")}
            placeholder="VD: 12 Nguyễn Văn Hưởng"
            error={errors.addressDetail}
            required
          />

          {composedAddress ? (
            <div className="rounded-2xl bg-po-surface-muted px-4 py-3 text-sm text-po-text-muted ring-1 ring-po-border/70">
              <span className="font-semibold text-po-text">Địa chỉ sẽ lưu:</span> {composedAddress}
            </div>
          ) : null}
        </div>

        {message ? (
          <p className="rounded-2xl bg-po-success-soft px-4 py-3 text-sm font-semibold text-po-success">
            {message}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center rounded-full bg-po-surface-muted px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ phòng khám"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </form>
    </DashboardSection>
  )
}

function FlowStep({
  icon: Icon,
  title,
  text,
  active,
  done,
  disabled,
  onClick,
}: {
  icon: React.ElementType
  title: string
  text: string
  active?: boolean
  done?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        "rounded-[26px] bg-white/85 p-5 text-left shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 transition",
        active && !done && "bg-white shadow-md shadow-orange-200/25 ring-po-primary/40",
        done && "bg-white ring-po-success/25",
        !disabled && onClick && "hover:-translate-y-0.5 hover:shadow-md",
        disabled && !done && "cursor-default opacity-80",
        disabled && done && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-po-text">{title}</p>
          <p className="mt-1 text-xs leading-5 text-po-text-muted">{text}</p>
        </div>
        <span
          className={cn(
            "grid size-10 place-items-center rounded-2xl",
            done
              ? "bg-po-success-soft text-po-success"
              : active
                ? "bg-po-primary text-white"
                : "bg-po-primary-soft text-po-primary",
          )}
        >
          {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
        </span>
      </div>
    </button>
  )
}

function ExistingClinicPanel({
  clinic,
  onOpenClinic,
}: {
  clinic: MyClinicResponse
  onOpenClinic: () => void
}) {
  const reviewState =
    clinic.status === "Approved"
      ? {
          title: "Đã được duyệt",
          description: "Bạn có thể vào dashboard phòng khám và bắt đầu quản lý lịch hẹn.",
          hint: "Phòng khám đang hoạt động",
        }
      : clinic.status === "Rejected"
        ? {
            title: "Cần bổ sung hồ sơ",
            description: "Hồ sơ bị từ chối. Hãy kiểm tra lý do và chuẩn bị nộp lại khi chức năng resubmit được mở.",
            hint: "Cần chủ phòng khám xử lý",
          }
        : {
            title: "Đang chờ duyệt",
            description: "Admin đang kiểm tra giấy phép và thông tin liên hệ của phòng khám.",
            hint: "Thường xử lý sau khi giấy phép hợp lệ",
          }

  return (
    <DashboardSection
      title="Phòng khám của bạn"
      subtitle="Tài khoản này đã có hồ sơ phòng khám, không cần đăng ký lại."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl bg-po-surface-muted/65 p-5 ring-1 ring-po-border/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
              <Building2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-po-text">{clinic.clinicName}</p>
              <p className="mt-1 text-xs text-po-text-muted">{clinic.address ?? "Chưa có địa chỉ"}</p>
            </div>
            <StatusBadge variant={statusVariant(clinic.status)} label={statusLabel(clinic.status)} />
          </div>

          <div className="mt-5 grid gap-3 text-sm text-po-text-muted sm:grid-cols-2">
            <InfoRow label="Email" value={clinic.email ?? "Chưa có"} />
            <InfoRow label="Điện thoại" value={clinic.phone ?? "Chưa có"} />
            <InfoRow label="Giấy phép" value={clinic.licenseNumber ?? "Chưa có"} />
            <InfoRow label="Ngày tạo" value={formatDate(clinic.createdAt)} />
          </div>

          {clinic.rejectedReason ? (
            <p className="mt-4 rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
              Lý do từ chối: {clinic.rejectedReason}
            </p>
          ) : null}
        </div>

        <aside className="relative overflow-hidden rounded-[26px] bg-white p-5 ring-1 ring-po-border/80">
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-po-primary-soft/80" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-2xl ring-1 ring-po-border/70",
                  clinic.status === "Approved"
                    ? "bg-po-success-soft text-po-success"
                    : clinic.status === "Rejected"
                      ? "bg-po-danger-soft text-po-danger"
                      : "bg-po-primary-soft text-po-primary",
                )}
              >
                {clinic.status === "Approved" ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <FileText className="size-5" />
                )}
              </span>
              <StatusBadge variant={statusVariant(clinic.status)} label={statusLabel(clinic.status)} />
            </div>

            <h3 className="mt-5 text-lg font-extrabold text-po-text">{reviewState.title}</h3>
            <p className="mt-2 text-sm leading-6 text-po-text-muted">{reviewState.description}</p>

            <div className="mt-5 rounded-2xl bg-po-surface-muted/75 px-4 py-3 ring-1 ring-po-border/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-po-text-subtle">
                Trạng thái xử lý
              </p>
              <p className="mt-1 text-sm font-semibold text-po-text">{reviewState.hint}</p>
            </div>

            {clinic.status === "Approved" ? (
              <button
                type="button"
                onClick={onOpenClinic}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-200/45 transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0"
              >
                Vào dashboard phòng khám
                <ArrowRight className="size-4" />
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </DashboardSection>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-po-text-subtle">{label}</p>
      <p className="mt-1 font-semibold text-po-text">{value}</p>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  error,
  helper,
}: {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  required?: boolean
  error?: string
  helper?: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      <span>
        {label}
        {required ? <span className="ml-1 text-po-danger">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 rounded-2xl border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:ring-2",
          error
            ? "border-po-danger focus:border-po-danger focus:ring-po-danger/15"
            : "border-po-border focus:border-po-primary focus:ring-po-primary/20",
        )}
      />
      {error ? (
        <span className="text-xs font-semibold leading-5 text-po-danger">{error}</span>
      ) : helper ? (
        <span className="text-xs font-medium leading-5 text-po-text-muted">{helper}</span>
      ) : null}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  error,
}: {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
  required?: boolean
  disabled?: boolean
  error?: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      <span>
        {label}
        {required ? <span className="ml-1 text-po-danger">*</span> : null}
      </span>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 rounded-2xl border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-po-surface-muted disabled:text-po-text-subtle",
          error
            ? "border-po-danger focus:border-po-danger focus:ring-po-danger/15"
            : "border-po-border focus:border-po-primary focus:ring-po-primary/20",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-xs font-semibold leading-5 text-po-danger">{error}</span>
      ) : null}
    </label>
  )
}
