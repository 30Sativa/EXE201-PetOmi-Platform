import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createPetApi, updatePetApi } from "@/services/pets.service"
import ImageUploadField from "@/components/ui/ImageUploadField"
import type {
  CreatePetRequest,
  PetResponse,
  UpdatePetRequest,
} from "@/types"
import { cn } from "@/lib/utils"

interface PetModalProps {
  isOpen: boolean
  onClose: () => void
  pet?: PetResponse | null
  onSuccess?: (message: string) => void
}

// ==================== BREED DATA ====================

const BREED_DATA: Record<string, { vi: string; en?: string }[]> = {
  Dog: [
    { vi: "Chưa rõ giống (Mixed Breed)", en: "Mixed Breed" },
    { vi: "Chó ta (Mongrel)", en: "Mongrel" },
    { vi: "Chó Alaska (Alaska Malamute)", en: "Alaska Malamute" },
    { vi: "Chó Beagle (Beagle)", en: "Beagle" },
    { vi: "Chó Corgi (Corgi)", en: "Corgi" },
    { vi: "Chó lạp xưởng (Dachshund)", en: "Dachshund" },
    { vi: "Chó tha mồi vàng (Golden Retriever)", en: "Golden Retriever" },
    { vi: "Chó Husky (Husky)", en: "Husky" },
    { vi: "Chó Labrador (Labrador)", en: "Labrador" },
    { vi: "Chó Phốc Sóc (Pomeranian)", en: "Pomeranian" },
    { vi: "Chó Poodle (Poodle)", en: "Poodle" },
    { vi: "Chó Rottweiler (Rottweiler)", en: "Rottweiler" },
    { vi: "Chó Shiba Inu (Shiba Inu)", en: "Shiba Inu" },
    { vi: "Chó Chow Chow (Chow Chow)", en: "Chow Chow" },
    { vi: "Chó Bulldog (Bulldog)", en: "Bulldog" },
    { vi: "Chó Becgie Đức (German Shepherd)", en: "German Shepherd" },
    { vi: "Chó Border Collie (Border Collie)", en: "Border Collie" },
    { vi: "Chó Cavalier King Charles (Cavalier King Charles)", en: "Cavalier King Charles" },
    { vi: "Khác", en: "Other" },
  ],
  Cat: [
    { vi: "Chưa rõ giống (Mixed Breed)", en: "Mixed Breed" },
    { vi: "Mèo ta (Mongrel)", en: "Mongrel" },
    { vi: "Mèo Anh lông ngắn (British Shorthair)", en: "British Shorthair" },
    { vi: "Mèo Ba Tư (Persian)", en: "Persian" },
    { vi: "Mèo Xiêm (Siamese)", en: "Siamese" },
    { vi: "Mèo Ragdoll (Ragdoll)", en: "Ragdoll" },
    { vi: "Mèo Maine Coon (Maine Coon)", en: "Maine Coon" },
    { vi: "Mèo Bengal (Bengal)", en: "Bengal" },
    { vi: "Mèo tai cụp Scotland (Scottish Fold)", en: "Scottish Fold" },
    { vi: "Mèo không lông Sphynx (Sphynx)", en: "Sphynx" },
    { vi: "Mèo Nga xanh (Russian Blue)", en: "Russian Blue" },
    { vi: "Mèo Abyssinian (Abyssinian)", en: "Abyssinian" },
    { vi: "Mèo Thần Miến (Birman)", en: "Birman" },
    { vi: "Mèo rừng Na Uy (Norwegian Forest)", en: "Norwegian Forest" },
    { vi: "Khác", en: "Other" },
  ],
}

const SPECIES_OPTIONS = [
  { value: "Dog", vi: "Chó" },
  { value: "Cat", vi: "Mèo" },
]

interface FormState {
  name: string
  species: string
  breed: string
  breedCustom: string
  gender: string
  isNeutered: string
  dateOfBirth: string
  isBirthDateEstimated: boolean
  color: string
  avatarUrl: string
  avatarCloudinaryPublicId: string
}

const defaultForm: FormState = {
  name: "",
  species: "Dog",
  breed: "",
  breedCustom: "",
  gender: "",
  isNeutered: "",
  dateOfBirth: "",
  isBirthDateEstimated: false,
  color: "",
  avatarUrl: "",
  avatarCloudinaryPublicId: "",
}

