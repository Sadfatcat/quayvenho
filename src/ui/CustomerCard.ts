import Phaser from 'phaser';
import type { Customer, Mood } from '@domain/models';
import { patienceRatioOf } from '@domain/dayCycle';
import { CustomerAvatar, type AvatarMood } from './CustomerAvatar';
import { orderRequestLines } from './orderRequest';
import { Panel } from './Panel';
import { PatienceBar } from './PatienceBar';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from './theme';

const MOOD_TO_AVATAR: Record<Mood, AvatarMood> = { HAPPY: 'happy', NEUTRAL: 'neutral', IMPATIENT: 'angry' };

const AVATAR_CENTER = { x: 100, y: 256 };
const AVATAR_RADIUS = 64;
const CARD = { left: 196, top: 164, width: 500, height: 252 };
const ROW_TOP = CARD.top + 34;
const ROW_HEIGHT = 36;
const LABEL_X = CARD.left + 24;
const VALUE_X = CARD.left + 190;
const NAME_Y = AVATAR_CENTER.y + AVATAR_RADIUS + 22;
const PATIENCE_BAR = { x: AVATAR_CENTER.x - 66, y: NAME_Y + 34, width: 132, height: 14 };
const TAIL_HALF_HEIGHT = 20;
const TAIL_LENGTH = 30;
const QUEUE_BADGE = { x: AVATAR_CENTER.x + 52, y: AVATAR_CENTER.y - 52, radius: 26 };

/**
 * Khung khách ở phía trên Quầy: avatar tròn góc trên trái (kèm tên, thanh kiên nhẫn, số khách đang chờ) và khung
 * yêu cầu rõ từng dòng: đi đâu, hạng nào, giờ nào, ngồi đâu, hành lý, yêu cầu thêm.
 */
