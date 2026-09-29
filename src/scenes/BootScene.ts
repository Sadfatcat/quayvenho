import { loadSave, type LoadSaveResult } from '@save/storage';
import { watchTabLock } from '@save/tabLock';
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

    watchTabLock(() => this.registry.set('secondTabDetected', true));

    const loadResult: LoadSaveResult = loadSave();
    this.registry.set('loadResult', loadResult);

    this.scene.start('Preload');
  }
}
