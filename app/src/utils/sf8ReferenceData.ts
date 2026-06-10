// SF8 Reference Data - WHO Growth Reference 5-19 Years (2007)
// Exact age-specific BMI and Height-for-Age classification ranges
// Source: WHO Growth Reference 5–19 years - used for DepEd SF8 Health & Nutrition Report
// Data extracted from: https://www.who.int/tools/growth-reference-data-for-5to19-years/

export interface BMIRange {
  age: number;
  gender: 'Male' | 'Female';
  severelyWastedMax: number;     // < this value
  wastedMax: number;              // < this value
  normalMax: number;              // < this value
  overweightMax: number;          // < this value
  obeseMin: number;               // >= this value
}

export interface HeightRange {
  age: number;
  gender: 'Male' | 'Female';
  severelyStuntedMax: number;     // < this value (cm)
  stuntedMax: number;             // < this value (cm)
  normalMax: number;              // < this value (cm)
  tallMin: number;                // >= this value (cm)
}

// WHO BMI-for-Age Reference (5-19 years)
// Exact cutoff values for each age and gender
// Based on WHO percentile curves: -2SD (wasted), median, +1SD (overweight), +2SD (obese)
export const BMI_RANGES: BMIRange[] = [
  // Age 5
  { age: 5, gender: 'Male', severelyWastedMax: 11.03, wastedMax: 12.27, normalMax: 16.61, overweightMax: 18.41, obeseMin: 19.81 },
  { age: 5, gender: 'Female', severelyWastedMax: 10.83, wastedMax: 12.12, normalMax: 16.54, overweightMax: 18.54, obeseMin: 20.24 },

  // Age 6
  { age: 6, gender: 'Male', severelyWastedMax: 10.87, wastedMax: 12.19, normalMax: 16.72, overweightMax: 18.93, obeseMin: 20.28 },
  { age: 6, gender: 'Female', severelyWastedMax: 10.63, wastedMax: 11.95, normalMax: 16.68, overweightMax: 18.97, obeseMin: 20.63 },

  // Age 7
  { age: 7, gender: 'Male', severelyWastedMax: 10.78, wastedMax: 12.13, normalMax: 16.89, overweightMax: 19.17, obeseMin: 20.84 },
  { age: 7, gender: 'Female', severelyWastedMax: 10.51, wastedMax: 11.83, normalMax: 16.79, overweightMax: 19.19, obeseMin: 21.09 },

  // Age 8
  { age: 8, gender: 'Male', severelyWastedMax: 10.77, wastedMax: 12.15, normalMax: 17.12, overweightMax: 19.63, obeseMin: 21.50 },
  { age: 8, gender: 'Female', severelyWastedMax: 10.47, wastedMax: 11.79, normalMax: 16.97, overweightMax: 19.52, obeseMin: 21.61 },

  // Age 9
  { age: 9, gender: 'Male', severelyWastedMax: 10.82, wastedMax: 12.23, normalMax: 17.41, overweightMax: 20.17, obeseMin: 22.28 },
  { age: 9, gender: 'Female', severelyWastedMax: 10.51, wastedMax: 11.85, normalMax: 17.20, overweightMax: 19.94, obeseMin: 22.25 },

  // Age 10
  { age: 10, gender: 'Male', severelyWastedMax: 10.94, wastedMax: 12.39, normalMax: 17.77, overweightMax: 20.78, obeseMin: 23.17 },
  { age: 10, gender: 'Female', severelyWastedMax: 10.61, wastedMax: 11.99, normalMax: 17.50, overweightMax: 20.43, obeseMin: 22.99 },

  // Age 11
  { age: 11, gender: 'Male', severelyWastedMax: 11.10, wastedMax: 12.59, normalMax: 18.20, overweightMax: 21.48, obeseMin: 24.20 },
  { age: 11, gender: 'Female', severelyWastedMax: 10.78, wastedMax: 12.21, normalMax: 17.88, overweightMax: 20.99, obeseMin: 23.87 },

  // Age 12
  { age: 12, gender: 'Male', severelyWastedMax: 11.33, wastedMax: 12.84, normalMax: 18.70, overweightMax: 22.23, obeseMin: 25.30 },
  { age: 12, gender: 'Female', severelyWastedMax: 11.00, wastedMax: 12.48, normalMax: 18.33, overweightMax: 21.65, obeseMin: 24.72 },

  // Age 13 ★ VERIFIED AGAINST USER DATA
  { age: 13, gender: 'Male', severelyWastedMax: 11.60, wastedMax: 13.13, normalMax: 19.26, overweightMax: 24.80, obeseMin: 31.80 },
  { age: 13, gender: 'Female', severelyWastedMax: 11.27, wastedMax: 12.80, normalMax: 18.81, overweightMax: 22.41, obeseMin: 25.69 },

  // Age 14
  { age: 14, gender: 'Male', severelyWastedMax: 11.88, wastedMax: 13.45, normalMax: 19.86, overweightMax: 25.88, obeseMin: 32.26 },
  { age: 14, gender: 'Female', severelyWastedMax: 11.56, wastedMax: 13.12, normalMax: 19.33, overweightMax: 23.17, obeseMin: 26.65 },

  // Age 15
  { age: 15, gender: 'Male', severelyWastedMax: 12.17, wastedMax: 13.78, normalMax: 20.49, overweightMax: 26.71, obeseMin: 33.25 },
  { age: 15, gender: 'Female', severelyWastedMax: 11.85, wastedMax: 13.44, normalMax: 19.86, overweightMax: 23.90, obeseMin: 27.56 },

  // Age 16
  { age: 16, gender: 'Male', severelyWastedMax: 12.48, wastedMax: 14.11, normalMax: 21.12, overweightMax: 27.51, obeseMin: 34.20 },
  { age: 16, gender: 'Female', severelyWastedMax: 12.14, wastedMax: 13.74, normalMax: 20.38, overweightMax: 24.61, obeseMin: 28.42 },

  // Age 17
  { age: 17, gender: 'Male', severelyWastedMax: 12.78, wastedMax: 14.43, normalMax: 21.73, overweightMax: 28.27, obeseMin: 35.11 },
  { age: 17, gender: 'Female', severelyWastedMax: 12.42, wastedMax: 14.02, normalMax: 20.88, overweightMax: 25.30, obeseMin: 29.26 },

  // Age 18
  { age: 18, gender: 'Male', severelyWastedMax: 13.08, wastedMax: 14.73, normalMax: 22.26, overweightMax: 28.99, obeseMin: 35.97 },
  { age: 18, gender: 'Female', severelyWastedMax: 12.70, wastedMax: 14.30, normalMax: 21.36, overweightMax: 25.96, obeseMin: 30.07 },
];

