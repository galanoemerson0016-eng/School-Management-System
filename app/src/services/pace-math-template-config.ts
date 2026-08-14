/**
 * Authoritative PACE FORM - Mathematics Structure (Grade 1 Only)
 * Extracted directly from DepEd PACE FORM - Mathematics.xlsx
 */

export interface PaceMathSubItem {
  id: string;
  label: string;
}

export interface PaceMathCompetency {
  id: string;
  number: number;
  description: string;
  hasSubItems: boolean;
  subItems?: PaceMathSubItem[];
}

export interface PaceMathDomain {
  id: string;
  title: string;
  competencies: PaceMathCompetency[];
}

export interface PaceMathTermSection {
  id: string;
  termTitle: string; // e.g. "Term 1", "Term 2", "Term 3"
  domains: PaceMathDomain[];
}

export const PACE_MATH_TERM_SECTIONS: PaceMathTermSection[] = [
  // --- TERM 1 ---
  {
    id: 'term-1',
    termTitle: 'Term 1',
    domains: [
      {
        id: 'term1-number-algebra',
        title: 'Number and Algebra',
        competencies: [
          {
            id: 'm1_1',
            number: 1,
            description: 'Count up to 100 (includes counting up or down from a given number and identifying a number that is a 1 more or 1 less than a given number).',
            hasSubItems: false
          },
          {
            id: 'm1_2',
            number: 2,
            description: 'Read and write numerals up to 100.',
            hasSubItems: false
          },
          {
            id: 'm1_3',
            number: 3,
            description: 'Recognize and represent numbers up to 100 using a variety of concrete and pictorial models (e.g., number line, block or bar models, and numerals).',
            hasSubItems: false
          },
          {
            id: 'm1_4',
            number: 4,
            description: 'Compare two numbers up to 20.',
            hasSubItems: false
          },
          {
            id: 'm1_5',
            number: 5,
            description: 'Order numbers up to 20 from smallest to largest, and vice versa.',
            hasSubItems: false
          },
          {
            id: 'm1_6',
            number: 6,
            description: 'Describe the position of objects using ordinal numbers: 1st, 2nd, 3rd, up to 10th.',
            hasSubItems: false
          },
          {
            id: 'm1_7',
            number: 7,
            description: 'Compose and decompose numbers up to 10 using concrete materials.',
            hasSubItems: false
          },
          {
            id: 'm1_8',
            number: 8,
            description: 'Illustrate addition of numbers with sums up to 20 using a variety of concrete and pictorial models and describes addition as "counting up" and "putting together".',
            hasSubItems: false
          },
          {
            id: 'm1_9',
            number: 9,
            description: 'Illustrate by applying the following properties of addition, using sums up to 20:',
            hasSubItems: true,
            subItems: [
              { id: 'm1_9a', label: 'a.   the sum of zero and any number is equal to the number' },
              { id: 'm1_9b', label: 'b.   Changing the order of the addends does not change the sum' }
            ]
          },
          {
            id: 'm1_10',
            number: 10,
            description: 'Solve problems (given orally or in pictures) involving addition with sums up to 20.',
            hasSubItems: false
          }
        ]
      },
      {
        id: 'term1-measurement',
        title: 'Measurement',
        competencies: [
          {
            id: 'm1_11',
            number: 11,
            description: 'Identify simple 2-dimensional shapes (triangle, rectangle, square) of different size and in different orientation.',
            hasSubItems: false
          },
          {
            id: 'm1_12',
            number: 12,
            description: 'Compare and distinguish 2-dimensional shapes according to features such as sides and corners.',
            hasSubItems: false
          },
          {
            id: 'm1_13',
            number: 13,
            description: 'Compose and decompose triangles, squares, and rectangles.',
            hasSubItems: false
          },
          {
            id: 'm1_14',
            number: 14,
            description: 'Measure the length of an object and the distance between two objects using non-standard units.',
            hasSubItems: false
          },
          {
            id: 'm1_15',
            number: 15,
            description: 'Compare lengths and distances using non-standard units.',
            hasSubItems: false
          },
          {
            id: 'm1_16',
            number: 16,
            description: 'Solve problems involving lenghts and distances using non-standard units.',
            hasSubItems: false
          }
        ]
      }
    ]
  },

  // --- TERM 2 ---
  {
    id: 'term-2',
    termTitle: 'Term 2',
    domains: [
      {
        id: 'term2-number-algebra',
        title: 'Number and Algebra',
        competencies: [
          {
            id: 'm2_1',
            number: 1,
            description: 'Order numbers up to 100 from smallest to largest, and vice versa.',
            hasSubItems: false
          },
          {
            id: 'm2_2',
            number: 2,
            description: 'Counts by 2s, 5s, and 10s up to 100.',
            hasSubItems: false
          },
          {
            id: 'm2_3',
            number: 3,
            description: 'Determine:',
            hasSubItems: true,
            subItems: [
              { id: 'm2_3a', label: 'a.   the place value of a digit in 2-digit number' }
            ]
          },
          {
            id: 'm2_4',
            number: 4,
            description: 'b.   the value of a digit',
            hasSubItems: false
          },
          {
            id: 'm2_5',
            number: 5,
            description: 'c.   the digit of a number, given its place value',
            hasSubItems: false
          },
          {
            id: 'm2_6',
            number: 6,
            description: 'Decompose any 2-digit number into tens and ones.',
            hasSubItems: false
          },
          {
            id: 'm2_7',
            number: 7,
            description: 'Add numbers by expressing addends as tens and ones (expanded form).',
            hasSubItems: false
          },
          {
            id: 'm2_8',
            number: 8,
            description: 'Add numbers with sums up to 100 without regrouping, using a variety of concrete and pictorial models for:',
            hasSubItems: true,
            subItems: [
              { id: 'm2_8a', label: 'a.   2-digit and 1-digit numbers' },
              { id: 'm2_8b', label: 'b.   2-digit and 2-digit numbers' }
            ]
          },
          {
            id: 'm2_9',
            number: 9,
            description: 'Solve problems (given orally or in pictures) involving addition with sums up to 100 without regrouping.',
            hasSubItems: false
          },
          {
            id: 'm2_10',
            number: 10,
            description: 'Illustrate subtraction iinvolving numbers up to 20 using a variety of concrete and pictorial models and describes subtraction as "taking away".',
            hasSubItems: false
          },
          {
            id: 'm2_11',
            number: 11,
            description: 'Find the missing number in addition or subtraction sentences involving numbers upt to 20.',
            hasSubItems: false
          },
          {
            id: 'm2_12',
            number: 12,
            description: 'Write an equivalent expression to a given addition or subtraction expression (e.g., 2+3 = 1+4; 10-5 = 6-1).',
            hasSubItems: false
          },
          {
            id: 'm2_13',
            number: 13,
            description: 'Solve subtraction problems (given orally or in pictures) where both numbers are less than 20.',
            hasSubItems: false
          },
          {
            id: 'm2_14',
            number: 14,
            description: 'Subtract numbers where both numbers are less than 100 using concrete and pictorial models, without regrouping:',
            hasSubItems: true,
            subItems: [
              { id: 'm2_14a', label: 'a.   2-digit minus 1-digit numbers' },
              { id: 'm2_14b', label: 'b.   2-digit minus 2-digit numbers' }
            ]
          },
          {
            id: 'm2_15',
            number: 15,
            description: 'Subtract numbers by expressing minuends and subtrahends as tens and ones (expanded form) without regrouping.',
            hasSubItems: false
          }
        ]
      },
      {
        id: 'term2-data-probability',
        title: 'Data and Probability',
        competencies: [
          {
            id: 'm2_16',
            number: 16,
            description: 'Collect data in one variable through a simple interview.',
            hasSubItems: false
          },
          {
            id: 'm2_17',
            number: 17,
            description: 'Present data in a pictograph without a scale.',
            hasSubItems: false
          },
          {
            id: 'm2_18',
            number: 18,
            description: 'Interpret a pictograph without a scale.',
            hasSubItems: false
          },
          {
            id: 'm2_19',
            number: 19,
            description: 'Organize data in a pictograph without a scale into a table.',
            hasSubItems: false
          }
        ]
      }
    ]
  },

  // --- TERM 3 ---
  {
    id: 'term-3',
    termTitle: 'Term 3',
    domains: [
      {
        id: 'term3-number-algebra',
        title: 'Number and Algebra',
        competencies: [
          {
            id: 'm3_1',
            number: 1,
            description: 'Determine the next term/s in a repeating pattern (patterns could use rhythmic properties, visual elements in the arts, ...)',
            hasSubItems: false
          },
          {
            id: 'm3_2',
            number: 2,
            description: 'Create repeating patterns using objects, images, or numbers.',
            hasSubItems: false
          },
          {
            id: 'm3_3',
            number: 3,
            description: 'Illustrate 1/2 and 1/4 as parts of a whole.',
            hasSubItems: false
          },
          {
            id: 'm3_4',
            number: 4,
            description: 'Compare 1/2 and 1/4 using models.',
            hasSubItems: false
          },
          {
            id: 'm3_5',
            number: 5,
            description: 'Cout halves and quarters.',
            hasSubItems: false
          },
          {
            id: 'm3_6',
            number: 6,
            description: 'Recognize coins (excluding centavo coins) and bills up to ₱100 and their notations.',
            hasSubItems: false
          },
          {
            id: 'm3_7',
            number: 7,
            description: 'Determine the value of a number of bills and/or a number of coins (excluding centavo coins) up to ₱100.',
            hasSubItems: false
          },
          {
            id: 'm3_8',
            number: 8,
            description: 'Compare different denominations of peso coins (excluding centavo coins) and bills up to ₱100.',
            hasSubItems: false
          },
          {
            id: 'm3_9',
            number: 9,
            description: 'Solve 1-step problems (given orally or in pictures) involving addition of money where the sum is up to ₱100, or subtraction of money where both amounts are less than ₱100.',
            hasSubItems: false
          }
        ]
      },
      {
        id: 'term3-measurement-geometry',
        title: 'Measurement and Geometry',
        competencies: [
          {
            id: 'm3_10',
            number: 10,
            description: 'Identify the position of objects move in half turn or in quarter turn, in clockwise or in counter-clockwise direction, given an initial facing direction.',
            hasSubItems: false
          },
          {
            id: 'm3_11',
            number: 11,
            description: 'Read and write time by the hour, half hour, and quarter hour using an analog clock.',
            hasSubItems: false
          },
          {
            id: 'm3_12',
            number: 12,
            description: 'Give the days of the week and months of the year ini the correct order.',
            hasSubItems: false
          },
          {
            id: 'm3_13',
            number: 13,
            description: 'Determine the day and month of the year using a calendar.',
            hasSubItems: false
          },
          {
            id: 'm3_14',
            number: 14,
            description: 'Solve problems involving time (hour, half hour, quarter hour, days in a week, and months in a year).',
            hasSubItems: false
          }
        ]
      }
    ]
  }
];
