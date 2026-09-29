import { loadSave, type LoadSaveResult } from '@save/storage';
import { BaseScene } from './BaseScene';

export class BootScene extends BaseScene {
  constructor() {
    super('Boot');
  }

  protected onCreate(): void {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('playground')) {
      this.scene.start('Playground');
      return;
    }

    const loadResult: LoadSaveResult = loadSave();
    this.registry.set('loadResult', loadResult);

    this.scene.start('Preload');
  }
}
