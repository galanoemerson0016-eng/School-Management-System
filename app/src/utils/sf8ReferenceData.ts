// SF8 Reference Data - Age-based Height and Weight Standards
// Based on WHO/DepEd standards for nutritional assessment

export interface HeightWeightStandard {
  ageMonths: number;
  ageYears?: string;
  heightMin: number;
  heightMedian: number;
  heightMax: number;
  weightMin: number;
  weightMedian: number;
  weightMax: number;
}

export interface BMIStandard {
  ageYears: string;
  gender: 'Male' | 'Female';
  underweight: number; // BMI < this value
  normal: number; // BMI < this value
  overweight: number; // BMI < this value
  obese: number; // BMI >= this value
}

// Male Height and Weight Standards by Age (months)
export const MALE_STANDARDS: HeightWeightStandard[] = [
  { ageMonths: 6, ageYears: '0.5', heightMin: 0.62, heightMedian: 0.68, heightMax: 0.74, weightMin: 5.0, weightMedian: 7.3, weightMax: 9.6 },
  { ageMonths: 12, ageYears: '1', heightMin: 0.70, heightMedian: 0.77, heightMax: 0.84, weightMin: 7.0, weightMedian: 9.6, weightMax: 12.2 },
  { ageMonths: 24, ageYears: '2', heightMin: 0.80, heightMedian: 0.89, heightMax: 0.98, weightMin: 10.0, weightMedian: 13.5, weightMax: 17.0 },
  { ageMonths: 36, ageYears: '3', heightMin: 0.88, heightMedian: 0.98, heightMax: 1.08, weightMin: 11.5, weightMedian: 15.8, weightMax: 20.1 },
  { ageMonths: 48, ageYears: '4', heightMin: 0.96, heightMedian: 1.07, heightMax: 1.18, weightMin: 13.5, weightMedian: 18.4, weightMax: 23.3 },
  { ageMonths: 60, ageYears: '5', heightMin: 1.04, heightMedian: 1.16, heightMax: 1.28, weightMin: 15.5, weightMedian: 21.3, weightMax: 27.1 },
  { ageMonths: 72, ageYears: '6', heightMin: 1.12, heightMedian: 1.25, heightMax: 1.38, weightMin: 17.5, weightMedian: 24.5, weightMax: 31.5 },
  { ageMonths: 84, ageYears: '7', heightMin: 1.19, heightMedian: 1.33, heightMax: 1.47, weightMin: 19.5, weightMedian: 27.8, weightMax: 36.1 },
  { ageMonths: 96, ageYears: '8', heightMin: 1.26, heightMedian: 1.41, heightMax: 1.56, weightMin: 21.5, weightMedian: 31.3, weightMax: 41.1 },
  { ageMonths: 108, ageYears: '9', heightMin: 1.33, heightMedian: 1.50, heightMax: 1.67, weightMin: 23.5, weightMedian: 35.3, weightMax: 47.1 },
  { ageMonths: 120, ageYears: '10', heightMin: 1.40, heightMedian: 1.58, heightMax: 1.76, weightMin: 25.5, weightMedian: 39.5, weightMax: 53.5 },
  { ageMonths: 132, ageYears: '11', heightMin: 1.47, heightMedian: 1.67, heightMax: 1.87, weightMin: 27.5, weightMedian: 44.1, weightMax: 60.7 },
  { ageMonths: 144, ageYears: '12', heightMin: 1.54, heightMedian: 1.75, heightMax: 1.96, weightMin: 30.0, weightMedian: 49.3, weightMax: 68.6 },
];