export class CustomerCard extends Phaser.GameObjects.Container {
  private content: Phaser.GameObjects.Container | null = null;
  private maskShape: Phaser.GameObjects.Graphics | null = null;
  private avatar: CustomerAvatar | null = null;
  private patienceBar: PatienceBar | null = null;
  private shownCustomerId: string | null = null;
  private shownQueueCount = -1;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
  }

  /** Vẽ lại khi đổi khách hoặc số người chờ; mỗi khung hình chỉ cập nhật thanh kiên nhẫn và mặt khách. */
  update(customer: Customer | undefined, queueCount: number, arriveLine?: string): void {
    const customerId = customer?.order.customerId ?? null;
    if (customerId !== this.shownCustomerId || queueCount !== this.shownQueueCount) {
      this.shownCustomerId = customerId;
      this.shownQueueCount = queueCount;
      this.rebuild(customer, queueCount, arriveLine);
    }
    if (customer && this.patienceBar) {
      this.patienceBar.setProgress(patienceRatioOf(customer));
      this.patienceBar.setMood(customer.mood);
      this.avatar?.setMood(MOOD_TO_AVATAR[customer.mood]);
    }
  }

  private clear(): void {
    this.content?.destroy();
    this.maskShape?.destroy();
    this.content = null;
    this.maskShape = null;
    this.avatar = null;
    this.patienceBar = null;
  }

  private rebuild(customer: Customer | undefined, queueCount: number, arriveLine?: string): void {
    this.clear();
    if (!customer) return;
    const scene = this.scene;
    const content = scene.add.container(0, 0);
    this.content = content;

    // Avatar tròn: nền kraft + ảnh cắt theo hình tròn + viền nâu.
    const disc = scene.add.graphics();
    disc.fillStyle(COLORS.kraft, 1);
    disc.fillCircle(AVATAR_CENTER.x, AVATAR_CENTER.y, AVATAR_RADIUS);
    this.maskShape = scene.make.graphics({}, false);
    this.maskShape.fillStyle(0xffffff, 1);
    this.maskShape.fillCircle(AVATAR_CENTER.x, AVATAR_CENTER.y, AVATAR_RADIUS);
    const avatar = new CustomerAvatar(scene, AVATAR_CENTER.x, AVATAR_CENTER.y + 14, AVATAR_RADIUS * 0.95, customer.order.spriteId, MOOD_TO_AVATAR[customer.mood]);
    avatar.setMask(this.maskShape.createGeometryMask());
    this.avatar = avatar;
    const ring = scene.add.graphics();
    ring.lineStyle(5, COLORS.primaryDark, 1);
    ring.strokeCircle(AVATAR_CENTER.x, AVATAR_CENTER.y, AVATAR_RADIUS);
    content.add([disc, avatar, ring]);

    const name = scene.add
      .text(AVATAR_CENTER.x, NAME_Y, customer.order.passport.bookedName, { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: toCssColor(COLORS.text), align: 'center', wordWrap: { width: 176 } })
      .setOrigin(0.5);
    this.patienceBar = new PatienceBar(scene, PATIENCE_BAR.x, PATIENCE_BAR.y, { width: PATIENCE_BAR.width, height: PATIENCE_BAR.height });
    content.add([name, this.patienceBar]);
    if (arriveLine) {
      content.add(scene.add.text(AVATAR_CENTER.x, PATIENCE_BAR.y + 30, arriveLine, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: 170 } }).setOrigin(0.5, 0));
    }

    if (queueCount > 0) {
      const badge = scene.add.graphics();
      badge.fillStyle(COLORS.accent, 1);
      badge.fillCircle(QUEUE_BADGE.x, QUEUE_BADGE.y, QUEUE_BADGE.radius);
      badge.lineStyle(3, COLORS.primaryDark, 1);
      badge.strokeCircle(QUEUE_BADGE.x, QUEUE_BADGE.y, QUEUE_BADGE.radius);
      const count = scene.add.text(QUEUE_BADGE.x, QUEUE_BADGE.y, `+${queueCount}`, { fontFamily: HEADING_FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.cloud) }).setOrigin(0.5);
      content.add([badge, count]);
    }

    // Khung yêu cầu: đuôi trỏ về avatar + tab tên + các dòng rõ ràng.
    const panel = new Panel(scene, CARD.left + CARD.width / 2, CARD.top + CARD.height / 2, { width: CARD.width, height: CARD.height, strokeColor: COLORS.text });
    const tail = scene.add.graphics();
    const tailY = AVATAR_CENTER.y;
    tail.fillStyle(COLORS.cloud, 1);
    tail.fillTriangle(CARD.left + 2, tailY - TAIL_HALF_HEIGHT, CARD.left + 2, tailY + TAIL_HALF_HEIGHT, CARD.left - TAIL_LENGTH, tailY);
    tail.lineStyle(4, COLORS.text, 1);
    tail.beginPath();
    tail.moveTo(CARD.left, tailY - TAIL_HALF_HEIGHT);
    tail.lineTo(CARD.left - TAIL_LENGTH, tailY);
    tail.lineTo(CARD.left, tailY + TAIL_HALF_HEIGHT);
    tail.strokePath();
    tail.fillStyle(COLORS.cloud, 1);
    tail.fillRect(CARD.left - 1, tailY - TAIL_HALF_HEIGHT + 3, 6, TAIL_HALF_HEIGHT * 2 - 6);
    content.add([panel, tail]);

    orderRequestLines(customer.order).forEach((line, index) => {
      const y = ROW_TOP + index * ROW_HEIGHT;
      content.add([
        scene.add.text(LABEL_X, y, line.label, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) }).setOrigin(0, 0.5),
        scene.add
          .text(VALUE_X, y, line.value, {
            fontFamily: FONT_FAMILY,
            fontSize: '24px',
            fontStyle: line.demanding ? 'bold' : 'normal',
            color: toCssColor(line.demanding ? COLORS.accentDark : COLORS.textMuted),
            wordWrap: { width: CARD.width - (VALUE_X - CARD.left) - 20 },
          })
          .setOrigin(0, 0.5),
      ]);
    });

  }
}
