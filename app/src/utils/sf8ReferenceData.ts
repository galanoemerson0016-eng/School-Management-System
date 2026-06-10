// SF8 Reference Data - Age and Gender-specific BMI and Height Standards
// WHO Growth Reference 5-19 Years (2007)
// Data extracted from: https://www.who.int/tools/growth-reference-data-for-5to19-years/

export interface BMICategory {
  age: number;
  gender: 'Male' | 'Female';
  sd3neg: number;  // -3 SD (Severely Wasted)
  sd2neg: number;  // -2 SD (Wasted)
  sd1neg: number;  // -1 SD
  median: number;   // 0 SD (Normal)
  sd1: number;     // +1 SD (Overweight begins)
  sd2: number;     // +2 SD (Obese)
}

export interface HeightStandard {
  age: number;
  gender: 'Male' | 'Female';
  sd3neg: number;  // -3 SD
  sd2neg: number;  // -2 SD
  sd1neg: number;  // -1 SD
  median: number;  // 0 SD
  sd1: number;     // +1 SD
  sd2: number;     // +2 SD
  sd3: number;     // +3 SD
}

// WHO BMI-for-Age Reference (5-19 years) - Standard Deviations
// Based on WHO Growth Reference 2007
export const BMI_CATEGORIES: BMICategory[] = [
  { age: 5, gender: 'Male', sd3neg: 11.03, sd2neg: 12.27, sd1neg: 13.85, median: 15.61, sd1: 17.55, sd2: 19.81 },
  { age: 5, gender: 'Female', sd3neg: 10.83, sd2neg: 12.12, sd1neg: 13.75, median: 15.64, sd1: 17.81, sd2: 20.24 },
  { age: 6, gender: 'Male', sd3neg: 10.87, sd2neg: 12.19, sd1neg: 13.84, median: 15.72, sd1: 17.80, sd2: 20.28 },
  { age: 6, gender: 'Female', sd3neg: 10.63, sd2neg: 11.95, sd1neg: 13.63, median: 15.68, sd1: 17.97, sd2: 20.63 },
  { age: 7, gender: 'Male', sd3neg: 10.78, sd2neg: 12.13, sd1neg: 13.85, median: 15.89, sd1: 18.17, sd2: 20.84 },
  { age: 7, gender: 'Female', sd3neg: 10.51, sd2neg: 11.83, sd1neg: 13.56, median: 15.79, sd1: 18.19, sd2: 21.09 },
  { age: 8, gender: 'Male', sd3neg: 10.77, sd2neg: 12.15, sd1neg: 13.93, median: 16.12, sd1: 18.63, sd2: 21.50 },
  { age: 8, gender: 'Female', sd3neg: 10.47, sd2neg: 11.79, sd1neg: 13.54, median: 15.97, sd1: 18.52, sd2: 21.61 },
  { age: 9, gender: 'Male', sd3neg: 10.82, sd2neg: 12.23, sd1neg: 14.09, median: 16.41, sd1: 19.17, sd2: 22.28 },
  { age: 9, gender: 'Female', sd3neg: 10.51, sd2neg: 11.85, sd1neg: 13.61, median: 16.20, sd1: 18.94, sd2: 22.25 },
  { age: 10, gender: 'Male', sd3neg: 10.94, sd2neg: 12.39, sd1neg: 14.31, median: 16.77, sd1: 19.78, sd2: 23.17 },
  { age: 10, gender: 'Female', sd3neg: 10.61, sd2neg: 11.99, sd1neg: 13.76, median: 16.50, sd1: 19.43, sd2: 22.99 },
  { age: 11, gender: 'Male', sd3neg: 11.10, sd2neg: 12.59, sd1neg: 14.58, median: 17.20, sd1: 20.48, sd2: 24.20 },
  { age: 11, gender: 'Female', sd3neg: 10.78, sd2neg: 12.21, sd1neg: 14.00, median: 16.88, sd1: 19.99, sd2: 23.87 },
  { age: 12, gender: 'Male', sd3neg: 11.33, sd2neg: 12.84, sd1neg: 14.89, median: 17.70, sd1: 21.23, sd2: 25.30 },
  { age: 12, gender: 'Female', sd3neg: 11.00, sd2neg: 12.48, sd1neg: 14.33, median: 17.33, sd1: 20.65, sd2: 24.72 },
  { age: 13, gender: 'Male', sd3neg: 11.60, sd2neg: 13.13, sd1neg: 15.23, median: 18.26, sd1: 22.05, sd2: 26.26 },
  { age: 13, gender: 'Female', sd3neg: 11.27, sd2neg: 12.80, sd1neg: 14.71, median: 17.81, sd1: 21.41, sd2: 25.69 },
  { age: 14, gender: 'Male', sd3neg: 11.88, sd2neg: 13.45, sd1neg: 15.59, median: 18.86, sd1: 22.88, sd2: 27.26 },
  { age: 14, gender: 'Female', sd3neg: 11.56, sd2neg: 13.12, sd1neg: 15.12, median: 18.33, sd1: 22.17, sd2: 26.65 },
  { age: 15, gender: 'Male', sd3neg: 12.17, sd2neg: 13.78, sd1neg: 15.97, median: 19.49, sd1: 23.71, sd2: 28.25 },
  { age: 15, gender: 'Female', sd3neg: 11.85, sd2neg: 13.44, sd1neg: 15.53, median: 18.86, sd1: 22.90, sd2: 27.56 },
  { age: 16, gender: 'Male', sd3neg: 12.48, sd2neg: 14.11, sd1neg: 16.36, median: 20.12, sd1: 24.51, sd2: 29.20 },
  { age: 16, gender: 'Female', sd3neg: 12.14, sd2neg: 13.74, sd1neg: 15.92, median: 19.38, sd1: 23.61, sd2: 28.42 },
  { age: 17, gender: 'Male', sd3neg: 12.78, sd2neg: 14.43, sd1neg: 16.73, median: 20.71, sd1: 25.27, sd2: 30.11 },
  { age: 17, gender: 'Female', sd3neg: 12.42, sd2neg: 14.02, sd1neg: 16.29, median: 19.88, sd1: 24.30, sd2: 29.26 },
  { age: 18, gender: 'Male', sd3neg: 13.08, sd2neg: 14.73, sd1neg: 17.09, median: 21.26, sd1: 25.99, sd2: 30.97 },
  { age: 18, gender: 'Female', sd3neg: 12.70, sd2neg: 14.30, sd1neg: 16.65, median: 20.36, sd1: 24.96, sd2: 30.07 },
];

