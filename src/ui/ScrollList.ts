import Phaser from 'phaser';
import { clamp } from '@domain/common/math';
import { DragController } from './DragController';
import { DRAG_TAP_THRESHOLD_PX } from './layout';

export interface ScrollListOptions<T> {
  x: number;
  y: number;
  width: number;
  height: number;
  itemHeight: number;
  items: readonly T[];
  renderItem: (item: T, index: number) => Phaser.GameObjects.Container;
}

const VIRTUALIZE_ABOVE = 15;
const BUFFER_ITEMS = 1;

/**
 * Vertical scroll list (PLAN §10.4/§11.4). Drag distance under DRAG_TAP_THRESHOLD_PX never
 * scrolls, and each row's own Button already ignores a release far from its press point, so
 * nested buttons (e.g. a Kho stepper) keep working while scrolling past them.
 * Only renders viewport ± 1 row once there are more than 15 items.
 */
export class ScrollList<T> extends Phaser.GameObjects.Container {
  private readonly viewport: Phaser.GameObjects.Rectangle;
  private readonly content: Phaser.GameObjects.Container;
  private readonly maskGraphics: Phaser.GameObjects.Graphics;
  private readonly dragController: DragController;
  private readonly options: ScrollListOptions<T>;
  private readonly rendered = new Map<number, Phaser.GameObjects.Container>();
  private items: readonly T[];
  private scrollY = 0;
  private dragStartY = 0;
  private dragStartScrollY = 0;

  constructor(scene: Phaser.Scene, options: ScrollListOptions<T>) {
    super(scene, options.x, options.y);
    this.options = options;
    this.items = options.items;

    this.viewport = scene.add.rectangle(0, 0, options.width, options.height, 0x000000, 0).setOrigin(0);
    this.viewport.setInteractive();
    this.content = scene.add.container(0, 0);
    this.add([this.viewport, this.content]);
    scene.add.existing(this);

    this.maskGraphics = scene.make.graphics({}, false);
    this.updateMask();
    this.content.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.maskGraphics));

    this.dragController = new DragController(this.viewport, {
      onDragStart: (point) => {
        this.dragStartY = point.y;
        this.dragStartScrollY = this.scrollY;
      },
      onDragMove: (point) => {
        const delta = point.y - this.dragStartY;
        if (Math.abs(delta) <= DRAG_TAP_THRESHOLD_PX) return;
        this.setScrollY(this.dragStartScrollY - delta);
      },
    });

    this.renderVisible();
  }

  setItems(items: readonly T[]): void {
    this.items = items;
    this.setScrollY(this.scrollY);
    this.renderVisible(true);
  }

  override destroy(fromScene?: boolean): void {
    this.dragController.destroy();
    this.maskGraphics.destroy();
    super.destroy(fromScene);
  }

  private get maxScroll(): number {
    return Math.max(0, this.items.length * this.options.itemHeight - this.options.height);
  }

  private setScrollY(value: number): void {
    this.scrollY = clamp(value, 0, this.maxScroll);
    this.content.setY(-this.scrollY);
    this.renderVisible();
  }

  private updateMask(): void {
    const topLeft = this.getWorldTransformMatrix().transformPoint(0, 0);
    this.maskGraphics.clear();
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillRect(topLeft.x, topLeft.y, this.options.width, this.options.height);
  }

  private renderVisible(forceAll = false): void {
    const { itemHeight, height, renderItem } = this.options;
    const virtualize = this.items.length > VIRTUALIZE_ABOVE;
    const from = virtualize ? Math.max(0, Math.floor(this.scrollY / itemHeight) - BUFFER_ITEMS) : 0;
    const to = virtualize
      ? Math.min(this.items.length - 1, Math.ceil((this.scrollY + height) / itemHeight) + BUFFER_ITEMS)
      : this.items.length - 1;

    for (const [index, gameObject] of this.rendered) {
      if (forceAll || index < from || index > to) {
        gameObject.destroy();
        this.rendered.delete(index);
      }
    }
    for (let index = from; index <= to; index++) {
      if (this.rendered.has(index)) continue;
      const item = this.items[index];
      if (item === undefined) continue;
      const gameObject = renderItem(item, index);
      gameObject.setY(index * itemHeight);
      this.content.add(gameObject);
      this.rendered.set(index, gameObject);
    }
  }
}
