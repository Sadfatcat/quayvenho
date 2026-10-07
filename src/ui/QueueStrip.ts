import Phaser from 'phaser';
import type { Customer, Mood } from '@domain/models';
import { CustomerAvatar, type AvatarMood } from './CustomerAvatar';
import { COLORS, HEADING_FONT_FAMILY, toCssColor } from './theme';

const MOOD_TO_AVATAR: Record<Mood, AvatarMood> = { HAPPY: 'happy', NEUTRAL: 'neutral', IMPATIENT: 'angry' };
const MOOD_RING: Record<Mood, number> = { HAPPY: COLORS.success, NEUTRAL: COLORS.warning, IMPATIENT: COLORS.danger };
const STRIP_Y = 196;
const SLOT_WIDTH = 78;
const AVATAR_RADIUS = 30;
const MAX_VISIBLE = 8;
const LEFT_MARGIN = 24;
const SERVED_RING_WIDTH = 6;
const WAITING_RING_WIDTH = 4;
const CLIP_INSET = 2;

/** Thanh khách đang chờ nhìn từ trên xuống: khách đang được phục vụ ở đầu hàng (viền dày), sau đó là hàng chờ. */
export class QueueStrip extends Phaser.GameObjects.Container {
  private lastSignature = '';
  private maskShapes: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
  }

  destroy(fromScene?: boolean): void {
    for (const shape of this.maskShapes) shape.destroy();
    this.maskShapes = [];
    super.destroy(fromScene);
  }

  /** Cắt ảnh khách theo hình tròn để đầu/vai không lòi ra khỏi ô tròn. */
  private clipToDisc(avatar: CustomerAvatar, x: number): void {
    const shape = this.scene.make.graphics({}, false);
    shape.fillStyle(0xffffff, 1);
    shape.fillCircle(x, STRIP_Y, AVATAR_RADIUS - CLIP_INSET);
    this.maskShapes.push(shape);
    avatar.setMask(shape.createGeometryMask());
  }

  update(customers: readonly Customer[]): void {
    const signature = customers.map((customer) => `${customer.order.customerId}:${customer.mood}:${customer.position}`).join(',');
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;
    this.removeAll(true);
    for (const shape of this.maskShapes) shape.destroy();
    this.maskShapes = [];
    const visible = customers.slice(0, MAX_VISIBLE);
    visible.forEach((customer, index) => {
      const x = LEFT_MARGIN + SLOT_WIDTH / 2 + index * SLOT_WIDTH;
      const served = customer.position === 'COUNTER';
      const disc = this.scene.add.graphics();
      disc.fillStyle(COLORS.kraft, 1);
      disc.fillCircle(x, STRIP_Y, AVATAR_RADIUS);
      const avatar = new CustomerAvatar(this.scene, x, STRIP_Y + 4, AVATAR_RADIUS * 0.9, customer.order.spriteId, MOOD_TO_AVATAR[customer.mood]);
      this.clipToDisc(avatar, x);
      const ring = this.scene.add.graphics();
      ring.lineStyle(served ? SERVED_RING_WIDTH : WAITING_RING_WIDTH, MOOD_RING[customer.mood], 1);
      ring.strokeCircle(x, STRIP_Y, AVATAR_RADIUS);
      this.add([disc, avatar, ring]);
    });
    const hidden = customers.length - visible.length;
    if (hidden > 0) {
      this.add(
        this.scene.add
          .text(LEFT_MARGIN + SLOT_WIDTH * MAX_VISIBLE + 4, STRIP_Y, `+${hidden}`, { fontFamily: HEADING_FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
          .setOrigin(0, 0.5),
      );
    }
  }
}
