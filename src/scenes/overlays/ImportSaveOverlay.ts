import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { applyImportedSave } from '@platform/saveTransfer';
import { importSaveCode } from '@save/exportImport';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { Panel } from '@ui/Panel';
import { TextInput } from '@ui/TextInput';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, SPACING, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { DialogOverlay } from './DialogOverlay';

const PANEL_WIDTH = 600;
const PANEL_HEIGHT = 600;
const INPUT_WIDTH = PANEL_WIDTH - 80;
const SAVE_CODE_MAX_LENGTH = 200_000;
const BUTTON_HEIGHT = 76;
const MESSAGE_STYLE = { fontFamily: FONT_FAMILY, fontSize: '26px', align: 'center', wordWrap: { width: INPUT_WIDTH } };

/** Modal nhập mã save: dán mã vào ô, lỗi hiện ngay trong modal; mã hợp lệ thì hỏi xác nhận ghi đè rồi tải lại trang. */
export class ImportSaveOverlay extends BaseOverlay {
  private readonly codeInput: TextInput;
  private readonly errorText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, { closeOnBackdropTap: false });
    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: PANEL_HEIGHT });
    const title = scene.add.text(0, -250, STRINGS.settings.importCode, TEXT_STYLES.heading).setOrigin(0.5);
    const hint = scene.add
      .text(0, -190, STRINGS.settings.importPrompt, { ...MESSAGE_STYLE, color: toCssColor(COLORS.textMuted) })
      .setOrigin(0.5, 0);
    this.errorText = scene.add.text(0, 30, '', { ...MESSAGE_STYLE, color: toCssColor(COLORS.danger) }).setOrigin(0.5, 0);
    this.codeInput = new TextInput(scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 - 40,
      width: INPUT_WIDTH,
      maxLength: SAVE_CODE_MAX_LENGTH,
      placeholder: STRINGS.settings.importPlaceholder,
      onChange: () => this.errorText.setText(''),
    });
    const submitButton = new Button(scene, 0, 150, {
      width: INPUT_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.settings.importSubmit,
      variant: 'primary',
      onTap: () => this.submit(),
    });
    const cancelButton = new Button(scene, 0, 150 + BUTTON_HEIGHT + SPACING.sm, {
      width: INPUT_WIDTH,
      height: BUTTON_HEIGHT,
      label: STRINGS.settings.importCancel,
      variant: 'ghost',
      onTap: () => this.close(),
    });
    panel.add([title, hint, this.errorText, submitButton, cancelButton]);
    this.add(panel);
  }

  private submit(): void {
    const result = importSaveCode(this.codeInput.value);
    if (!result.ok) {
      this.errorText.setText(result.reason === 'FUTURE_VERSION' ? STRINGS.settings.importFutureVersion : STRINGS.settings.importFailed);
      return;
    }
    const hostScene = this.scene;
    const importedState = result.value;
    this.close();
    new DialogOverlay(hostScene, {
      title: STRINGS.settings.importConfirmTitle,
      message: STRINGS.settings.importConfirm,
      buttons: [
        { label: STRINGS.settings.importCancel, variant: 'ghost', onTap: () => {} },
        { label: STRINGS.settings.importConfirmYes, variant: 'danger', onTap: () => applyImportedSave(importedState) },
      ],
    });
  }

  /** Ô nhập là phần tử DOM nằm ngoài canvas nên phải huỷ cùng modal. */
  override close(): void {
    this.codeInput.destroy();
    super.close();
  }
}
