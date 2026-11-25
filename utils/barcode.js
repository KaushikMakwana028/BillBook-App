/**
 * Pure JavaScript Code 128B Barcode Encoder
 * Generates standard-compliant Code 128 bar/space module sequences
 * with zero external dependencies for crisp rendering in React Native.
 */

// Code 128 pattern table (indices 0..106): each string has 6 digits representing
// alternating bar and space module widths (sum = 11 modules; Stop = 13 modules).
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131',
  '211412', // 103: Start A
  '211214', // 104: Start B
  '211232', // 105: Start C
  '2331112', // 106: Stop (13 modules)
];

const START_B = 104;
const STOP_CODE = 106;

/**
 * Encodes an ASCII string into an array of { isBar: boolean, width: number } segments
 * using Code 128B.
 * @param {string|number} rawValue
 * @returns {{ segments: Array<{isBar: boolean, width: number}>, totalModules: number, text: string }}
 */
export function encodeCode128B(rawValue) {
  const text = String(rawValue ?? '').trim();
  if (!text) {
    return { segments: [], totalModules: 0, text: '' };
  }

  const codes = [START_B];
  let checksum = START_B;

  for (let i = 0; i < text.length; i += 1) {
    const charCode = text.charCodeAt(i);
    // Code 128B supports ASCII 32..126; map out-of-range safely to space/fallback
    const codeValue = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(codeValue);
    checksum += codeValue * (i + 1);
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);
  codes.push(STOP_CODE);

  const segments = [];
  let totalModules = 0;

  codes.forEach((code) => {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    for (let j = 0; j < pattern.length; j += 1) {
      const width = parseInt(pattern[j], 10);
      const isBar = j % 2 === 0;
      segments.push({ isBar, width });
      totalModules += width;
    }
  });

  return { segments, totalModules, text };
}

export default encodeCode128B;
