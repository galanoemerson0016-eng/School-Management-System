// SF8 Reference Data - WHO Growth Reference for School-Aged Children and Adolescents (5-19 Years), 2007
// Exact age-specific BMI-for-Age and Height-for-Age classification cutoffs
// Source: WHO 2007 LMS reference tables (bfawho2007 / hfawho2007), used for DepEd SF8 Health & Nutrition Report
// https://www.who.int/tools/growth-reference-data-for-5to19-years/

export interface BMIRange {
  age: number;
  gender: 'Male' | 'Female';
  wastedMax: number;              // < this value => Severely Wasted (WHO -3SD)
  normalMax: number;              // < this value => Wasted (WHO -2SD)
  overweightMax: number;          // < this value => Normal (WHO +1SD)
  obeseMin: number;                // >= this value => Obese (WHO +2SD); below => Overweight
}

export interface HeightRange {
  age: number;
  gender: 'Male' | 'Female';
  severelyStuntedMax: number;     // < this value (cm) -- WHO -3SD
  stuntedMax: number;             // < this value (cm) -- WHO -2SD
  normalMax: number;              // < this value (cm) -- WHO +2SD (Tall boundary)
  tallMin: number;                // >= this value (cm)
}

// WHO BMI-for-Age Reference (5-18 years)
// Cutoffs derived from the WHO 2007 LMS parameters: -3SD, -2SD, +1SD, +2SD
export const BMI_RANGES: BMIRange[] = [
  // Age 5
  { age: 5, gender: 'Male', wastedMax: 12.12, normalMax: 13.04, overweightMax: 16.64, obeseMin: 18.25 },
  { age: 5, gender: 'Female', wastedMax: 11.78, normalMax: 12.76, overweightMax: 16.86, obeseMin: 18.83 },

  // Age 6
  { age: 6, gender: 'Male', wastedMax: 12.14, normalMax: 13.04, overweightMax: 16.76, obeseMin: 18.52 },
  { age: 6, gender: 'Female', wastedMax: 11.72, normalMax: 12.70, overweightMax: 17.01, obeseMin: 19.22 },

  // Age 7
  { age: 7, gender: 'Male', wastedMax: 12.25, normalMax: 13.15, overweightMax: 17.05, obeseMin: 19.02 },
  { age: 7, gender: 'Female', wastedMax: 11.75, normalMax: 12.73, overweightMax: 17.29, obeseMin: 19.79 },

  // Age 8
  { age: 8, gender: 'Male', wastedMax: 12.39, normalMax: 13.30, overweightMax: 17.44, obeseMin: 19.67 },
  { age: 8, gender: 'Female', wastedMax: 11.88, normalMax: 12.88, overweightMax: 17.73, obeseMin: 20.56 },

  // Age 9
  { age: 9, gender: 'Male', wastedMax: 12.56, normalMax: 13.49, overweightMax: 17.91, obeseMin: 20.47 },
  { age: 9, gender: 'Female', wastedMax: 12.10, normalMax: 13.14, overweightMax: 18.33, obeseMin: 21.51 },

  // Age 10
  { age: 10, gender: 'Male', wastedMax: 12.78, normalMax: 13.74, overweightMax: 18.48, obeseMin: 21.40 },
  { age: 10, gender: 'Female', wastedMax: 12.38, normalMax: 13.47, overweightMax: 19.03, obeseMin: 22.57 },

  // Age 11
  { age: 11, gender: 'Male', wastedMax: 13.05, normalMax: 14.06, overweightMax: 19.16, obeseMin: 22.45 },
  { age: 11, gender: 'Female', wastedMax: 12.73, normalMax: 13.89, overweightMax: 19.86, obeseMin: 23.72 },

  // Age 12
  { age: 12, gender: 'Male', wastedMax: 13.39, normalMax: 14.45, overweightMax: 19.95, obeseMin: 23.58 },
  { age: 12, gender: 'Female', wastedMax: 13.15, normalMax: 14.39, overweightMax: 20.81, obeseMin: 24.97 },

  // Age 13
  { age: 13, gender: 'Male', wastedMax: 13.80, normalMax: 14.93, overweightMax: 20.83, obeseMin: 24.76 },
  { age: 13, gender: 'Female', wastedMax: 13.61, normalMax: 14.94, overweightMax: 21.80, obeseMin: 26.21 },

  // Age 14
  { age: 14, gender: 'Male', wastedMax: 14.26, normalMax: 15.48, overweightMax: 21.77, obeseMin: 25.92 },
  { age: 14, gender: 'Female', wastedMax: 14.03, normalMax: 15.45, overweightMax: 22.73, obeseMin: 27.32 },

  // Age 15
  { age: 15, gender: 'Male', wastedMax: 14.71, normalMax: 16.01, overweightMax: 22.68, obeseMin: 26.97 },
  { age: 15, gender: 'Female', wastedMax: 14.36, normalMax: 15.87, overweightMax: 23.51, obeseMin: 28.22 },

  // Age 16
  { age: 16, gender: 'Male', wastedMax: 15.11, normalMax: 16.50, overweightMax: 23.53, obeseMin: 27.87 },
  { age: 16, gender: 'Female', wastedMax: 14.59, normalMax: 16.17, overweightMax: 24.10, obeseMin: 28.87 },

  // Age 17
  { age: 17, gender: 'Male', wastedMax: 15.44, normalMax: 16.93, overweightMax: 24.27, obeseMin: 28.63 },
  { age: 17, gender: 'Female', wastedMax: 14.70, normalMax: 16.35, overweightMax: 24.50, obeseMin: 29.28 },

  // Age 18
  { age: 18, gender: 'Male', wastedMax: 15.69, normalMax: 17.28, overweightMax: 24.91, obeseMin: 29.24 },
  { age: 18, gender: 'Female', wastedMax: 14.73, normalMax: 16.45, overweightMax: 24.77, obeseMin: 29.52 },
];