// WHO Height-for-Age Reference (5-19 years) - in cm
// Based on WHO Growth Reference 2007
export const HEIGHT_STANDARDS: HeightStandard[] = [
  { age: 5, gender: 'Male', sd3neg: 102.2, sd2neg: 105.3, sd1neg: 108.7, median: 112.3, sd1: 115.9, sd2: 119.5, sd3: 123.0 },
  { age: 5, gender: 'Female', sd3neg: 101.2, sd2neg: 104.2, sd1neg: 107.5, median: 111.0, sd1: 114.6, sd2: 118.2, sd3: 121.8 },
  { age: 6, gender: 'Male', sd3neg: 108.5, sd2neg: 111.7, sd1neg: 115.3, median: 119.0, sd1: 122.7, sd2: 126.4, sd3: 130.1 },
  { age: 6, gender: 'Female', sd3neg: 107.4, sd2neg: 110.5, sd1neg: 113.9, median: 117.4, sd1: 120.9, sd2: 124.4, sd3: 127.9 },
  { age: 7, gender: 'Male', sd3neg: 114.8, sd2neg: 118.2, sd1neg: 121.9, median: 125.7, sd1: 129.5, sd2: 133.3, sd3: 137.1 },
  { age: 7, gender: 'Female', sd3neg: 113.6, sd2neg: 116.9, sd1neg: 120.5, median: 124.2, sd1: 127.9, sd2: 131.6, sd3: 135.3 },
  { age: 8, gender: 'Male', sd3neg: 121.0, sd2neg: 124.6, sd1neg: 128.5, median: 132.4, sd1: 136.3, sd2: 140.2, sd3: 144.1 },
  { age: 8, gender: 'Female', sd3neg: 119.7, sd2neg: 123.2, sd1neg: 127.0, median: 130.8, sd1: 134.6, sd2: 138.4, sd3: 142.2 },
  { age: 9, gender: 'Male', sd3neg: 127.1, sd2neg: 130.8, sd1neg: 134.9, median: 139.1, sd1: 143.3, sd2: 147.5, sd3: 151.7 },
  { age: 9, gender: 'Female', sd3neg: 125.6, sd2neg: 129.2, sd1neg: 133.3, median: 137.5, sd1: 141.7, sd2: 145.9, sd3: 150.1 },
  { age: 10, gender: 'Male', sd3neg: 132.9, sd2neg: 136.8, sd1neg: 141.1, median: 145.5, sd1: 150.0, sd2: 154.5, sd3: 159.0 },
  { age: 10, gender: 'Female', sd3neg: 131.2, sd2neg: 135.0, sd1neg: 139.4, median: 143.8, sd1: 148.3, sd2: 152.8, sd3: 157.3 },
  { age: 11, gender: 'Male', sd3neg: 138.4, sd2neg: 142.6, sd1neg: 147.2, median: 151.8, sd1: 156.5, sd2: 161.2, sd3: 165.9 },
  { age: 11, gender: 'Female', sd3neg: 136.6, sd2neg: 140.6, sd1neg: 145.3, median: 149.9, sd1: 154.7, sd2: 159.5, sd3: 164.3 },
  { age: 12, gender: 'Male', sd3neg: 143.3, sd2neg: 147.8, sd1neg: 152.8, median: 157.8, sd1: 162.9, sd2: 168.0, sd3: 173.1 },
  { age: 12, gender: 'Female', sd3neg: 141.8, sd2neg: 146.0, sd1neg: 150.9, median: 155.8, sd1: 160.8, sd2: 165.8, sd3: 170.8 },
  { age: 13, gender: 'Male', sd3neg: 148.1, sd2neg: 153.0, sd1neg: 158.3, median: 163.7, sd1: 169.2, sd2: 174.7, sd3: 180.2 },
  { age: 13, gender: 'Female', sd3neg: 146.2, sd2neg: 150.5, sd1neg: 155.5, median: 160.5, sd1: 165.6, sd2: 170.7, sd3: 175.8 },
  { age: 14, gender: 'Male', sd3neg: 152.3, sd2neg: 157.5, sd1neg: 163.1, median: 168.8, sd1: 174.6, sd2: 180.4, sd3: 186.2 },
  { age: 14, gender: 'Female', sd3neg: 149.2, sd2neg: 153.7, sd1neg: 158.8, median: 163.9, sd1: 169.1, sd2: 174.3, sd3: 179.5 },
  { age: 15, gender: 'Male', sd3neg: 156.2, sd2neg: 161.6, sd1neg: 167.4, median: 173.3, sd1: 179.3, sd2: 185.3, sd3: 191.3 },
  { age: 15, gender: 'Female', sd3neg: 151.2, sd2neg: 155.8, sd1neg: 160.9, median: 166.1, sd1: 171.4, sd2: 176.7, sd3: 182.0 },
  { age: 16, gender: 'Male', sd3neg: 159.5, sd2neg: 165.1, sd1neg: 171.0, median: 177.0, sd1: 183.1, sd2: 189.2, sd3: 195.3 },
  { age: 16, gender: 'Female', sd3neg: 152.8, sd2neg: 157.4, sd1neg: 162.5, median: 167.6, sd1: 172.8, sd2: 178.0, sd3: 183.2 },
  { age: 17, gender: 'Male', sd3neg: 162.3, sd2neg: 167.9, sd1neg: 173.9, median: 179.9, sd1: 186.0, sd2: 192.1, sd3: 198.2 },
  { age: 17, gender: 'Female', sd3neg: 153.9, sd2neg: 158.5, sd1neg: 163.6, median: 168.7, sd1: 173.9, sd2: 179.1, sd3: 184.3 },
  { age: 18, gender: 'Male', sd3neg: 164.5, sd2neg: 170.1, sd1neg: 176.1, median: 182.2, sd1: 188.3, sd2: 194.4, sd3: 200.5 },
  { age: 18, gender: 'Female', sd3neg: 154.7, sd2neg: 159.3, sd1neg: 164.4, median: 169.5, sd1: 174.7, sd2: 179.9, sd3: 185.1 },
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

  // WHO SD classifications:
  // < -3 SD: Severely Wasted, -3 to -2 SD: Wasted, -2 to +1 SD: Normal, +1 to +2 SD: Overweight, > +2 SD: Obese
  if (bmi < standard.sd2neg) return 'Severely Wasted';
  if (bmi < standard.sd1neg) return 'Wasted';
  if (bmi < standard.sd1) return 'Normal';
  if (bmi < standard.sd2) return 'Overweight';
  return 'Obese';
};

export const getHeightForAge = (heightCm: number, age: number, gender: 'Male' | 'Female'): string => {
  const standard = HEIGHT_STANDARDS.find(h => h.age === age && h.gender === gender);
  if (!standard) return 'Normal';

  const medianHeight = standard.median;
  const percentageOfMedian = (heightCm / medianHeight) * 100;

  // HFA Classifications based on median percentage:
  // >= 95%: Normal, 90-95%: Moderately Stunted, 80-90%: Stunted, < 80%: Severely Stunted
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
