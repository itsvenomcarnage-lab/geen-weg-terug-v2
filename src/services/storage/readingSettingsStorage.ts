import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_READING_SETTINGS,
  ReadingSettings,
} from '@/types/readingSettings';

const STORAGE_KEY = '@geen-weg-terug/reading-settings';

export async function getReadingSettings(): Promise<ReadingSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_READING_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<ReadingSettings>;

    return {
      ...DEFAULT_READING_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_READING_SETTINGS;
  }
}

export async function saveReadingSettings(
  settings: ReadingSettings,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function updateReadingSettings(
  partial: Partial<ReadingSettings>,
): Promise<ReadingSettings> {
  const current = await getReadingSettings();
  const next = { ...current, ...partial };

  await saveReadingSettings(next);

  return next;
}

export async function clearReadingSettings(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
