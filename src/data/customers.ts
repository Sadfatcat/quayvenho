export const CUSTOMER_SPRITES: readonly string[] = Array.from(
  { length: 16 },
  (_, i) => `c${String(i + 1).padStart(2, '0')}`,
);

export const FAMILY_NAMES: readonly string[] = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ',
  'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương',
];

export const MIDDLE_NAMES: readonly string[] = [
  'Văn', 'Thị', 'Minh', 'Ngọc', 'Thanh', 'Hữu', 'Đức', 'Quang', 'Thu', 'Hoài',
  'Gia', 'Bảo', 'Khánh', 'Tuấn', 'Hải', 'Anh', 'Phương', 'Xuân', 'Kim', 'Mai',
];

export const GIVEN_NAMES: readonly string[] = [
  'An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hạnh', 'Hiếu', 'Hòa', 'Hùng',
  'Huy', 'Khoa', 'Lan', 'Linh', 'Long', 'Mạnh', 'My', 'Nam', 'Nga', 'Nhung',
  'Phong', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Thắng', 'Trang', 'Trí',
  'Trung', 'Tú', 'Uyên', 'Vân', 'Việt', 'Vy', 'Yến', 'Đạt', 'Nhi', 'Khang',
];

export const MAX_FULL_NAME_LENGTH = 22;

/** Quê quán hiện trên hộ chiếu (chỉ để trang trí, không ảnh hưởng chấm điểm). */
export const HOMETOWNS: readonly string[] = [
  'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Nam Định', 'Thái Bình', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh',
  'Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Khánh Hòa', 'Đà Lạt', 'Cần Thơ',
  'TP. Hồ Chí Minh', 'Vũng Tàu', 'Tiền Giang', 'Cà Mau',
];
/** Tuổi trên hộ chiếu và năm làm mốc để tính năm sinh. */
export const PASSPORT_AGE_RANGE = { min: 18, max: 70 } as const;
export const PASSPORT_REFERENCE_YEAR = 2026;
