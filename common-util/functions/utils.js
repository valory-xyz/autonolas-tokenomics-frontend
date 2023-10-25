import { PROHIBITED_COUNTRIES } from '@autonolas/frontend-library';

/**
 * - unitIds and unitTypes are arrays of same length
 * - unitIds has to be unique
 */
export const sortUnitIdsAndTypes = (unitIds, unitTypes) => {
  const sortedUnitIds = [...unitIds].sort((a, b) => a - b);
  const sortedUnitTypes = sortedUnitIds.map((e) => unitTypes[unitIds.indexOf(e)]);
  return [sortedUnitIds, sortedUnitTypes];
};

export const isCountryProhibited = (country) => PROHIBITED_COUNTRIES.includes(country);

export const PROHIBITED_COUNTRIES_LIST = { ...PROHIBITED_COUNTRIES };
