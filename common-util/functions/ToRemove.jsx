import dayjs from 'dayjs';
import { isNil } from 'lodash';

import { NA } from 'common-util/constants';

// TODO move to autonolas-frontend-library

/**
 * Converts a number to a comma separated format
 * @param {Number} x
 * @returns {String} eg: 1000000 => 1,000,000, 12345.67 => 12,345.67
 */
export const getCommaSeparatedNumber = (x, maxFraction = 2) => {
  if (isNil(x) || Number(x) === 0) return '0.0';

  return new Intl.NumberFormat('en', {
    maximumFractionDigits: maxFraction,
  }).format(x);
};

/**
 * Get formatted date from milliseconds
 * example, 1678320000000 => Mar 09 '23
 */
export const getFormattedDate = (ms) => {
  if (!ms) return NA;
  return dayjs(ms).format("MMM DD 'YY");
};

/**
 * Get formatted date from milliseconds including time
 * example, 1678320000000 => Mar 09 '2023 16:00
 */
export const getFullFormattedDate = (ms) => {
  if (!ms) return NA;
  return dayjs(ms).format("MMM DD 'YYYY, HH:mm");
};
