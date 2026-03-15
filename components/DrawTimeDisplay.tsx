"use client";

import { useTranslationsFromPath } from '@/i18n/translation-context';
import { useDrawTime } from '@/hooks/useDrawTime';

export default function DrawTimeDisplay() {
  const { t } = useTranslationsFromPath();
  const drawTime = useDrawTime();

  if (!drawTime) {
    return <span>{t('common.loading')}...</span>;
  }

  return t('winning_numbers.daily_draws', { time: drawTime || '22:00' });
}

