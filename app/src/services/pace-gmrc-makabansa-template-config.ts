/**
 * Authoritative PACE FORM - GMRC & MAKABANSA Structure (Grade 1 Only)
 * Extracted directly from DepEd PACE FORM - GMRC & MAKABANSA.xlsx
 */

export interface PaceGmrcSubItem {
  id: string;
  label: string;
}

export interface PaceGmrcCompetency {
  id: string;
  number: number;
  valueFocus?: string; // Nililinang na Pagpapahalaga (GMRC Only)
  description: string;
  hasSubItems: boolean;
  subItems?: PaceGmrcSubItem[];
}

export interface PaceGmrcTermSection {
  id: string;
  termTitle: string; // e.g. "Term 1", "Term 2", "Term 3"
  competencies: PaceGmrcCompetency[];
}

export interface PaceGmrcSubjectSection {
  id: string;
  subjectTitle: string; // "GOOD MANNERS AND RIGHT CONDUCT (GMRC)" or "MAKABANSA"
  terms: PaceGmrcTermSection[];
}

export const PACE_GMRC_MAKABANSA_SUBJECTS: PaceGmrcSubjectSection[] = [
  // --- GOOD MANNERS AND RIGHT CONDUCT (GMRC) ---
  {
    id: 'gmrc-subject',
    subjectTitle: 'GOOD MANNERS AND RIGHT CONDUCT (GMRC)',
    terms: [
      {
        id: 'gmrc-term-1',
        termTitle: 'Term 1',
        competencies: [
          {
            id: 'gmrc1_1',
            number: 1,
            valueFocus: 'Tiwala sa Sarili (Self-Confidence)',
            description: 'Naipapakita ang tiwala sa sarili sa pamamagitan ng paggamit ng mga batayang impormasyon sa mga angkop na sitwasyon.',
            hasSubItems: false
          },
          {
            id: 'gmrc1_2',
            number: 2,
            valueFocus: 'Pagiging Totoo (Sincerity)',
            description: 'Naipapakita ang pagiging totoo sa pamamagitan ng mabuting pakikipag-ugnayan sa kapwa.',
            hasSubItems: false
          },
          {
            id: 'gmrc1_3',
            number: 3,
            valueFocus: 'Tiyaga (Perseverance)',
            description: 'Naipapakita ang pagiging matiyaga sa pamamagitan ng palagiang pagtatabi ng mga naipong pera sa alkansiya o mga gamit sa lagayan.',
            hasSubItems: false
          },
          {
            id: 'gmrc1_4',
            number: 4,
            valueFocus: 'Madasalin (Prayerful)',
            description: 'Naipapakita ang pagiging madasalin sa pamamagitan ng wastong kilos at salita sa pananalangin.',
            hasSubItems: false
          },
          {
            id: 'gmrc1_5',
            number: 5,
            valueFocus: 'Mapagpasalamat (Gratitude)',
            description: 'Naipapakita ang pagiging mapagpasalamat sa pamamagitan ng pag-iingat ng mga yamang mula sa kapaligiran.',
            hasSubItems: false
          },
          {
            id: 'gmrc1_6',
            number: 6,
            valueFocus: 'Magalang (Respectful)',
            description: 'Naipapakita ang pagiging magalang sa pamamagitan ng mga angkop na kilos na nagbibigay-halaga sa mga karapatang tinatamasa bilang bata.',
            hasSubItems: false
          },
          {
            id: 'gmrc1_7',
            number: 7,
            valueFocus: 'Kalinisan (Cleanliness)',
            description: 'Naipapakita ang kalinisan sa pamamagitan ng palagiang pagsunod sa mga alituntunin sa paglilinis ng katawan ayon sa gabay ng pamilya, tagapangalaga o nakatatanda.',
            hasSubItems: false
          }
        ]
      },
      {
        id: 'gmrc-term-2',
        termTitle: 'Term 2',
        competencies: [
          {
            id: 'gmrc2_1',
            number: 1,
            valueFocus: 'Magalang (Respectful)',
            description: 'Naipapakita ang pagiging magalang sa pamamagitan ng wastong pagtugon sa mensahe ng kapwa.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_2',
            number: 2,
            valueFocus: 'Responsible (Responsible)',
            description: 'Naipapakita ang pagiging responsible sa pamamagitan ng pakikiisa sa mga munting gawain sa pamayanan ayon sa sariling kakayahan.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_3',
            number: 3,
            valueFocus: 'Matulungin (Helpful)',
            description: 'Naipapakita ang pagiging matulungin sa pamamagitan ng pagtulong sa mga gawain ng pamilya sa tahanan ayon sa kakayahan.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_4',
            number: 4,
            valueFocus: 'Matulungin (Helpful)',
            description: 'Naipapakita ang pagiging matulungin sa nakatatanda sa pamamagitan ng mga gawaing makatutulong at makapagbibigay-ginhawa sa kanila nang may pagsasaalang-alang sa ligtas na paraan.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_5',
            number: 5,
            valueFocus: 'Madasalin (Prayerful)',
            description: 'Naipapakita ang pagiging madasalin sa pamamagitan ng pakikilahok sa pananalangin ng pamilya.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_6',
            number: 6,
            valueFocus: 'Kalinisan (Cleanliness)',
            description: 'Naipapakita ang kalinisan sa pamamagitan ng pakikibahagi sa mga gawain ng pangangalaga sa kapaligiran.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_7',
            number: 7,
            valueFocus: 'Masunurin (Obedient)',
            description: 'Naipapakita ang pagiging masunurin sa pamamagitan ng pagtalima sa mga mabuting gawi ng pamilyang Pilipino.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_8',
            number: 8,
            valueFocus: 'Tiwala sa Sarili (Self-Confidence)',
            description: 'Naipapakita ang tiwala sa sarili sa pamamagitan ng pagsasagawa ng mga gawain na nakabubuti sa sarili at sa kapwa bilang bahagi ng tagubilin ng pamilya.',
            hasSubItems: false
          },
          {
            id: 'gmrc2_9',
            number: 9,
            valueFocus: 'Mapagbigay (Generosity)',
            description: 'Naipapakita ang pagiging mapagbigay sa pamamagitan ng kusang-loob na pagbabahagi ng anumang mayroon siya.',
            hasSubItems: false
          }
        ]
      },
      {
        id: 'gmrc-term-3',
        termTitle: 'Term 3',
        competencies: [
          {
            id: 'gmrc3_1',
            number: 1,
            valueFocus: 'Magalang (Respectful)',
            description: 'Naipapakita ang pagiging magalang sa pamamagitan ng pagtalima sa mga tagubilin at alituntunin ng pook-dalanginan.',
            hasSubItems: false
          },
          {
            id: 'gmrc3_2',
            number: 2,
            valueFocus: 'Kalinisan (Cleanliness)',
            description: 'Naipapakita ang kalinisan sa pamamagitan ng palagiang pagpapaalala sa kapwa bata ng wastong pagpapanatili ng kaayusan at kalinisan ng kapaligiran.',
            hasSubItems: false
          },
          {
            id: 'gmrc3_3',
            number: 3,
            valueFocus: 'Mapagmalasakit (Compassion)',
            description: 'Naipapakita ang pagiging mapagbigay sa pamamagitan ng kusang-loob na pagbabahagi ng anumang mayroon siya.',
            hasSubItems: false
          },
          {
            id: 'gmrc3_4',
            number: 4,
            valueFocus: 'Mapagbigay (Generosity)',
            description: 'Naipapakita ang pagiging mapagbigay sa pamamagitan ng kusang-loob na pagbabahagi ng anumang mayroon siya.',
            hasSubItems: false
          },
          {
            id: 'gmrc3_5',
            number: 5,
            valueFocus: 'Mabuting Mamamayan (Good Citizenship)',
            description: 'Nakapagsasanay ng pagiging mabuting mamamayan sa pamamagitan ng kusang-loob na pagtulong sa pamilya sa mga gawaing pampamayanan.',
            hasSubItems: false
          },
          {
            id: 'gmrc3_6',
            number: 6,
            valueFocus: 'Magalang (Respectful)',
            description: "Nakapagsasanay ng pagiging magalang sa pamamagitan ng angkop na kilos sa iba't ibang gawaing panrelihiyon o paniniwala sa pamayanan.",
            hasSubItems: false
          },
          {
            id: 'gmrc3_7',
            number: 7,
            valueFocus: 'Mapagmalasakit (Compassion)',
            description: 'Naipapakita ang pagiging mapagmalasakit sa pamamagitan ng panghihikayat sa kapwa na makiisa sa mga simpleng gawain ng pangangalaga ng kapaligiran.',
            hasSubItems: false
          },
          {
            id: 'gmrc3_8',
            number: 8,
            valueFocus: 'Pagmamahal sa Bayan (Love of Country)',
            description: 'Naipapakita ang pagiging makabansa sa pamamagitan ng palagiang pagsunod sa mga panuntunan para sa mga sagisag ng bayan.',
            hasSubItems: false
          }
        ]
      }
    ]
  },

  // --- MAKABANSA ---
  {
    id: 'makabansa-subject',
    subjectTitle: 'MAKABANSA',
    terms: [
      {
        id: 'makabansa-term-1',
        termTitle: 'Term 1',
        competencies: [
          {
            id: 'makabansa1_1',
            number: 1,
            description: "Nailalarawan na ang bawat tao ay may iba't-ibang:",
            hasSubItems: true,
            subItems: [
              { id: 'makabansa1_1a', label: 'a.   Katangiang Pisikal' },
              { id: 'makabansa1_1b', label: 'b.   Pangangailangan' },
              { id: 'makabansa1_1c', label: 'c.   Interes at Kakayahan' }
            ]
          },
          {
            id: 'makabansa1_2',
            number: 2,
            description: 'Naipapaliwanag ang karapatan at tungkulin ng bawat bata.',
            hasSubItems: false
          },
          {
            id: 'makabansa1_3',
            number: 3,
            description: 'Napahahalagan ang indibidwalidad at tungkulin ng bawat tao.',
            hasSubItems: false
          }
        ]
      },
      {
        id: 'makabansa-term-2',
        termTitle: 'Term 2',
        competencies: [
          {
            id: 'makabansa2_1',
            number: 1,
            description: 'Naipapaliwanag ang konsepto ng pamilya batay sa bumubuo nito tulad ng two-parent, solo parent, extended family at iba pa.',
            hasSubItems: false
          },
          {
            id: 'makabansa2_2',
            number: 2,
            description: 'Naipaliliwanag ang papel at tungkulin ng mga kasapi ng pamilya.',
            hasSubItems: false
          },
          {
            id: 'makabansa2_3',
            number: 3,
            description: 'Napahahalagan ang papel at tungkulin ng mga kasapi ng pamilya.',
            hasSubItems: false
          }
        ]
      },
      {
        id: 'makabansa-term-3',
        termTitle: 'Term 3',
        competencies: [
          {
            id: 'makabansa3_1',
            number: 1,
            description: 'Nailalahad ang mga batayang impormasyon tulad ng pangalan, pinagmulan, laki at lawak, kinaroroonan, at kwento ng sariling paaralan.',
            hasSubItems: false
          },
          {
            id: 'makabansa3_2',
            number: 2,
            description: 'Naipaliliwanag ang tungkulin ng mga taong bumubuo sa paaralan tulad ng punong-guro, guro, doctor nars, dyanitor, mag-aaral at iba pa.',
            hasSubItems: false
          },
          {
            id: 'makabansa3_3',
            number: 3,
            description: 'Natutukoy ang kahalagahan ng mga palatandaan at estruktura mula sa tahanan patungo sa paaralan.',
            hasSubItems: false
          },
          {
            id: 'makabansa3_4',
            number: 4,
            description: 'Napahahalagahan ang sariling paaralan bilang bahagi ng pamayanan.',
            hasSubItems: false
          },
          {
            id: 'makabansa3_5',
            number: 5,
            description: 'Natutukoy ang iba pang kasapi ng pamayanan na umaagapay sa pamilya at paaralan.',
            hasSubItems: false
          },
          {
            id: 'makabansa3_6',
            number: 6,
            description: 'Naipaliliwanag ang papel ng mga kasapi ng kinabibilangang pamayanan.',
            hasSubItems: false
          },
          {
            id: 'makabansa3_7',
            number: 7,
            description: 'Napahahalagahan ang papel ng mga kasapi ng kinabibilangang pamayanan.',
            hasSubItems: false
          }
        ]
      }
    ]
  }
];