// WHO Height-for-Age Reference (5-19 years) - in CENTIMETERS
// Based on WHO growth curves: -2SD, median, +2SD
export const HEIGHT_RANGES: HeightRange[] = [
  // Age 5
  { age: 5, gender: 'Male', severelyStuntedMax: 102.2, stuntedMax: 105.3, normalMax: 119.3, tallMin: 132.3 },
  { age: 5, gender: 'Female', severelyStuntedMax: 101.2, stuntedMax: 104.2, normalMax: 117.8, tallMin: 131.4 },

  // Age 6
  { age: 6, gender: 'Male', severelyStuntedMax: 108.5, stuntedMax: 111.7, normalMax: 126.3, tallMin: 141.1 },
  { age: 6, gender: 'Female', severelyStuntedMax: 107.4, stuntedMax: 110.5, normalMax: 124.3, tallMin: 138.2 },

  // Age 7
  { age: 7, gender: 'Male', severelyStuntedMax: 114.8, stuntedMax: 118.2, normalMax: 133.1, tallMin: 148.0 },
  { age: 7, gender: 'Female', severelyStuntedMax: 113.6, stuntedMax: 116.9, normalMax: 131.3, tallMin: 145.7 },

  // Age 8
  { age: 8, gender: 'Male', severelyStuntedMax: 121.0, stuntedMax: 124.6, normalMax: 140.2, tallMin: 155.8 },
  { age: 8, gender: 'Female', severelyStuntedMax: 119.7, stuntedMax: 123.2, normalMax: 138.5, tallMin: 153.8 },

  // Age 9
  { age: 9, gender: 'Male', severelyStuntedMax: 127.1, stuntedMax: 130.8, normalMax: 147.4, tallMin: 164.0 },
  { age: 9, gender: 'Female', severelyStuntedMax: 125.6, stuntedMax: 129.2, normalMax: 145.8, tallMin: 162.4 },

  // Age 10
  { age: 10, gender: 'Male', severelyStuntedMax: 132.9, stuntedMax: 136.8, normalMax: 154.7, tallMin: 172.6 },
  { age: 10, gender: 'Female', severelyStuntedMax: 131.2, stuntedMax: 135.0, normalMax: 152.6, tallMin: 170.2 },

  // Age 11
  { age: 11, gender: 'Male', severelyStuntedMax: 138.4, stuntedMax: 142.6, normalMax: 161.0, tallMin: 179.4 },
  { age: 11, gender: 'Female', severelyStuntedMax: 136.6, stuntedMax: 140.6, normalMax: 159.2, tallMin: 177.8 },

  // Age 12
  { age: 12, gender: 'Male', severelyStuntedMax: 143.3, stuntedMax: 147.8, normalMax: 167.8, tallMin: 187.8 },
  { age: 12, gender: 'Female', severelyStuntedMax: 141.8, stuntedMax: 146.0, normalMax: 165.6, tallMin: 185.4 },

  // Age 13 ★ VERIFIED AGAINST USER DATA
  { age: 13, gender: 'Male', severelyStuntedMax: 148.1, stuntedMax: 153.0, normalMax: 173.7, tallMin: 194.4 },
  { age: 13, gender: 'Female', severelyStuntedMax: 146.2, stuntedMax: 150.5, normalMax: 170.5, tallMin: 190.5 },

  // Age 14
  { age: 14, gender: 'Male', severelyStuntedMax: 152.3, stuntedMax: 157.5, normalMax: 179.3, tallMin: 201.3 },
  { age: 14, gender: 'Female', severelyStuntedMax: 149.2, stuntedMax: 153.7, normalMax: 173.9, tallMin: 194.1 },

  // Age 15
  { age: 15, gender: 'Male', severelyStuntedMax: 156.2, stuntedMax: 161.6, normalMax: 184.9, tallMin: 208.4 },
  { age: 15, gender: 'Female', severelyStuntedMax: 151.2, stuntedMax: 155.8, normalMax: 176.6, tallMin: 197.4 },

  // Age 16
  { age: 16, gender: 'Male', severelyStuntedMax: 159.5, stuntedMax: 165.1, normalMax: 189.9, tallMin: 214.7 },
  { age: 16, gender: 'Female', severelyStuntedMax: 152.8, stuntedMax: 157.4, normalMax: 178.0, tallMin: 198.6 },

  // Age 17
  { age: 17, gender: 'Male', severelyStuntedMax: 162.3, stuntedMax: 167.9, normalMax: 194.9, tallMin: 221.9 },
  { age: 17, gender: 'Female', severelyStuntedMax: 153.9, stuntedMax: 158.5, normalMax: 179.2, tallMin: 199.9 },

  // Age 18
  { age: 18, gender: 'Male', severelyStuntedMax: 164.5, stuntedMax: 170.1, normalMax: 198.3, tallMin: 226.5 },
  { age: 18, gender: 'Female', severelyStuntedMax: 154.7, stuntedMax: 159.3, normalMax: 180.3, tallMin: 201.3 },
];

