import type { StaffDef } from '@domain/models';

/**
 * Nhân viên tự phục vụ khách "đơn giản" (không dịch vụ thêm, hộ chiếu đúng, không phải khách đặc biệt) từ hàng chờ.
 * Trả tiền thuê một lần và lương mỗi ngày (trừ lúc tổng kết). `accuracyPct`: xác suất ghi đúng cân hành lý.
 */
export const STAFF: readonly StaffDef[] = [
  { id: 'TRAINEE', hireCost: 4500, wagePerDay: 600, serveMs: 45_000, accuracyPct: 70, minDay: 3, handlesSeatPositions: false },
  { id: 'VETERAN', hireCost: 12000, wagePerDay: 1500, serveMs: 25_000, accuracyPct: 95, minDay: 8, handlesSeatPositions: true },
];
