import { isStorageAvailable, loadSave, requestPersistentStorage, type LoadSaveResult } from '@save/storage';
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

    this.registry.set('storageUnavailable', !isStorageAvailable());
    requestPersistentStorage();

    const loadResult: LoadSaveResult = loadSave();
    this.registry.set('loadResult', loadResult);

    this.scene.start('Preload');
  }
}
