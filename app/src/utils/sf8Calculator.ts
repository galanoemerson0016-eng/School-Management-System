// SF8 Calculation utilities for BMI, nutritional status, and height for age assessment

import { getHeightForAgeStandard, getBMIStandard } from './sf8ReferenceData';

export interface SF8Calculation {
  weight: number;
  height: number;
  heightSquared: number;
  bmi: number;
  bmiCategory: string;
  heightForAge: string;
  remarks: string;
}

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export const calculateAgeInMonths = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
};

export const calculateSF8 = (
  weight: number | string,
  height: number | string,
  birthDate: string,
  gender: 'Male' | 'Female'
): SF8Calculation => {
  const w = Number(weight) || 0;
  const h = Number(height) || 0;

  if (w <= 0 || h <= 0) {
    return {
      weight: w,
      height: h,
      heightSquared: 0,
      bmi: 0,
      bmiCategory: '',
      heightForAge: '',
      remarks: ''
    };
  }

  // Calculate height squared
  const h2 = Math.round(h * h * 100) / 100;

  // Calculate BMI
  const bmi = Math.round((w / h2) * 100) / 100;

  // Get age
  const ageYears = calculateAge(birthDate);
  const ageMonths = calculateAgeInMonths(birthDate);

  // Determine BMI Category
  let bmiCategory = '';
  const bmiStandard = getBMIStandard(ageYears.toString(), gender);

  if (bmiStandard) {
    if (bmi < bmiStandard.underweight) {
      bmiCategory = 'Underweight';
    } else if (bmi < bmiStandard.normal) {
      bmiCategory = 'Normal';
    } else if (bmi < bmiStandard.overweight) {
      bmiCategory = 'Normal';
    } else if (bmi < bmiStandard.obese) {
      bmiCategory = 'Overweight';
    } else {
      bmiCategory = 'Obese';
    }
  }

  // Determine Height for Age Status
  let heightForAge = '';
  let remarks = '';

  const hfaStandard = getHeightForAgeStandard(ageMonths, gender);

  if (hfaStandard) {
    const percentageOfMedian = (h / hfaStandard.heightMedian) * 100;

    if (percentageOfMedian >= 95) {
      heightForAge = 'Normal';
      remarks = 'Normal';
    } else if (percentageOfMedian >= 90) {
      heightForAge = 'Stunted';
      remarks = 'Stunted';
    } else if (percentageOfMedian >= 80) {
      heightForAge = 'Stunted';
      remarks = 'Moderately Stunted';
    } else {
      heightForAge = 'Severely Stunted';
      remarks = 'Severely Stunted';
    }
  }

  // Override remarks based on BMI category
  if (bmiCategory === 'Obese') {
    remarks = 'Obese';
  } else if (bmiCategory === 'Overweight') {
    remarks = 'Overweight';
  } else if (bmiCategory === 'Underweight') {
    remarks = 'Underweight';
  }

  return {
    weight: w,
    height: h,
    heightSquared: h2,
    bmi,
    bmiCategory,
    heightForAge,
    remarks
  };
};

export const getNutritionStatusColor = (remarks: string): string => {
  switch (remarks.toLowerCase()) {
    case 'normal':
      return 'bg-green-100 text-green-800';
    case 'underweight':
      return 'bg-yellow-100 text-yellow-800';
    case 'overweight':
      return 'bg-orange-100 text-orange-800';
    case 'obese':
      return 'bg-red-100 text-red-800';
    case 'stunted':
    case 'moderately stunted':
      return 'bg-blue-100 text-blue-800';
    case 'severely stunted':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
