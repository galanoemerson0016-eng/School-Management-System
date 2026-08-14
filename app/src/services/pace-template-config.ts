import type { PaceDescriptorInfo } from '../types/pace';

export type MacroSkillType = 'listening' | 'speaking' | 'reading' | 'writing';

export interface PaceSubRow {
  id: string; // Unique key e.g. "1_listening", "12a_speaking"
  skill: MacroSkillType;
  label?: string; // Optional label if sub-item e.g. "a. words that label..."
}

export interface PaceCompetencyItem {
  id: number;
  number: number;
  description: string;
  hasSubItems: boolean;
  mainSubRows?: PaceSubRow[];
  subRows?: PaceSubRow[]; // For single items with multi-macro skill sub-rows
  subItems?: {
    id: string;
    label: string;
    subRows: PaceSubRow[];
  }[];
}

export interface PaceDomainGroup {
  id: string;
  title: string;
  subtitle: string;
  columnGroup: 'left' | 'right';
  showBanner?: boolean;
  competencies: PaceCompetencyItem[];
}

export const PACE_GENERAL_INSTRUCTIONS = {
  prefix: "General Instructions: Teacher shall accomplish this form on a regular basis throughout the term, not as a one-time entry, by recording the learner's level of attainment for each learning competency using the appropriate descriptor: A (Advancing), B (Benchmarking), C (Connecting), D (Developing), or E (Emerging). Entries shall be made in the corresponding term ",
  boldPart: "only after the learner has engaged in a series of formative tasks and activities and has completed a relevant summative assessment.",
  suffix: " The assigned level shall be based on sufficient and varied evidence of learning, including learner outputs, observations, anecdotal records, and other assessment results, and shall reflect the learner's most consistent level of performance."
};

export const PACE_DESCRIPTORS: PaceDescriptorInfo[] = [
  { code: 'A', title: 'Advancing', description: 'Consistently demonstrates advanced proficiency in the competency.' },
  { code: 'B', title: 'Benchmarking', description: 'Meets the expected benchmark for the competency.' },
  { code: 'C', title: 'Connecting', description: 'Demonstrates connecting understanding with occasional guidance.' },
  { code: 'D', title: 'Developing', description: 'Developing basic capability in performing the competency.' },
  { code: 'E', title: 'Emerging', description: 'Emerging skills requiring continuous scaffolding and support.' }
];

