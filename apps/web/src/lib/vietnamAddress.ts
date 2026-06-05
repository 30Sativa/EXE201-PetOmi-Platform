export interface VietnamWardOption {
  value: string
  label: string
}

export interface VietnamCityOption {
  value: string
  label: string
  wards: VietnamWardOption[]
}

export const VIETNAM_CITY_OPTIONS: VietnamCityOption[] = [
  {
    value: "ho-chi-minh",
    label: "TP. Hồ Chí Minh",
    wards: [
      { value: "ben-nghe", label: "Phường Bến Nghé" },
      { value: "ben-thanh", label: "Phường Bến Thành" },
      { value: "da-kao", label: "Phường Đa Kao" },
      { value: "tan-dinh", label: "Phường Tân Định" },
      { value: "thao-dien", label: "Phường Thảo Điền" },
      { value: "an-phu", label: "Phường An Phú" },
      { value: "linh-trung", label: "Phường Linh Trung" },
      { value: "hiep-binh-chanh", label: "Phường Hiệp Bình Chánh" },
    ],
  },
  {
    value: "ha-noi",
    label: "Hà Nội",
    wards: [
      { value: "hang-bac", label: "Phường Hàng Bạc" },
      { value: "hang-bong", label: "Phường Hàng Bông" },
      { value: "cua-dong", label: "Phường Cửa Đông" },
      { value: "kim-ma", label: "Phường Kim Mã" },
      { value: "dich-vong", label: "Phường Dịch Vọng" },
      { value: "trung-hoa", label: "Phường Trung Hòa" },
      { value: "my-dinh-1", label: "Phường Mỹ Đình 1" },
      { value: "phuc-dien", label: "Phường Phúc Diễn" },
    ],
  },
  {
    value: "da-nang",
    label: "Đà Nẵng",
    wards: [
      { value: "hai-chau-1", label: "Phường Hải Châu 1" },
      { value: "hai-chau-2", label: "Phường Hải Châu 2" },
      { value: "an-hai-bac", label: "Phường An Hải Bắc" },
      { value: "an-hai-dong", label: "Phường An Hải Đông" },
      { value: "khue-my", label: "Phường Khuê Mỹ" },
      { value: "hoa-cuong-bac", label: "Phường Hòa Cường Bắc" },
    ],
  },
  {
    value: "can-tho",
    label: "Cần Thơ",
    wards: [
      { value: "tan-an", label: "Phường Tân An" },
      { value: "an-cu", label: "Phường An Cư" },
      { value: "xuan-khanh", label: "Phường Xuân Khánh" },
      { value: "an-khanh", label: "Phường An Khánh" },
      { value: "cai-khe", label: "Phường Cái Khế" },
    ],
  },
  {
    value: "hai-phong",
    label: "Hải Phòng",
    wards: [
      { value: "minh-khai", label: "Phường Minh Khai" },
      { value: "may-to", label: "Phường Máy Tơ" },
      { value: "dang-giang", label: "Phường Đằng Giang" },
      { value: "du-hang-kenh", label: "Phường Dư Hàng Kênh" },
      { value: "cat-bi", label: "Phường Cát Bi" },
    ],
  },
]

export function getVietnamCity(value: string) {
  return VIETNAM_CITY_OPTIONS.find((city) => city.value === value)
}