// WHO Height-for-Age Reference (5-18 years) - in CENTIMETERS
// Cutoffs derived from the WHO 2007 LMS parameters: -3SD, -2SD, +2SD
export const HEIGHT_RANGES: HeightRange[] = [
  // Age 5
  { age: 5, gender: 'Male', severelyStuntedMax: 96.0, stuntedMax: 100.6, normalMax: 118.8, tallMin: 118.8 },
  { age: 5, gender: 'Female', severelyStuntedMax: 94.9, stuntedMax: 99.6, normalMax: 118.6, tallMin: 118.6 },

  // Age 6
  { age: 6, gender: 'Male', severelyStuntedMax: 101.2, stuntedMax: 106.1, normalMax: 125.8, tallMin: 125.8 },
  { age: 6, gender: 'Female', severelyStuntedMax: 99.8, stuntedMax: 104.9, normalMax: 125.4, tallMin: 125.4 },

  // Age 7
  { age: 7, gender: 'Male', severelyStuntedMax: 105.9, stuntedMax: 111.2, normalMax: 132.3, tallMin: 132.3 },
  { age: 7, gender: 'Female', severelyStuntedMax: 104.4, stuntedMax: 109.9, normalMax: 131.7, tallMin: 131.7 },

  // Age 8
  { age: 8, gender: 'Male', severelyStuntedMax: 110.3, stuntedMax: 116.0, normalMax: 138.6, tallMin: 138.6 },
  { age: 8, gender: 'Female', severelyStuntedMax: 109.2, stuntedMax: 115.0, normalMax: 138.2, tallMin: 138.2 },

  // Age 9
  { age: 9, gender: 'Male', severelyStuntedMax: 114.5, stuntedMax: 120.5, normalMax: 144.6, tallMin: 144.6 },
  { age: 9, gender: 'Female', severelyStuntedMax: 114.2, stuntedMax: 120.3, normalMax: 144.7, tallMin: 144.7 },

  // Age 10
  { age: 10, gender: 'Male', severelyStuntedMax: 118.7, stuntedMax: 125.0, normalMax: 150.5, tallMin: 150.5 },
  { age: 10, gender: 'Female', severelyStuntedMax: 119.4, stuntedMax: 125.8, normalMax: 151.4, tallMin: 151.4 },

  // Age 11
  { age: 11, gender: 'Male', severelyStuntedMax: 122.9, stuntedMax: 129.7, normalMax: 156.6, tallMin: 156.6 },
  { age: 11, gender: 'Female', severelyStuntedMax: 125.1, stuntedMax: 131.7, normalMax: 158.3, tallMin: 158.3 },

  // Age 12
  { age: 12, gender: 'Male', severelyStuntedMax: 127.8, stuntedMax: 134.9, normalMax: 163.3, tallMin: 163.3 },
  { age: 12, gender: 'Female', severelyStuntedMax: 130.7, stuntedMax: 137.6, normalMax: 164.9, tallMin: 164.9 },

  // Age 13
  { age: 13, gender: 'Male', severelyStuntedMax: 133.8, stuntedMax: 141.2, normalMax: 170.9, tallMin: 170.9 },
  { age: 13, gender: 'Female', severelyStuntedMax: 135.6, stuntedMax: 142.5, normalMax: 170.3, tallMin: 170.3 },

  // Age 14
  { age: 14, gender: 'Male', severelyStuntedMax: 140.1, stuntedMax: 147.8, normalMax: 178.6, tallMin: 178.6 },
  { age: 14, gender: 'Female', severelyStuntedMax: 139.0, stuntedMax: 145.9, normalMax: 173.7, tallMin: 173.7 },

  // Age 15
  { age: 15, gender: 'Male', severelyStuntedMax: 145.5, stuntedMax: 153.3, normalMax: 184.6, tallMin: 184.6 },
  { age: 15, gender: 'Female', severelyStuntedMax: 141.0, stuntedMax: 147.9, normalMax: 175.4, tallMin: 175.4 },

  // Age 16
  { age: 16, gender: 'Male', severelyStuntedMax: 149.6, stuntedMax: 157.4, normalMax: 188.4, tallMin: 188.4 },
  { age: 16, gender: 'Female', severelyStuntedMax: 142.2, stuntedMax: 148.9, normalMax: 176.1, tallMin: 176.1 },

  // Age 17
  { age: 17, gender: 'Male', severelyStuntedMax: 152.2, stuntedMax: 159.9, normalMax: 190.4, tallMin: 190.4 },
  { age: 17, gender: 'Female', severelyStuntedMax: 142.8, stuntedMax: 149.5, normalMax: 176.2, tallMin: 176.2 },

  // Age 18
  { age: 18, gender: 'Male', severelyStuntedMax: 153.7, stuntedMax: 161.2, normalMax: 191.1, tallMin: 191.1 },
  { age: 18, gender: 'Female', severelyStuntedMax: 143.2, stuntedMax: 149.8, normalMax: 176.3, tallMin: 176.3 },
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
