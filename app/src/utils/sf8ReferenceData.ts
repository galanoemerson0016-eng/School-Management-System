// SF8 Reference Data - Age and Gender-specific BMI and Height Standards
// Based on DepEd Health and Nutrition Assessment Standards

export interface BMICategory {
  age: number;
  gender: 'Male' | 'Female';
  severelyWasted: number; // BMI < this
  wasted: number; // BMI < this
  normal: number; // BMI < this
  overweight: number; // BMI < this
  obese: number; // BMI >= this
}

export interface HeightStandard {
  age: number;
  gender: 'Male' | 'Female';
  heightMedian: number; // in cm
}

// Age and Gender-specific BMI Categories (cutoff points)
// Based on CDC/WHO growth charts adapted for Philippine population
export const BMI_CATEGORIES: BMICategory[] = [
  // Age 5
  { age: 5, gender: 'Male', severelyWasted: 12.0, wasted: 13.7, normal: 16.5, overweight: 18.4, obese: 20.5 },
  { age: 5, gender: 'Female', severelyWasted: 12.0, wasted: 13.5, normal: 16.8, overweight: 18.9, obese: 20.9 },
  // Age 6
  { age: 6, gender: 'Male', severelyWasted: 12.0, wasted: 13.5, normal: 16.9, overweight: 19.3, obese: 21.2 },
  { age: 6, gender: 'Female', severelyWasted: 12.0, wasted: 13.2, normal: 17.2, overweight: 19.8, obese: 21.6 },
  // Age 7
  { age: 7, gender: 'Male', severelyWasted: 12.0, wasted: 13.4, normal: 17.4, overweight: 20.1, obese: 21.8 },
  { age: 7, gender: 'Female', severelyWasted: 12.0, wasted: 13.0, normal: 17.7, overweight: 20.6, obese: 22.3 },
  // Age 8
  { age: 8, gender: 'Male', severelyWasted: 12.0, wasted: 13.4, normal: 17.9, overweight: 21.0, obese: 22.5 },
  { age: 8, gender: 'Female', severelyWasted: 12.0, wasted: 12.9, normal: 18.3, overweight: 21.5, obese: 23.2 },
  // Age 9
  { age: 9, gender: 'Male', severelyWasted: 12.0, wasted: 13.5, normal: 18.5, overweight: 22.0, obese: 23.6 },
  { age: 9, gender: 'Female', severelyWasted: 12.0, wasted: 13.0, normal: 19.0, overweight: 22.6, obese: 24.3 },
  // Age 10
  { age: 10, gender: 'Male', severelyWasted: 12.0, wasted: 13.8, normal: 19.2, overweight: 23.0, obese: 24.6 },
  { age: 10, gender: 'Female', severelyWasted: 12.0, wasted: 13.2, normal: 19.8, overweight: 23.6, obese: 25.3 },
  // Age 11
  { age: 11, gender: 'Male', severelyWasted: 12.0, wasted: 14.2, normal: 20.0, overweight: 24.1, obese: 25.7 },
  { age: 11, gender: 'Female', severelyWasted: 12.0, wasted: 13.5, normal: 20.7, overweight: 24.8, obese: 26.5 },
  // Age 12
  { age: 12, gender: 'Male', severelyWasted: 12.0, wasted: 14.7, normal: 20.9, overweight: 25.2, obese: 26.8 },
  { age: 12, gender: 'Female', severelyWasted: 12.0, wasted: 14.0, normal: 21.7, overweight: 26.0, obese: 27.8 },
  // Age 13
  { age: 13, gender: 'Male', severelyWasted: 12.5, wasted: 15.2, normal: 21.8, overweight: 26.2, obese: 27.9 },
  { age: 13, gender: 'Female', severelyWasted: 12.5, wasted: 14.5, normal: 22.6, overweight: 27.2, obese: 28.9 },
  // Age 14
  { age: 14, gender: 'Male', severelyWasted: 13.0, wasted: 15.7, normal: 22.8, overweight: 27.2, obese: 28.9 },
  { age: 14, gender: 'Female', severelyWasted: 13.0, wasted: 15.0, normal: 23.5, overweight: 28.2, obese: 30.0 },
  // Age 15
  { age: 15, gender: 'Male', severelyWasted: 13.0, wasted: 16.2, normal: 23.8, overweight: 28.2, obese: 29.9 },
  { age: 15, gender: 'Female', severelyWasted: 13.0, wasted: 15.4, normal: 24.3, overweight: 29.1, obese: 31.0 },
  // Age 16-18
  { age: 16, gender: 'Male', severelyWasted: 13.0, wasted: 16.5, normal: 24.7, overweight: 29.2, obese: 31.0 },
  { age: 16, gender: 'Female', severelyWasted: 13.0, wasted: 15.7, normal: 25.0, overweight: 29.9, obese: 31.9 },
  { age: 17, gender: 'Male', severelyWasted: 13.0, wasted: 16.8, normal: 25.5, overweight: 30.1, obese: 32.0 },
  { age: 17, gender: 'Female', severelyWasted: 13.0, wasted: 16.0, normal: 25.7, overweight: 30.6, obese: 32.6 },
  { age: 18, gender: 'Male', severelyWasted: 13.0, wasted: 17.0, normal: 25.8, overweight: 30.5, obese: 32.5 },
  { age: 18, gender: 'Female', severelyWasted: 13.0, wasted: 16.2, normal: 26.0, overweight: 31.0, obese: 33.0 },
];