function parseDateOnly(dateStr: string | null): string {
  if (!dateStr) return ""
  return dateStr.split("T")[0]
}

export default function PetModal({ isOpen, onClose, pet, onSuccess }: PetModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const isEdit = Boolean(pet)

  const initForm = (): FormState => {
    if (pet) {
      const breed = pet.breed ?? ""
      const breeds = BREED_DATA[pet.species] ?? []
      const found = breeds.find((b) => b.en === breed || b.vi === breed)
      return {
        name: pet.name,
        species: pet.species,
        breed: found ? found.vi : "Khác",
        breedCustom: found ? "" : breed,
        gender: pet.gender ?? "",
        isNeutered: pet.isNeutered ?? "",
        dateOfBirth: parseDateOnly(pet.dateOfBirth),
        isBirthDateEstimated: pet.isBirthDateEstimated,
        color: pet.color ?? "",
        avatarUrl: pet.avatarUrl ?? "",
        avatarCloudinaryPublicId: pet.avatarCloudinaryPublicId ?? "",
      }
    }
    return { ...defaultForm }
  }

  const [form, setForm] = useState<FormState>(initForm)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)

  useEffect(() => {
    setForm(initForm())
  }, [isOpen, pet])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  const createMutation = useMutation({
    mutationFn: (data: CreatePetRequest) => createPetApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pets"] })
      queryClient.invalidateQueries({ queryKey: ["pet", pet?.petId] })
      handleClose()
      onSuccess?.("Thêm thú cưng thành công!")
    },
    onError: () => {
      onSuccess?.("Đã xảy ra lỗi. Vui lòng thử lại.")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePetRequest) => updatePetApi(pet!.petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pets"] })
      queryClient.invalidateQueries({ queryKey: ["pet", pet!.petId] })
      handleClose()
      onSuccess?.("Cập nhật thú cưng thành công!")
    },
    onError: () => {
      onSuccess?.("Đã xảy ra lỗi. Vui lòng thử lại.")
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending
  const isSaving = isLoading || isAvatarUploading

  const handleClose = () => {
    if (isSaving) return
    setForm(defaultForm)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) handleClose()
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setSpecies = (species: string) => {
    setForm((prev) => ({
      ...prev,
      species,
      breed: "",
      breedCustom: "",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    const finalBreed = form.breed === "Khác"
      ? form.breedCustom.trim()
      : BREED_DATA[form.species]?.find(b => b.vi === form.breed)?.en ?? form.breed

    if (isEdit) {
      const payload: UpdatePetRequest = {
        name: form.name.trim(),
        species: form.species,
        breed: finalBreed || null,
        gender: form.gender || null,
        isNeutered: form.isNeutered || null,
        dateOfBirth: form.dateOfBirth || null,
        isBirthDateEstimated: form.isBirthDateEstimated,
        color: form.color.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        avatarCloudinaryPublicId: form.avatarCloudinaryPublicId.trim() || null,
      }
      updateMutation.mutate(payload)
    } else {
      const payload: CreatePetRequest = {
        name: form.name.trim(),
        species: form.species,
        breed: finalBreed || undefined,
        gender: form.gender || undefined,
        isNeutered: form.isNeutered || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        isBirthDateEstimated: form.isBirthDateEstimated,
        color: form.color.trim() || undefined,
        avatarUrl: form.avatarUrl.trim() || undefined,
        avatarCloudinaryPublicId: form.avatarCloudinaryPublicId.trim() || undefined,
      }
      createMutation.mutate(payload)
    }
  }

  if (!isOpen) return null

  const breeds = BREED_DATA[form.species] ?? [{ vi: "Chưa rõ giống (Mixed Breed)", en: "Mixed Breed" }]

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
      onCancel={(e) => { e.preventDefault(); handleClose() }}
    >
      <div className="m-auto w-[min(540px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-po-text">
            {isEdit ? "Chỉnh sửa thú cưng" : "Thêm thú cưng mới"}
          </h3>
          <p className="mt-1 text-sm text-po-text-muted">
            {isEdit
              ? "Cập nhật thông tin cho thú cưng của bạn."
              : "Điền thông tin để tạo hồ sơ cho thú cưng."}
          </p>
        </div>
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-40"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        {/* Name */}
        <div className="grid gap-1.5">
          <label htmlFor="pet-name" className="text-sm font-semibold text-po-text">
            Tên thú cưng <span className="text-po-danger">*</span>
          </label>
          <input
            id="pet-name"
            type="text"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="VD: Mochi, Bim, Luna..."
            required
            disabled={isSaving}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm text-po-text placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        {/* Species */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">
            Loài <span className="text-po-danger">*</span>
          </label>
          <div className="flex gap-2">
            {SPECIES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSpecies(opt.value)}
                disabled={isLoading}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition",
                  form.species === opt.value
                    ? "border-po-primary bg-po-primary/10 text-po-primary"
                    : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong hover:text-po-text",
                  isLoading && "opacity-60",
                )}
              >
                {opt.vi}
              </button>
            ))}
          </div>
        </div>

        {/* Breed */}
        <div className="grid gap-1.5">
          <label htmlFor="pet-breed" className="text-sm font-semibold text-po-text">
            Giống
          </label>
          <select
            id="pet-breed"
            value={form.breed}
            onChange={(e) => setField("breed", e.target.value)}
            disabled={isLoading}
            className="h-11 w-full cursor-pointer rounded-xl border border-po-border bg-white px-4 text-sm text-po-text focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          >
            {breeds.map((b) => (
              <option key={b.vi} value={b.vi}>{b.vi}</option>
            ))}
          </select>
          {form.breed === "Khác" && (
            <input
              type="text"
              value={form.breedCustom}
              onChange={(e) => setField("breedCustom", e.target.value)}
              placeholder="Nhập giống khác..."
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm text-po-text placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          )}
        </div>

        {/* Color + Gender */}
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="pet-color" className="text-sm font-semibold text-po-text">
              Màu lông / Đặc điểm
            </label>
            <input
              id="pet-color"
              type="text"
              value={form.color}
              onChange={(e) => setField("color", e.target.value)}
              placeholder="VD: Vàng cỏ, đốm trắng..."
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm text-po-text placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Giới tính</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "Male", label: "Đực" },
                { value: "Female", label: "Cái" },
                { value: "Unknown", label: "Không rõ" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField("gender", form.gender === opt.value ? "" : opt.value)}
                  disabled={isLoading}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    form.gender === opt.value
                      ? "border-po-primary bg-po-primary/10 text-po-primary"
                      : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong hover:text-po-text",
                    isLoading && "opacity-60",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Neutered */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Triệt sản</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "Yes", label: "Đã triệt sản" },
              { value: "No", label: "Chưa triệt sản" },
              { value: "Unknown", label: "Không rõ" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setField("isNeutered", form.isNeutered === opt.value ? "" : opt.value)}
                disabled={isLoading}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  form.isNeutered === opt.value
                    ? "border-po-primary bg-po-primary/10 text-po-primary"
                    : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong hover:text-po-text",
                  isLoading && "opacity-60",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date of Birth */}
        <div className="grid gap-1.5">
          <label htmlFor="pet-dob" className="text-sm font-semibold text-po-text">
            Ngày sinh
          </label>
          <div className="flex items-center gap-3">
            <input
              id="pet-dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              disabled={isLoading}
              className="h-11 flex-1 cursor-pointer rounded-xl border border-po-border bg-white px-4 text-sm text-po-text focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
            <label className="flex items-center gap-2 text-sm text-po-text-muted">
              <input
                type="checkbox"
                checked={form.isBirthDateEstimated}
                onChange={(e) => setField("isBirthDateEstimated", e.target.checked)}
                disabled={isLoading}
                className="size-4 cursor-pointer rounded accent-po-primary"
              />
              Ước lượng
            </label>
          </div>
        </div>

        {/* Avatar */}
        <ImageUploadField
          label="Ảnh đại diện"
          value={form.avatarUrl}
          onChange={(url) => {
            setField("avatarUrl", url)
            if (!url) setField("avatarCloudinaryPublicId", "")
          }}
          onUploadComplete={(result) => setField("avatarCloudinaryPublicId", result.publicId)}
          onUploadStateChange={setIsAvatarUploading}
          imageType="pet_avatar"
          resourceId={pet?.petId}
          disabled={isLoading}
        />

        {/* Actions */}
        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving || !form.name.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {isAvatarUploading ? "Dang upload anh..." : isLoading ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Thêm thú cưng"}
          </button>
        </div>
      </form>
      </div>
    </dialog>
  )
}