// Female Height and Weight Standards by Age (months)
export const FEMALE_STANDARDS: HeightWeightStandard[] = [
  { ageMonths: 6, ageYears: '0.5', heightMin: 0.60, heightMedian: 0.66, heightMax: 0.72, weightMin: 4.5, weightMedian: 6.8, weightMax: 8.9 },
  { ageMonths: 12, ageYears: '1', heightMin: 0.68, heightMedian: 0.75, heightMax: 0.82, weightMin: 6.5, weightMedian: 8.9, weightMax: 11.3 },
  { ageMonths: 24, ageYears: '2', heightMin: 0.78, heightMedian: 0.87, heightMax: 0.96, weightMin: 9.0, weightMedian: 12.5, weightMax: 16.0 },
  { ageMonths: 36, ageYears: '3', heightMin: 0.86, heightMedian: 0.96, heightMax: 1.06, weightMin: 10.5, weightMedian: 14.6, weightMax: 18.7 },
  { ageMonths: 48, ageYears: '4', heightMin: 0.94, heightMedian: 1.05, heightMax: 1.16, weightMin: 12.5, weightMedian: 17.0, weightMax: 21.5 },
  { ageMonths: 60, ageYears: '5', heightMin: 1.02, heightMedian: 1.14, heightMax: 1.26, weightMin: 14.5, weightMedian: 19.8, weightMax: 25.1 },
  { ageMonths: 72, ageYears: '6', heightMin: 1.10, heightMedian: 1.23, heightMax: 1.36, weightMin: 16.5, weightMedian: 22.9, weightMax: 29.3 },
  { ageMonths: 84, ageYears: '7', heightMin: 1.17, heightMedian: 1.31, heightMax: 1.45, weightMin: 18.5, weightMedian: 26.3, weightMax: 34.1 },
  { ageMonths: 96, ageYears: '8', heightMin: 1.24, heightMedian: 1.39, heightMax: 1.54, weightMin: 20.5, weightMedian: 29.9, weightMax: 39.3 },
  { ageMonths: 108, ageYears: '9', heightMin: 1.31, heightMedian: 1.48, heightMax: 1.65, weightMin: 22.5, weightMedian: 33.9, weightMax: 45.3 },
  { ageMonths: 120, ageYears: '10', heightMin: 1.38, heightMedian: 1.57, heightMax: 1.76, weightMin: 24.5, weightMedian: 38.4, weightMax: 52.3 },
  { ageMonths: 132, ageYears: '11', heightMin: 1.45, heightMedian: 1.65, heightMax: 1.85, weightMin: 26.5, weightMedian: 43.3, weightMax: 60.1 },
  { ageMonths: 144, ageYears: '12', heightMin: 1.52, heightMedian: 1.73, heightMax: 1.94, weightMin: 29.0, weightMedian: 48.6, weightMax: 68.2 },
];

// BMI Standards by Age and Gender
export const BMI_STANDARDS: BMIStandard[] = [
  { ageYears: '5', gender: 'Male', underweight: 13.7, normal: 16.5, overweight: 18.4, obese: 18.4 },
  { ageYears: '6', gender: 'Male', underweight: 13.5, normal: 16.9, overweight: 19.3, obese: 19.3 },
  { ageYears: '7', gender: 'Male', underweight: 13.4, normal: 17.4, overweight: 20.1, obese: 20.1 },
  { ageYears: '8', gender: 'Male', underweight: 13.4, normal: 17.9, overweight: 21.0, obese: 21.0 },
  { ageYears: '9', gender: 'Male', underweight: 13.5, normal: 18.5, overweight: 22.0, obese: 22.0 },
  { ageYears: '10', gender: 'Male', underweight: 13.8, normal: 19.2, overweight: 23.0, obese: 23.0 },
  { ageYears: '11', gender: 'Male', underweight: 14.2, normal: 20.0, overweight: 24.1, obese: 24.1 },
  { ageYears: '12', gender: 'Male', underweight: 14.7, normal: 20.9, overweight: 25.2, obese: 25.2 },
  { ageYears: '5', gender: 'Female', underweight: 13.5, normal: 16.8, overweight: 18.9, obese: 18.9 },
  { ageYears: '6', gender: 'Female', underweight: 13.2, normal: 17.2, overweight: 19.8, obese: 19.8 },
  { ageYears: '7', gender: 'Female', underweight: 13.0, normal: 17.7, overweight: 20.6, obese: 20.6 },
  { ageYears: '8', gender: 'Female', underweight: 12.9, normal: 18.3, overweight: 21.5, obese: 21.5 },
  { ageYears: '9', gender: 'Female', underweight: 13.0, normal: 19.0, overweight: 22.6, obese: 22.6 },
  { ageYears: '10', gender: 'Female', underweight: 13.2, normal: 19.8, overweight: 23.6, obese: 23.6 },
  { ageYears: '11', gender: 'Female', underweight: 13.5, normal: 20.7, overweight: 24.8, obese: 24.8 },
  { ageYears: '12', gender: 'Female', underweight: 14.0, normal: 21.7, overweight: 26.0, obese: 26.0 },
];

export const getHeightForAgeStandard = (ageMonths: number, gender: 'Male' | 'Female'): HeightWeightStandard | null => {
  const standards = gender === 'Male' ? MALE_STANDARDS : FEMALE_STANDARDS;
  return standards.find(s => s.ageMonths === ageMonths) || null;
};

export const getBMIStandard = (ageYears: string, gender: 'Male' | 'Female'): BMIStandard | null => {
  return BMI_STANDARDS.find(s => s.ageYears === ageYears && s.gender === gender) || null;
};
