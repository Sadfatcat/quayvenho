import Phaser from 'phaser';
import { Button, type ButtonVariant } from './Button';

export interface SegmentedControlOptions {
  width: number;
  height: number;
  labels: readonly string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const SELECTED_VARIANT: ButtonVariant = 'primary';
const UNSELECTED_VARIANT: ButtonVariant = 'ghost';

/** Reused for Shop tabs (5.1) and seat bias in Kho (when AIRLINE_RELATIONS is owned). */
export class SegmentedControl extends Phaser.GameObjects.Container {
  private readonly buttons: Button[];
  private selectedIndex: number;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SegmentedControlOptions) {
    super(scene, x, y);
    this.selectedIndex = options.selectedIndex;
    const segmentWidth = options.width / options.labels.length;

    this.buttons = options.labels.map((label, index) => {
      const segX = -options.width / 2 + segmentWidth * index + segmentWidth / 2;
      return new Button(scene, segX, 0, {
        width: segmentWidth - 4,
        height: options.height,
        label,
        variant: index === this.selectedIndex ? SELECTED_VARIANT : UNSELECTED_VARIANT,
        onTap: () => {
          if (index === this.selectedIndex) return;
          this.selectedIndex = index;
          this.refresh();
          options.onChange(index);
        },
      });
    });

    this.add(this.buttons);
    scene.add.existing(this);
  }

  private refresh(): void {
    this.buttons.forEach((button, index) => {
      button.setVariant(index === this.selectedIndex ? SELECTED_VARIANT : UNSELECTED_VARIANT);
    });
  }
}