export const PACE_DOMAINS: PaceDomainGroup[] = [
  // LEFT COLUMN
  {
    id: 'phonological-awareness',
    title: 'Phonological Awareness',
    subtitle: 'oracy for literacy',
    columnGroup: 'left',
    competencies: [
      {
        id: 1,
        number: 1,
        description: 'Chant rhymes and poems.',
        hasSubItems: false,
        subRows: [
          { id: '1_listening', skill: 'listening' },
          { id: '1_reading', skill: 'reading' }
        ]
      },
      {
        id: 2,
        number: 2,
        description: 'Segment a two to three syllable word into its syllable parts.',
        hasSubItems: false,
        subRows: [
          { id: '2_listening', skill: 'listening' },
          { id: '2_reading', skill: 'reading' }
        ]
      },
      {
        id: 3,
        number: 3,
        description: 'Identify rhyming words in nursery rhymes, poems, and chants.',
        hasSubItems: false,
        subRows: [
          { id: '3_listening', skill: 'listening' },
          { id: '3_reading', skill: 'reading' }
        ]
      },
      {
        id: 4,
        number: 4,
        description: 'Say two or three words that rhyme.',
        hasSubItems: false,
        subRows: [
          { id: '4_listening', skill: 'listening' },
          { id: '4_reading', skill: 'reading' }
        ]
      },
      {
        id: 5,
        number: 5,
        description: 'Identify initial sounds (vowels, consonants, and semi-vowels, if any).',
        hasSubItems: false,
        subRows: [
          { id: '5_listening', skill: 'listening' },
          { id: '5_reading', skill: 'reading' }
        ]
      }
    ]
  },
  {
    id: 'phonics-word-study',
    title: 'Phonics and Word Study',
    subtitle: 'sounds to words',
    columnGroup: 'left',
    competencies: [
      {
        id: 6,
        number: 6,
        description: 'Produce the sound of the letters of Ll.',
        hasSubItems: false,
        subRows: [
          { id: '6_listening', skill: 'listening' },
          { id: '6_reading', skill: 'reading' },
          { id: '6_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 7,
        number: 7,
        description: 'Identify the letters in L1',
        hasSubItems: false,
        subRows: [
          { id: '7_listening', skill: 'listening' },
          { id: '7_reading', skill: 'reading' },
          { id: '7_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 8,
        number: 8,
        description: 'Isolate sounds (consonants and vowels) in a word (beginning and/or ending).',
        hasSubItems: false,
        subRows: [
          { id: '8_listening', skill: 'listening' },
          { id: '8_reading', skill: 'reading' },
          { id: '8_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 9,
        number: 9,
        description: 'Substitute individual sounds in simple words to make new words.',
        hasSubItems: false,
        subRows: [
          { id: '9_listening', skill: 'listening' },
          { id: '9_reading', skill: 'reading' },
          { id: '9_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 10,
        number: 10,
        description: 'Sound out words accurately.',
        hasSubItems: false,
        subRows: [
          { id: '10_listening', skill: 'listening' },
          { id: '10_reading', skill: 'reading' },
          { id: '10_speaking', skill: 'speaking' }
        ]
      }
    ]
  },
  {
    id: 'vocabulary-word-knowledge',
    title: 'Vocabulary and Word Knowledge',
    subtitle: 'words',
    columnGroup: 'left',
    competencies: [
      {
        id: 11,
        number: 11,
        description: 'Use vocabulary referring to self, family, school, community, and environment.',
        hasSubItems: false,
        subRows: [
          { id: '11_listening', skill: 'listening' },
          { id: '11_reading', skill: 'reading' },
          { id: '11_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 12,
        number: 12,
        description: 'Identify words with different functions (naming and describing words).',
        hasSubItems: true,
        subItems: [
          {
            id: '12a',
            label: 'a.    words that label persons, places, things, animals, actions, situations, ideas, and emotions',
            subRows: [
              { id: '12a_listening', skill: 'listening' },
              { id: '12a_reading', skill: 'reading' },
              { id: '12a_speaking', skill: 'speaking' },
              { id: '12a_writing', skill: 'writing' }
            ]
          },
          {
            id: '12b',
            label: 'b.    words that describes persons, places, things, animals, actions, situations, ideas, and emotions',
            subRows: [
              { id: '12b_listening', skill: 'listening' },
              { id: '12b_reading', skill: 'reading' },
              { id: '12b_speaking', skill: 'speaking' },
              { id: '12b_writing', skill: 'writing' }
            ]
          }
        ]
      },
      {
        id: 13,
        number: 13,
        description: 'Read high-frequency words accurately for meaning.',
        hasSubItems: false,
        subRows: [
          { id: '13_listening', skill: 'listening' },
          { id: '13_reading', skill: 'reading' },
          { id: '13_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 14,
        number: 14,
        description: 'Read content-specific words (Math, Makabansa, and GMRC) accurately for meaning.',
        hasSubItems: false,
        subRows: [
          { id: '14_listening', skill: 'listening' },
          { id: '14_reading', skill: 'reading' },
          { id: '14_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 15,
        number: 15,
        description: 'Write words legibly and correctly.',
        hasSubItems: false,
        subRows: [
          { id: '15_listening', skill: 'listening' },
          { id: '15_reading', skill: 'reading' },
          { id: '15_speaking', skill: 'speaking' },
          { id: '15_writing', skill: 'writing' }
        ]
      }
    ]
  },
  {
    id: 'book-print-knowledge',
    title: 'Book and Print Knowledge',
    subtitle: 'book knowledge & print awareness',
    columnGroup: 'left',
    competencies: [
      {
        id: 16,
        number: 16,
        description: 'Recognize environmental print (symbols).',
        hasSubItems: false,
        subRows: [
          { id: '16_listening', skill: 'listening' },
          { id: '16_reading', skill: 'reading' },
          { id: '16_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 17,
        number: 17,
        description: 'Recognize the parts of the book (cover page, title page, etc.).',
        hasSubItems: false,
        subRows: [
          { id: '17_listening', skill: 'listening' },
          { id: '17_reading', skill: 'reading' },
          { id: '17_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 18,
        number: 18,
        description: 'Recognize proper eye movement skills in reading: left to right, top to bottom, and return sweep.',
        hasSubItems: false,
        subRows: [
          { id: '18_listening', skill: 'listening' },
          { id: '18_reading', skill: 'reading' },
          { id: '18_speaking', skill: 'speaking' }
        ]
      }
    ]
  },

  // RIGHT COLUMN
  {
    id: 'comprehending-analyzing-texts',
    title: 'Comprehending and Analyzing Texts',
    subtitle: 'discourse',
    columnGroup: 'right',
    competencies: [
      {
        id: 19,
        number: 19,
        description: 'Read sentence with appropriate speed, accuracy, and expression.',
        hasSubItems: false,
        subRows: [
          { id: '19_listening', skill: 'listening' },
          { id: '19_reading', skill: 'reading' },
          { id: '19_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 20,
        number: 20,
        description: 'Comprehend stories.',
        hasSubItems: true,
        subItems: [
          {
            id: '20a',
            label: 'a.    Note important details in stories (character, setting, and event).',
            subRows: [
              { id: '20a_listening', skill: 'listening' },
              { id: '20a_reading', skill: 'reading' },
              { id: '20a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20b',
            label: 'b.    Sequence events in stories.',
            subRows: [
              { id: '20b_listening', skill: 'listening' },
              { id: '20b_reading', skill: 'reading' },
              { id: '20b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20c',
            label: 'c.    Infer the character\'s feelings and traits.',
            subRows: [
              { id: '20c_listening', skill: 'listening' },
              { id: '20c_reading', skill: 'reading' },
              { id: '20c_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20d',
            label: 'd.    Predict possible ending.',
            subRows: [
              { id: '20d_listening', skill: 'listening' },
              { id: '20d_reading', skill: 'reading' },
              { id: '20d_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20e',
            label: 'e.    Relate story events to one\'s experience.',
            subRows: [
              { id: '20e_listening', skill: 'listening' },
              { id: '20e_reading', skill: 'reading' },
              { id: '20e_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20f',
            label: 'f.    Identify cause and effect of events.',
            subRows: [
              { id: '20f_listening', skill: 'listening' },
              { id: '20f_reading', skill: 'reading' },
              { id: '20f_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20g',
            label: 'g.    Identify problem and solution of events.',
            subRows: [
              { id: '20g_listening', skill: 'listening' },
              { id: '20g_reading', skill: 'reading' },
              { id: '20g_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 21,
        number: 21,
        description: 'Comprehend informational text.',
        hasSubItems: true,
        subItems: [
          {
            id: '21a',
            label: 'a.    Note significant details in informational texts (list and describe).',
            subRows: [
              { id: '21a_listening', skill: 'listening' },
              { id: '21a_reading', skill: 'reading' },
              { id: '21a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '21b',
            label: 'b.    Identify problem and solution.',
            subRows: [
              { id: '21b_listening', skill: 'listening' },
              { id: '21b_reading', skill: 'reading' },
              { id: '21b_speaking', skill: 'speaking' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'creating-composing-texts',
    title: 'Creating and Composing Texts',
    subtitle: 'discourse',
    columnGroup: 'right',
    competencies: [
      {
        id: 22,
        number: 22,
        description: 'Narrate one\'s personal experiences.',
        hasSubItems: true,
        subItems: [
          {
            id: '22a',
            label: 'a.    oneself and family',
            subRows: [
              { id: '22a_reading', skill: 'reading' },
              { id: '22a_writing', skill: 'writing' }
            ]
          },
          {
            id: '22b',
            label: 'b.    school',
            subRows: [
              { id: '22b_reading', skill: 'reading' },
              { id: '22b_writing', skill: 'writing' }
            ]
          },
          {
            id: '22c',
            label: 'a.    community ', // Reproduce exact spelling/numbering from master spec
            subRows: [
              { id: '22c_reading', skill: 'reading' },
              { id: '22c_writing', skill: 'writing' }
            ]
          }
        ]
      },
      {
        id: 23,
        number: 23,
        description: 'Use own words in retelling myths, legends, fables, and narrative poems.',
        hasSubItems: false,
        subRows: [
          { id: '23_reading', skill: 'reading' },
          { id: '23_writing', skill: 'writing' }
        ]
      },
      {
        id: 24,
        number: 24,
        description: 'Express ideas about:',
        hasSubItems: true,
        subItems: [
          {
            id: '24a',
            label: 'a.    oneself',
            subRows: [
              { id: '24a_reading', skill: 'reading' },
              { id: '24a_writing', skill: 'writing' }
            ]
          },
          {
            id: '24b',
            label: 'b.    school',
            subRows: [
              { id: '24b_reading', skill: 'reading' },
              { id: '24b_writing', skill: 'writing' }
            ]
          },
          {
            id: '24c',
            label: 'c.    community',
            subRows: [
              { id: '24c_reading', skill: 'reading' },
              { id: '24c_writing', skill: 'writing' }
            ]
          }
        ]
      },
      {
        id: 25,
        number: 25,
        description: 'Respond creatively to texts (myths, legends, fables, and narrative poems).',
        hasSubItems: false,
        subRows: [
          { id: '25_reading', skill: 'reading' },
          { id: '25_writing', skill: 'writing' }
        ]
      }
    ]
  }
];

export const MACRO_SKILL_COLORS: Record<MacroSkillType, string> = {
  listening: '#FEF2CB', // Light Yellow
  speaking: '#FBE5D6',  // Light Orange/Peach
  reading: '#ECC8EC',   // Soft Pink/Lilac
  writing: '#C6E0B4'    // Light Green
};

export const UNASSESSED_CELL_GREY = '#B8C0C8';

/**
 * Authoritative Cell Background Fill Color Matrix (Extracted from PACE_FORM_Reading_and_Literacy_FULL_TEMPLATE_SPEC.json)
 * Guarantees 100% exact visual match to the original Master Excel template!
 */
export const PACE_MASTER_CELL_COLORS: Record<string, { t1: string; t2: string; t3: string }> = {
  "1_listening": { "t1": "#FEF2CB", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "1_reading": { "t1": "#ECC8EC", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "2_listening": { "t1": "#FEF2CB", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "2_reading": { "t1": "#ECC8EC", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "3_listening": { "t1": "#FEF2CB", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "3_reading": { "t1": "#ECC8EC", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "4_listening": { "t1": "#FEF2CB", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "4_reading": { "t1": "#ECC8EC", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "5_listening": { "t1": "#FEF2CB", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "5_reading": { "t1": "#ECC8EC", "t2": "#B8C0C8", "t3": "#B8C0C8" },

  "6_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "6_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "6_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "7_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "7_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "7_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "8_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "8_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "8_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "9_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "9_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "9_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "10_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "10_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "10_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },

  "11_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "11_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "11_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },

  "12_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "12a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "12a_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "12a_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "12a_writing": { "t1": "#B8C0C8", "t2": "#C6E0B4", "t3": "#C6E0B4" },
  "12b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "12b_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "12b_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "12b_writing": { "t1": "#B8C0C8", "t2": "#C6E0B4", "t3": "#C6E0B4" },
  "13_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "13_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "13_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "14_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "14_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "14_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "15_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "15_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "15_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "15_writing": { "t1": "#C6E0B4", "t2": "#C6E0B4", "t3": "#C6E0B4" },

  "16_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "16_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "16_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "17_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "17_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "17_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "18_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "18_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "18_speaking": { "t1": "#FBE5D6", "t2": "#FBE5D6", "t3": "#FBE5D6" },

  "19_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "19_reading": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "19_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FBE5D6" },

  "20_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "20a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20a_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20a_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "20b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20b_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20b_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "20c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20c_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20c_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "20d_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20d_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20d_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "20e_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20e_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20e_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "20f_listening": { "t1": "#B8C0C8", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20f_reading": { "t1": "#B8C0C8", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20f_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "20g_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "20g_reading": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "20g_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FBE5D6" },

  "21_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "21a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "21a_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "21a_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },
  "21b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "21b_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "21b_speaking": { "t1": "#B8C0C8", "t2": "#FBE5D6", "t3": "#FBE5D6" },

  "22_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "22a_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "22a_writing": { "t1": "#C6E0B4", "t2": "#C6E0B4", "t3": "#C6E0B4" },
  "22b_reading": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "22b_writing": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#C6E0B4" },
  "22c_reading": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "22c_writing": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#C6E0B4" },

  "23_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "23_writing": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#C6E0B4" },

  "24_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "24a_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "24a_writing": { "t1": "#C6E0B4", "t2": "#C6E0B4", "t3": "#C6E0B4" },
  "24b_reading": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "24b_writing": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#C6E0B4" },
  "24c_reading": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "24c_writing": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#C6E0B4" },

  "25_reading": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "25_writing": { "t1": "#C6E0B4", "t2": "#C6E0B4", "t3": "#C6E0B4" }
};
