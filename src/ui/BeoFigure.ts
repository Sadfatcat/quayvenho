import Phaser from 'phaser';
import { BEO_ATLAS_KEY, CustomerAvatar } from './CustomerAvatar';

export type BeoPose = 'greeting' | 'excited' | 'sly' | 'worried' | 'pointing' | 'proud' | 'sad' | 'thinking';

const BUST_RADIUS_PER_HEIGHT = 0.45;
/** Chiều cao gốc của khung toàn thân trong atlas (tools/buildAtlas.mjs): mọi tư thế dùng cùng tỉ lệ nên không to nhỏ lệch nhau. */
const FULL_BODY_REFERENCE_HEIGHT = 420;

/**
 * Béo đứng nói: ảnh toàn thân theo tư thế, chân đặt ở `bottomY`. Nếu chưa có ảnh trong atlas thì dùng
 * chân dung vẽ bằng code (CustomerAvatar 'beo') để màn vẫn hiển thị được.
 */
export const addBeoFigure = (scene: Phaser.Scene, x: number, bottomY: number, height: number, pose: BeoPose): Phaser.GameObjects.Container => {
  const holder = scene.add.container(x, bottomY);
  const frame = `beo_${pose}`;
  if (scene.textures.exists(BEO_ATLAS_KEY) && scene.textures.get(BEO_ATLAS_KEY).has(frame)) {
    const image = scene.add.image(0, 0, BEO_ATLAS_KEY, frame).setOrigin(0.5, 1);
    image.setScale(height / FULL_BODY_REFERENCE_HEIGHT);
    holder.add(image);
    return holder;
  }
  holder.add(new CustomerAvatar(scene, 0, -height / 2, height * BUST_RADIUS_PER_HEIGHT, 'beo'));
  return holder;
};
