import Phaser from 'phaser';
import { invariant } from '@domain/common/invariant';

export interface DragPoint {
  x: number;
  y: number;
}

export interface DragControllerOptions {
  onDragStart?: (point: DragPoint) => void;
  onDragMove?: (point: DragPoint) => void;
  onDragEnd?: (point: DragPoint) => void;
}

type Target = Phaser.GameObjects.GameObject & { input: Phaser.Types.Input.InteractiveObject | null };

/**
 * PLAN §11.1: only the pointer that started the gesture drives it; a release outside the
 * canvas still ends it because Phaser's InputManager listens on `window` by default
 * (game config `input.windowEvents`, on unless explicitly disabled).
 * `target` must already be interactive (call setInteractive() before constructing this).
 */
export class DragController {
  private activePointerId: number | null = null;
  private readonly target: Target;
  private readonly options: DragControllerOptions;

  constructor(target: Target, options: DragControllerOptions) {
    invariant(target.input !== null, 'DragController target must call setInteractive() first');
    this.target = target;
    this.options = options;
    target.on('pointerdown', this.handleDown, this);
    target.scene.input.on('pointermove', this.handleMove, this);
    target.scene.input.on('pointerup', this.handleUp, this);
    target.scene.input.on('pointerupoutside', this.handleUp, this);
    target.once(Phaser.GameObjects.Events.DESTROY, () => this.destroy());
  }

  destroy(): void {
    this.target.off('pointerdown', this.handleDown, this);
    this.target.scene.input.off('pointermove', this.handleMove, this);
    this.target.scene.input.off('pointerup', this.handleUp, this);
    this.target.scene.input.off('pointerupoutside', this.handleUp, this);
  }

  private handleDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId !== null) return;
    this.activePointerId = pointer.id;
    this.options.onDragStart?.({ x: pointer.x, y: pointer.y });
  }

  private handleMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.options.onDragMove?.({ x: pointer.x, y: pointer.y });
  }

  private handleUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.activePointerId = null;
    this.options.onDragEnd?.({ x: pointer.x, y: pointer.y });
  }
}
