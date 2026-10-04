import Phaser from 'phaser';
import { ATLAS_KEY, CustomerAvatar } from './CustomerAvatar';

export type BeoPose = 'greeting' | 'excited' | 'sly' | 'worried' | 'pointing';

const BUST_RADIUS_PER_HEIGHT = 0.45;

/**
 * Béo đứng nói: ảnh toàn thân theo tư thế, chân đặt ở `bottomY`. Nếu chưa có ảnh trong atlas thì dùng
 * chân dung vẽ bằng code (CustomerAvatar 'beo') để màn vẫn hiển thị được.
 */
export const addBeoFigure = (scene: Phaser.Scene, x: number, bottomY: number, height: number, pose: BeoPose): Phaser.GameObjects.Container => {
  const holder = scene.add.container(x, bottomY);
  const frame = `beo_${pose}`;
  if (scene.textures.exists(ATLAS_KEY) && scene.textures.get(ATLAS_KEY).has(frame)) {
    const image = scene.add.image(0, 0, ATLAS_KEY, frame).setOrigin(0.5, 1);
    image.setScale(height / image.height);
    holder.add(image);
    return holder;
  }
  holder.add(new CustomerAvatar(scene, 0, -height / 2, height * BUST_RADIUS_PER_HEIGHT, 'beo'));
  return holder;
};
