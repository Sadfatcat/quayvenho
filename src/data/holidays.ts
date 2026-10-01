export interface HolidayDef {
  id: string;
  name: string;
}

/** Ngày lễ chọn ngẫu nhiên cho sự kiện RUSH (PLAN §8); tên hiện ở thông báo ngày lễ. */
export const HOLIDAYS: readonly HolidayDef[] = [
  { id: 'TET', name: 'Tết Nguyên Đán' },
  { id: 'HUNG_KINGS', name: 'Giỗ Tổ Hùng Vương' },
  { id: 'REUNIFICATION', name: 'Lễ 30/4 – 1/5' },
  { id: 'NATIONAL_DAY', name: 'Quốc khánh 2/9' },
  { id: 'MID_AUTUMN', name: 'Tết Trung thu' },
  { id: 'CHRISTMAS', name: 'Giáng sinh' },
];
