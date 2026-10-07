import type Phaser from 'phaser';
import type { StaffKind } from '@domain/models';

export const STAFF_ATLAS_KEY = 'staff';
export type StaffMood = 'focused' | 'happy' | 'tired';

const staffFrameName = (kind: StaffKind, mood: StaffMood): string => `staff_${kind.toLowerCase()}_${mood}`;

/** Ảnh nhân viên là tuỳ chọn: thiếu atlas thì trả null để nơi gọi tự vẽ hình tròn + chữ cái đầu như cũ. */
export const addStaffPortrait = (scene: Phaser.Scene, x: number, y: number, height: number, kind: StaffKind, mood: StaffMood = 'focused'): Phaser.GameObjects.Image | null => {
  const frame = staffFrameName(kind, mood);
  if (!scene.textures.exists(STAFF_ATLAS_KEY) || !scene.textures.get(STAFF_ATLAS_KEY).has(frame)) return null;
  const image = scene.add.image(x, y, STAFF_ATLAS_KEY, frame);
  image.setScale(height / image.height);
  return image;
};
