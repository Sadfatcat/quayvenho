import type { Mood } from '@domain/models';
import { ProgressBar } from './ProgressBar';
import { COLORS } from './theme';

const MOOD_COLOR: Record<Mood, number> = {
  HAPPY: COLORS.success,
  NEUTRAL: COLORS.warning,
  IMPATIENT: COLORS.danger,
};

/** ProgressBar that colors itself by the customer's domain-computed mood, not a re-derived ratio. */
export class PatienceBar extends ProgressBar {
  setMood(mood: Mood): void {
    this.setFillColor(MOOD_COLOR[mood]);
  }
}
