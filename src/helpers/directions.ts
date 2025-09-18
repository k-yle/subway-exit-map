import { t } from '../i18n';
import type { Direction } from '../types.def';

export const DIRECTIONS: Record<Direction, string> = {
  north: t('directions.north'),
  south: t('directions.south'),
  west: t('directions.west'),
  east: t('directions.east'),
  clockwise: t('directions.clockwise'),
  anticlockwise: t('directions.anticlockwise'),
};

/**
 * there's no intuitive icons for compass directions,
 * and those are less important anyway. So we only show
 * an icon for circular routes.
 */
export const DIRECTION_ICONS: Record<Direction, string> = {
  north: '',
  south: '',
  west: '',
  east: '',
  clockwise: '↻',
  anticlockwise: '↺',
};
