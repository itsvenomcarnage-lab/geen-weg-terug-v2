export type FontFamilyOption = 'serif' | 'sans-serif';

export interface ReadingSettings {
  fontSize: number;
  lineSpacing: number;
  fontFamily: FontFamilyOption;
  brightness: number;
}

export const DEFAULT_READING_SETTINGS: ReadingSettings = {
  fontSize: 18,
  lineSpacing: 1.6,
  fontFamily: 'serif',
  brightness: 1,
};
