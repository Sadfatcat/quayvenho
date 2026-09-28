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