// Height Standards by Age and Gender (median height in cm)
export const HEIGHT_STANDARDS: HeightStandard[] = [
  { age: 5, gender: 'Male', heightMedian: 108.8 },
  { age: 5, gender: 'Female', heightMedian: 107.8 },
  { age: 6, gender: 'Male', heightMedian: 115.1 },
  { age: 6, gender: 'Female', heightMedian: 114.2 },
  { age: 7, gender: 'Male', heightMedian: 121.7 },
  { age: 7, gender: 'Female', heightMedian: 120.8 },
  { age: 8, gender: 'Male', heightMedian: 127.9 },
  { age: 8, gender: 'Female', heightMedian: 127.0 },
  { age: 9, gender: 'Male', heightMedian: 133.6 },
  { age: 9, gender: 'Female', heightMedian: 132.8 },
  { age: 10, gender: 'Male', heightMedian: 139.1 },
  { age: 10, gender: 'Female', heightMedian: 138.4 },
  { age: 11, gender: 'Male', heightMedian: 144.4 },
  { age: 11, gender: 'Female', heightMedian: 144.0 },
  { age: 12, gender: 'Male', heightMedian: 150.0 },
  { age: 12, gender: 'Female', heightMedian: 150.5 },
  { age: 13, gender: 'Male', heightMedian: 155.8 },
  { age: 13, gender: 'Female', heightMedian: 155.4 },
  { age: 14, gender: 'Male', heightMedian: 161.4 },
  { age: 14, gender: 'Female', heightMedian: 157.8 },
  { age: 15, gender: 'Male', heightMedian: 166.5 },
  { age: 15, gender: 'Female', heightMedian: 159.2 },
  { age: 16, gender: 'Male', heightMedian: 170.5 },
  { age: 16, gender: 'Female', heightMedian: 160.1 },
  { age: 17, gender: 'Male', heightMedian: 173.0 },
  { age: 17, gender: 'Female', heightMedian: 160.5 },
  { age: 18, gender: 'Male', heightMedian: 174.5 },
  { age: 18, gender: 'Female', heightMedian: 160.8 },
];

export const getBMICategoryForAge = (bmi: number, age: number, gender: 'Male' | 'Female'): string => {
  const standard = BMI_CATEGORIES.find(b => b.age === age && b.gender === gender);
  if (!standard) {
    // Fallback for ages not in the table
    if (bmi < 13) return 'Severely Wasted';
    if (bmi < 15) return 'Wasted';
    if (bmi < 20) return 'Normal';
    if (bmi < 25) return 'Overweight';
    return 'Obese';
  }

  if (bmi < standard.severelyWasted) return 'Severely Wasted';
  if (bmi < standard.wasted) return 'Wasted';
  if (bmi < standard.normal) return 'Normal';
  if (bmi < standard.overweight) return 'Overweight';
  return 'Obese';
};

export const getHeightForAge = (heightCm: number, age: number, gender: 'Male' | 'Female'): string => {
  const standard = HEIGHT_STANDARDS.find(h => h.age === age && h.gender === gender);
  if (!standard) return 'Normal';

  const medianHeight = standard.heightMedian;
  const percentageOfMedian = (heightCm / medianHeight) * 100;

  if (percentageOfMedian >= 95) return 'Normal';
  if (percentageOfMedian >= 90) return 'Moderately Stunted';
  if (percentageOfMedian >= 80) return 'Stunted';
  return 'Severely Stunted';
};

export const getRemarks = (bmiCategory: string, hfa: string): string => {
  if (bmiCategory === 'Severely Wasted' || hfa === 'Severely Stunted') return 'For Immediate Intervention';
  if (bmiCategory === 'Wasted' || hfa === 'Moderately Stunted' || hfa === 'Stunted') return 'For Monitoring';
  if (bmiCategory === 'Overweight' || bmiCategory === 'Obese') return 'Monitor Nutrition';
  return 'Normal';
};