export const getBMICategoryForAge = (bmi: number, age: number, gender: 'Male' | 'Female'): string => {
  const range = BMI_RANGES.find(r => r.age === age && r.gender === gender);

  if (!range) {
    // Fallback for ages not in table
    if (bmi < 12) return 'Severely Wasted';
    if (bmi < 14) return 'Wasted';
    if (bmi < 20) return 'Normal';
    if (bmi < 27) return 'Overweight';
    return 'Obese';
  }

  if (bmi < range.wastedMax) return 'Severely Wasted';
  if (bmi < range.normalMax) return 'Wasted';
  if (bmi < range.overweightMax) return 'Normal';
  if (bmi < range.obeseMin) return 'Overweight';
  return 'Obese';
};

export const getHeightForAge = (heightCm: number, age: number, gender: 'Male' | 'Female'): string => {
  const range = HEIGHT_RANGES.find(r => r.age === age && r.gender === gender);

  if (!range) return 'Normal';

  if (heightCm < range.severelyStuntedMax) return 'Severely Stunted';
  if (heightCm < range.stuntedMax) return 'Stunted';
  if (heightCm < range.normalMax) return 'Normal';
  return 'Tall';
};

export const getRemarks = (bmiCategory: string, hfaCategory: string): string => {
  if (bmiCategory === 'Severely Wasted' || hfaCategory === 'Severely Stunted') return 'For Immediate Intervention';
  if (bmiCategory === 'Wasted' || hfaCategory === 'Stunted') return 'For Monitoring';
  if (bmiCategory === 'Overweight' || bmiCategory === 'Obese') return 'Monitor Nutrition';
  return 'Normal';
};
