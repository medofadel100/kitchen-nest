// Measurement formatting utilities

export type DisplayUnit = 'mm' | 'cm' | 'm';

/**
 * Converts a millimeter value to the requested display unit and formats it as a string
 * @param mm Value in millimeters
 * @param displayUnit The target unit to display
 * @param showUnit Whether to append the unit string (e.g. "cm")
 * @returns Formatted string (e.g. "60 cm", "0.6 m")
 */
export const formatMeasurement = (mm: number | undefined, displayUnit: DisplayUnit, showUnit = true): string => {
  if (mm === undefined) return '';
  
  let value: number;
  let unitStr: string;

  switch (displayUnit) {
    case 'm':
      value = mm / 1000;
      unitStr = 'm';
      break;
    case 'cm':
      value = mm / 10;
      unitStr = 'cm';
      break;
    case 'mm':
    default:
      value = mm;
      unitStr = 'mm';
      break;
  }

  // Format to 2 decimal places if needed, but remove trailing zeros
  const formattedValue = Number(value.toFixed(2)).toString();

  return showUnit ? `${formattedValue} ${unitStr}` : formattedValue;
};

/**
 * Parses a user input string back to millimeters
 * Allows user to type "60cm" or "0.6m" and it will convert it correctly.
 * If no unit is specified, assumes the current display unit.
 */
export const parseMeasurement = (input: string, defaultUnit: DisplayUnit): number => {
  const cleanInput = input.trim().toLowerCase();
  
  const numValue = parseFloat(cleanInput);
  if (isNaN(numValue)) return 0;

  if (cleanInput.endsWith('mm')) return numValue;
  if (cleanInput.endsWith('cm')) return numValue * 10;
  if (cleanInput.endsWith('m')) return numValue * 1000;

  return convertDisplayUnitToMm(numValue, defaultUnit);
};

export const convertMmToDisplayUnit = (mm: number, displayUnit: DisplayUnit): number => {
  switch (displayUnit) {
    case 'm': return mm / 1000;
    case 'cm': return mm / 10;
    case 'mm': default: return mm;
  }
};

export const convertDisplayUnitToMm = (val: number, displayUnit: DisplayUnit): number => {
  switch (displayUnit) {
    case 'm': return val * 1000;
    case 'cm': return val * 10;
    case 'mm': default: return val;
  }
};
