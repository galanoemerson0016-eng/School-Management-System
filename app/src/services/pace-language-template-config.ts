/**
 * Authoritative PACE FORM - Language Domain & Competency Structure (Grade 1 Only)
 * Extracted directly from DepEd PACE FORM - Language.xlsx
 */

export interface PaceSubRow {
  id: string;
  skill: 'listening' | 'speaking';
}

export interface PaceSubItem {
  id: string;
  label: string;
  subRows: PaceSubRow[];
}

export interface PaceCompetency {
  id: number;
  number: number;
  description: string;
  hasSubItems: boolean;
  mainSubRows?: PaceSubRow[];
  subItems?: PaceSubItem[];
  subRows?: PaceSubRow[];
}

export interface PaceDomain {
  id: string;
  title: string;
  subtitle: string;
  columnGroup: 'left' | 'right';
  showBanner?: boolean;
  competencies: PaceCompetency[];
}

export const PACE_LANGUAGE_DOMAINS: PaceDomain[] = [
  // --- LEFT COLUMN DOMAINS ---
  {
    id: 'language-interacting-others-left',
    title: 'Language for Interacting with Others',
    subtitle: 'oracy for literacy',
    columnGroup: 'left',
    showBanner: true,
    competencies: [
      {
        id: 1,
        number: 1,
        description: "Talk about one's personal experiences.",
        hasSubItems: true,
        subItems: [
          {
            id: '1a',
            label: 'a.    oneself',
            subRows: [
              { id: '1a_listening', skill: 'listening' },
              { id: '1a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '1b',
            label: 'b.    school',
            subRows: [
              { id: '1b_listening', skill: 'listening' },
              { id: '1b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '1c',
            label: 'a.    community',
            subRows: [
              { id: '1c_listening', skill: 'listening' },
              { id: '1c_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 2,
        number: 2,
        description: 'Participate in classroom interactions using verbal and non-verbal responses.',
        hasSubItems: true,
        subItems: [
          {
            id: '2a',
            label: "a.    Respond to teacher's instructions",
            subRows: [
              { id: '2a_listening', skill: 'listening' },
              { id: '2a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '2b',
            label: 'b.    Ask and respond to questions',
            subRows: [
              { id: '2b_listening', skill: 'listening' },
              { id: '2b_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 3,
        number: 3,
        description: 'Interact purposely and participate in conversations and discussions, in pairs, in groups, or in whole-class discussions.',
        hasSubItems: true,
        subItems: [
          {
            id: '3a',
            label: 'a.    Make requests',
            subRows: [
              { id: '3a_listening', skill: 'listening' },
              { id: '3a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '3b',
            label: 'b.    Offer information',
            subRows: [
              { id: '3b_listening', skill: 'listening' },
              { id: '3b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '3c',
            label: 'c.    Communicate needs',
            subRows: [
              { id: '3c_listening', skill: 'listening' },
              { id: '3c_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '3d',
            label: 'd.    Clarify information',
            subRows: [
              { id: '3d_listening', skill: 'listening' },
              { id: '3d_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '3e',
            label: 'e.    Seek help',
            subRows: [
              { id: '3e_listening', skill: 'listening' },
              { id: '3e_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '3f',
            label: 'f.    Take part in our take turns in conversation or discussion',
            subRows: [
              { id: '3f_listening', skill: 'listening' },
              { id: '3f_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 4,
        number: 4,
        description: 'Use common and socially acceptable expressions (e.g. greetings, leave-taking).',
        hasSubItems: true,
        subItems: [
          {
            id: '4a',
            label: 'a.    Use simple and appropriate personal greetings',
            subRows: [
              { id: '4a_listening', skill: 'listening' },
              { id: '4a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '4b',
            label: 'b.    Use familiar terms of address',
            subRows: [
              { id: '4b_listening', skill: 'listening' },
              { id: '4b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '4c',
            label: 'c.    Greet and respond appropriately to greetings',
            subRows: [
              { id: '4c_listening', skill: 'listening' },
              { id: '4c_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 5,
        number: 5,
        description: 'Share confidently thoughts, preferences, needs, feelings, and ideas with peers, teacher, and other adults.',
        hasSubItems: false,
        subRows: [
          { id: '5_listening', skill: 'listening' },
          { id: '5_speaking', skill: 'speaking' }
        ]
      }
    ]
  },
  {
    id: 'language-developing-expressing-left',
    title: 'Language for Developing and Expressing Ideas',
    subtitle: 'oracy for literacy',
    columnGroup: 'left',
    showBanner: true,
    competencies: [
      {
        id: 6,
        number: 6,
        description: 'Express ideas using a variety of symbols (e.g. drawings, emojis, scribbles).',
        hasSubItems: true,
        subItems: [
          {
            id: '6a',
            label: 'a.    oneself',
            subRows: [
              { id: '6a_listening', skill: 'listening' },
              { id: '6a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '6b',
            label: 'b.    school',
            subRows: [
              { id: '6b_listening', skill: 'listening' },
              { id: '6b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '6c',
            label: 'a.    community',
            subRows: [
              { id: '6c_listening', skill: 'listening' },
              { id: '6c_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 7,
        number: 7,
        description: 'Use words to represent ideas and events.',
        hasSubItems: true,
        subItems: [
          {
            id: '7a',
            label: 'a.    words that represent people, animals and objects, locations (naming words).',
            subRows: [
              { id: '7a_listening', skill: 'listening' },
              { id: '7a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '7b',
            label: 'b.    words that represent activities and situations (action words)',
            subRows: [
              { id: '7b_listening', skill: 'listening' },
              { id: '7b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '7c',
            label: 'c.    words that represent qualities or attributes (describing words)',
            subRows: [
              { id: '7c_listening', skill: 'listening' },
              { id: '7c_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 8,
        number: 8,
        description: 'Use high-frequency and content-specific words.',
        hasSubItems: true,
        subItems: [
          {
            id: '8a',
            label: 'a.    oneself',
            subRows: [
              { id: '8a_listening', skill: 'listening' },
              { id: '8a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '8b',
            label: 'b.    school',
            subRows: [
              { id: '8b_listening', skill: 'listening' },
              { id: '8b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '8c',
            label: 'a.    community',
            subRows: [
              { id: '8c_listening', skill: 'listening' },
              { id: '8c_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 9,
        number: 9,
        description: 'Use language to express connections between ideas.',
        hasSubItems: true,
        subItems: [
          {
            id: '9a',
            label: 'a.    Express compare and contrast',
            subRows: [
              { id: '9a_listening', skill: 'listening' },
              { id: '9a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '9b',
            label: 'b.    Express cause and effect',
            subRows: [
              { id: '9b_listening', skill: 'listening' },
              { id: '9b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '9c',
            label: 'a.    Use time words to relate ideas',
            subRows: [
              { id: '9c_listening', skill: 'listening' },
              { id: '9c_speaking', skill: 'speaking' }
            ]
          }
        ]
      }
    ]
  },

  // --- RIGHT COLUMN DOMAINS ---
  {
    id: 'language-interacting-others-right',
    title: 'Language for Interacting with Others',
    subtitle: 'oracy for literacy',
    columnGroup: 'right',
    showBanner: false,
    competencies: [
      {
        id: 10,
        number: 10,
        description: 'Participate in and contribute to group oral language activities (e.g. singing, chanting, sabayang bigkas).',
        hasSubItems: false,
        subRows: [
          { id: '10_listening', skill: 'listening' },
          { id: '10_speaking', skill: 'speaking' }
        ]
      }
    ]
  },
  {
    id: 'language-developing-expressing-right',
    title: 'Language for Developing and Expressing Ideas',
    subtitle: 'oracy for literacy',
    columnGroup: 'right',
    showBanner: true,
    competencies: [
      {
        id: 11,
        number: 11,
        description: 'Notice the features (e.g., sounds, intonation, signs) of their first language and other languages in familiar contexts.',
        hasSubItems: false,
        subRows: [
          { id: '11_listening', skill: 'listening' },
          { id: '11_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 12,
        number: 12,
        description: 'Recognize how a change in intonation (volume, pitch) and body language can change the meanings of utterances/expressions.',
        hasSubItems: true,
        subItems: [
          {
            id: '12a',
            label: 'a.    Recognize the difference between statements, questions, commands and exclamations.',
            subRows: [
              { id: '12a_listening', skill: 'listening' },
              { id: '12a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '12b',
            label: 'b.    Respond to change of tones and cues through facial expressions, gestures and actions.',
            subRows: [
              { id: '12b_listening', skill: 'listening' },
              { id: '12b_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 13,
        number: 13,
        description: 'Recognize how language reflects cultural practices and norms.',
        hasSubItems: true,
        subItems: [
          {
            id: '13a',
            label: 'a.    Share about the language(s) spoken at home',
            subRows: [
              { id: '13a_listening', skill: 'listening' },
              { id: '13a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '13b',
            label: 'b.    Share words and phrases in their language',
            subRows: [
              { id: '13b_listening', skill: 'listening' },
              { id: '13b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '13c',
            label: 'c.    Notice how local names of streets, places and landmarks have origins in their language',
            subRows: [
              { id: '13c_listening', skill: 'listening' },
              { id: '13c_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '13d',
            label: 'd.    Explore local terms for food and their origins',
            subRows: [
              { id: '13d_listening', skill: 'listening' },
              { id: '13d_speaking', skill: 'speaking' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'interacting-with-texts-right',
    title: 'Interacting with Texts',
    subtitle: 'discourse',
    columnGroup: 'right',
    showBanner: true,
    competencies: [
      {
        id: 14,
        number: 14,
        description: 'View and listen to a range of texts for enjoyment and interest.',
        hasSubItems: false,
        subRows: [
          { id: '14_listening', skill: 'listening' } // Single row: Listening (Yellow)
        ]
      },
      {
        id: 15,
        number: 15,
        description: 'Recognize icons and symbols in various texts found in familiar contexts (e.g. printed and digital texts, books, magazines, environmental print).',
        hasSubItems: false,
        subRows: [
          { id: '15_speaking', skill: 'speaking' } // Single row: Speaking (Pink)
        ]
      },
      {
        id: 16,
        number: 16,
        description: 'Engage with or respond to a range of texts.',
        hasSubItems: true,
        subItems: [
          {
            id: '16a',
            label: 'a.    View or listen to spoken texts',
            subRows: [
              { id: '16a_listening', skill: 'listening' },
              { id: '16a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '16b',
            label: 'b.    Identify a variety of purposes for viewing and listening to texts',
            subRows: [
              { id: '16b_listening', skill: 'listening' },
              { id: '16b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '16c',
            label: 'c.    Discuss what is interesting or entertaining in a text',
            subRows: [
              { id: '16c_listening', skill: 'listening' },
              { id: '16c_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '16d',
            label: 'd.    Express personal preferences',
            subRows: [
              { id: '16d_listening', skill: 'listening' },
              { id: '16d_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 17,
        number: 17,
        description: 'Give reason/s for choosing books/texts for enjoyment and interest.',
        hasSubItems: false,
        subRows: [
          { id: '17_listening', skill: 'listening' },
          { id: '17_speaking', skill: 'speaking' }
        ]
      }
    ]
  },
  {
    id: 'creating-texts-right',
    title: 'Creating Texts',
    subtitle: 'discourse',
    columnGroup: 'right',
    showBanner: true,
    competencies: [
      {
        id: 18,
        number: 18,
        description: 'Record and report ideas and events using some learnt vocabulary',
        hasSubItems: true,
        mainSubRows: [
          { id: '18_listening', skill: 'listening' },
          { id: '18_speaking', skill: 'speaking' }
        ],
        subItems: [
          {
            id: '18a',
            label: 'a.    Note and report main points',
            subRows: [
              { id: '18a_listening', skill: 'listening' },
              { id: '18a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '18b',
            label: 'b.    Sequence up to key three (3) key events',
            subRows: [
              { id: '18b_listening', skill: 'listening' },
              { id: '18b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '18c',
            label: "c.    Relate ideas or events to one's experience",
            subRows: [
              { id: '18c_listening', skill: 'listening' },
              { id: '18c_speaking', skill: 'speaking' }
            ]
          }
        ]
      },
      {
        id: 19,
        number: 19,
        description: 'Use own words in retelling information from various texts (e.g., legends, fables, and jokes).',
        hasSubItems: false,
        subRows: [
          { id: '19_listening', skill: 'listening' },
          { id: '19_speaking', skill: 'speaking' }
        ]
      },
      {
        id: 20,
        number: 20,
        description: 'Draw and discuss information or ideas from a range of texts (e.g., stories, images).',
        hasSubItems: true,
        subItems: [
          {
            id: '20a',
            label: 'a.    Note and describe main points (e.g., main characters and events)',
            subRows: [
              { id: '20a_listening', skill: 'listening' },
              { id: '20a_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20b',
            label: 'b.    Sequence up to key three (3) key events',
            subRows: [
              { id: '20b_listening', skill: 'listening' },
              { id: '20b_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20c',
            label: "c.    Infer the character's feelings and traits",
            subRows: [
              { id: '20c_listening', skill: 'listening' },
              { id: '20c_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20d',
            label: 'd.    Predict possible endings',
            subRows: [
              { id: '20d_listening', skill: 'listening' },
              { id: '20d_speaking', skill: 'speaking' }
            ]
          },
          {
            id: '20e',
            label: "e.    Relate ideas or events to one's experience",
            subRows: [
              { id: '20e_listening', skill: 'listening' },
              { id: '20e_speaking', skill: 'speaking' }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * Authoritative Master Cell Background Color Dictionary for PACE FORM - Language
 * Directly extracted from PACE FORM - Language.xlsx
 */
export const PACE_LANGUAGE_MASTER_CELL_COLORS: Record<string, { t1: string; t2: string; t3: string }> = {
  "1_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "1a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#B8C0C8" },
  "1a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#B8C0C8" },
  "1b_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "1b_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "1c_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "1c_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },

  "2_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "2a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "2a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "2b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "2b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "3_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "3a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "3a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "3b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "3b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "3c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "3c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "3d_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "3d_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "3e_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "3e_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "3f_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "3f_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "4_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "4a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "4a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "4b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "4b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "4c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "4c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "5_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "5_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "6_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "6a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#B8C0C8" },
  "6a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#B8C0C8" },
  "6b_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "6b_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "6c_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "6c_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },

  "7_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "7a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "7a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "7b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "7b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "7c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "7c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "8_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "8a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#B8C0C8" },
  "8a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#B8C0C8" },
  "8b_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "8b_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },
  "8c_listening": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#FEF2CB" },
  "8c_speaking": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#ECC8EC" },

  "9_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "9a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "9a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "9b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "9b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "9c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "9c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "10_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "10_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "11_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "11_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "12_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "12a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "12a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "12b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "12b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "13_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "13a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "13a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "13b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "13b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "13c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "13c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "13d_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "13d_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "14_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },

  "15_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "16_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "16a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "16a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "16b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "16b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "16c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "16c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "16d_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "16d_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "17_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "17_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "18_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "18_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "18a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "18a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "18b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "18b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "18c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "18c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "19_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "19_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },

  "20_main": { "t1": "#B8C0C8", "t2": "#B8C0C8", "t3": "#B8C0C8" },
  "20a_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20a_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20b_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20b_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20c_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20c_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20d_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20d_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" },
  "20e_listening": { "t1": "#FEF2CB", "t2": "#FEF2CB", "t3": "#FEF2CB" },
  "20e_speaking": { "t1": "#ECC8EC", "t2": "#ECC8EC", "t3": "#ECC8EC" }
};
