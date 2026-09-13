import type { CalendarEvent } from '../types';

export const OFFICIAL_CALENDAR_2026_2027: CalendarEvent[] = [
    // APRIL 2026
    { id: 'apr-1', title: "Start of Teachers' EOSY Break", date: '2026-04-01', type: 'break' },
    { id: 'apr-2', title: 'Maundy Thursday', date: '2026-04-02', type: 'holiday' },
    { id: 'apr-3', title: 'Good Friday', date: '2026-04-03', type: 'holiday' },
    { id: 'apr-4', title: 'Black Saturday', date: '2026-04-04', type: 'holiday' },
    { id: 'apr-9', title: 'The Day of Valor', date: '2026-04-09', type: 'holiday' },
    { id: 'apr-13', title: 'National Schools Press Conference', date: '2026-04-13', end_date: '2026-04-17', type: 'national' },
    { id: 'apr-18', title: 'National Festival of Talents', date: '2026-04-18', end_date: '2026-04-22', type: 'national' },
    { id: 'apr-25', title: '2026 Palarong Pambansa', date: '2026-04-25', end_date: '2026-04-30', type: 'national' },
    
    // MAY 2026
    { id: 'may-1', title: 'Labor Day / End of EOSY Break', date: '2026-05-01', type: 'break' },
    { id: 'may-4-int', title: 'EOSY Intervention Program', date: '2026-05-04', end_date: '2026-05-22', type: 'event' },
    { id: 'may-4-train', title: 'Teachers Training Window', date: '2026-05-04', end_date: '2026-05-29', type: 'meeting' },
    { id: 'may-bal', title: 'Oplan Balik Eskwela', date: '2026-05-25', end_date: '2026-05-29', type: 'event' },

    // JUNE 2026
    { id: 'jun-1', title: 'Brigada Eskwela & Enrollment', date: '2026-06-01', end_date: '2026-06-05', type: 'event' },
    { id: 'jun-8', title: 'Opening of Classes (Term 1)', date: '2026-06-08', type: 'event', description: 'Start of School Year 2026-2027' },
    { id: 'jun-8-orient', title: "Learners and Parents' Orientation", date: '2026-06-08', type: 'event' },
    { id: 'jun-8-health', title: "Start of Learners Health Assessment", date: '2026-06-08', type: 'event' },
    { id: 'jun-8-bosy', title: "Start of Testing Window for BOSY", date: '2026-06-08', type: 'deadline', description: 'CRLA, RMA, Phil-IRI, etc.' },
    { id: 'jun-8-data', title: "Submission of Enrollment Data", date: '2026-06-08', type: 'deadline' },
    { id: 'jun-12', title: 'Independence Day', date: '2026-06-12', type: 'holiday' },
    { id: 'jun-term1', title: 'Term 1 Duration', date: '2026-06-08', end_date: '2026-09-15', type: 'deadline', description: 'TERM 1 Period' },
    { id: 'jun-22', title: 'Phil ECD Checklist for BOSY', date: '2026-06-22', end_date: '2026-06-26', type: 'deadline' },
    { id: 'jun-23', title: "DepEd Anniversary Ceremony", date: '2026-06-23', type: 'event' },
    { id: 'jun-24', title: "DepEd Anniversary Proper", date: '2026-06-24', type: 'event' },

    // JULY 2026
    { id: 'jul-3', title: 'End of Learners Health Assessment', date: '2026-07-03', type: 'deadline' },
    { id: 'jul-6', title: 'Term 1: First Summative Test', date: '2026-07-06', type: 'exam' },
    { id: 'jul-10', title: 'End of BOSY Testing Window', date: '2026-07-10', type: 'deadline' },
    { id: 'jul-mfat', title: 'MFAT', date: '2026-07-13', end_date: '2026-07-17', type: 'event' },
    { id: 'jul-election', title: 'SELG and SSLG Election', date: '2026-07-20', end_date: '2026-07-24', type: 'event' },
    { id: 'jul-28', title: 'Term 1: Second Summative Test', date: '2026-07-28', type: 'exam' },

    // AUGUST 2026
    { id: 'aug-21', title: 'Ninoy Aquino Day', date: '2026-08-21', type: 'holiday' },
    { id: 'aug-28', title: 'Term 1 Examination', date: '2026-08-28', type: 'exam' },
    { id: 'aug-31', title: 'National Heroes Day', date: '2026-08-31', type: 'holiday' },

    // SEPTEMBER 2026
    { id: 'sep-1', title: 'Term 1 Examination', date: '2026-09-01', type: 'exam' },
    { id: 'sep-5', title: 'Start of National Teachers Month', date: '2026-09-05', type: 'event' },
    { id: 'sep-end', title: 'Term 1 End Block', date: '2026-09-02', end_date: '2026-09-15', type: 'event' },
    { id: 'sep-aral', title: 'ARAL, Grading & School Forms', date: '2026-09-02', end_date: '2026-09-08', type: 'meeting', description: 'ARAL Program, Computation of Grades, Accomplishment of School Forms, & Activities' },
    { id: 'sep-pta', title: 'PTA Meeting & Report Cards', date: '2026-09-09', type: 'event' },
    { id: 'sep-inset', title: 'INSET', date: '2026-09-10', end_date: '2026-09-11', type: 'meeting' },
    { id: 'sep-wellness-l', title: 'Wellness Break (Learners)', date: '2026-09-10', end_date: '2026-09-15', type: 'break', description: 'Guided asynchronous learning experiences' },
    { id: 'sep-wellness-t', title: 'Wellness Break (Teachers)', date: '2026-09-14', end_date: '2026-09-15', type: 'break' },
    { id: 'sep-term-end', title: 'End of Term 1', date: '2026-09-15', type: 'deadline' },
    { id: 'sep-term2-start', title: 'Start of Term 2', date: '2026-09-16', type: 'event' },
    { id: 'sep-term2-dur', title: 'Term 2 Duration', date: '2026-09-16', end_date: '2026-12-18', type: 'deadline' },
    { id: 'sep-ncae', title: 'NCAE Testing Window (G10)', date: '2026-09-16', type: 'exam' },
    { id: 'sep-mosy-start', title: 'Start of MOSY Testing Window', date: '2026-09-21', end_date: '2026-09-25', type: 'deadline', description: 'CRLA, RMA, Phil-IRI, etc.' },

    // OCTOBER 2026
    { id: 'oct-5', title: 'World Teachers Day / Culmination', date: '2026-10-05', type: 'event' },
    { id: 'oct-nat', title: 'NAT for Grade 10', date: '2026-10-05', end_date: '2026-10-09', type: 'exam' },
    { id: 'oct-sum1', title: 'Term 2: First Summative Test', date: '2026-10-07', type: 'exam' },
    { id: 'oct-mosy-end', title: 'End of MOSY Testing Window', date: '2026-10-19', end_date: '2026-10-23', type: 'deadline' },
    { id: 'oct-sum2', title: 'Term 2: Second Summative Test', date: '2026-10-29', type: 'exam' },

    // NOVEMBER 2026
    { id: 'nov-1', title: "All Saints' Day", date: '2026-11-01', type: 'holiday' },
    { id: 'nov-2', title: "All Souls' Day", date: '2026-11-02', type: 'holiday' },
    { id: 'nov-pept', title: 'PEPT (Luzon & VisMin Clusters)', date: '2026-11-15', type: 'exam' },
    { id: 'nov-araw', title: 'Araw ng Pagbasa', date: '2026-11-27', type: 'event' },
    { id: 'nov-30', title: 'Bonifacio Day', date: '2026-11-30', type: 'holiday' },

    // DECEMBER 2026
    { id: 'dec-3', title: 'Term 2 Examination', date: '2026-12-03', end_date: '2026-12-04', type: 'exam' },
    { id: 'dec-ncae-end', title: 'End of NCAE Testing Window', date: '2026-12-04', type: 'deadline' },
    { id: 'dec-aral', title: 'ARAL, Grading & School Forms', date: '2026-12-07', end_date: '2026-12-14', type: 'meeting' },
    { id: 'dec-8', title: 'Feast of the Immaculate Conception', date: '2026-12-08', type: 'holiday' },
    { id: 'dec-pta', title: 'PTA Meeting & Report Cards', date: '2026-12-15', type: 'event' },
    { id: 'dec-year-end', title: 'Year-End Activity', date: '2026-12-16', type: 'event' },
    { id: 'dec-inset', title: 'INSET', date: '2026-12-17', end_date: '2026-12-18', type: 'meeting' },
    { id: 'dec-wellness', title: 'Wellness Break (Learners)', date: '2026-12-17', end_date: '2026-12-18', type: 'break' },
    { id: 'dec-18-end', title: 'End of Term 2', date: '2026-12-18', type: 'deadline' },
    { id: 'dec-break', title: 'Year-End / Christmas Break', date: '2026-12-19', end_date: '2026-12-31', type: 'break' },
    { id: 'dec-24', title: 'Christmas Eve', date: '2026-12-24', type: 'holiday' },
    { id: 'dec-25', title: 'Christmas Day', date: '2026-12-25', type: 'holiday' },
    { id: 'dec-30', title: 'Rizal Day', date: '2026-12-30', type: 'holiday' },
    { id: 'dec-31', title: 'Last Day of the Year', date: '2026-12-31', type: 'holiday' },

    // JANUARY 2027
    { id: 'jan-1', title: "New Year's Day", date: '2027-01-01', type: 'holiday' },
    { id: 'jan-term3', title: 'Start of Term 3', date: '2027-01-04', type: 'event' },
    { id: 'jan-term3-dur', title: 'Term 3 Duration', date: '2027-01-04', end_date: '2027-04-08', type: 'deadline' },
    { id: 'jan-sum1', title: 'Term 3: First Summative Test', date: '2027-01-25', type: 'exam' },
    { id: 'jan-early-reg', title: 'Early Registration Start', date: '2027-01-30', type: 'event', description: 'Incoming Kinder, G1, G7, G11, OSCYA, Transferees' },

    // FEBRUARY 2027
    { id: 'feb-eosy', title: 'EOSY Assessments Testing Window', date: '2027-02-01', end_date: '2027-02-05', type: 'deadline' },
    { id: 'feb-6', title: 'Chinese New Year', date: '2027-02-06', type: 'holiday' },
    { id: 'feb-nat12', title: 'NAT for Grade 12', date: '2027-02-15', end_date: '2027-02-19', type: 'exam' },
    { id: 'feb-sum2', title: 'Term 3: Second Summative Test', date: '2027-02-16', type: 'exam' },
    { id: 'feb-early-end', title: 'Early Registration End', date: '2027-02-26', type: 'deadline' },

    // MARCH 2027
    { id: 'mar-ellna', title: 'ELLNA for Grade 3', date: '2027-03-01', end_date: '2027-03-05', type: 'exam' },
    { id: 'mar-nat6', title: 'NAT for Grade 6', date: '2027-03-08', end_date: '2027-03-12', type: 'exam' },
    { id: 'mar-sum-end', title: 'End of Testing Window for EOSY', date: '2027-03-12', type: 'deadline' },
    { id: 'mar-ex-grad', title: 'Term 3 Exam (Graduating Learners)', date: '2027-03-15', end_date: '2027-03-16', type: 'exam' },
    { id: 'mar-ecd-eosy', title: 'Phil ECD Checklist for EOSY', date: '2027-03-15', end_date: '2027-03-19', type: 'deadline' },
    { id: 'mar-delib', title: 'Grading & Deliberation (Graduating)', date: '2027-03-17', end_date: '2027-03-23', type: 'meeting' },
    { id: 'mar-ex-oth', title: 'Term 3 Exam (Other Grades)', date: '2027-03-22', end_date: '2027-03-23', type: 'exam' },
    { id: 'mar-awards', title: 'Excellence Awards (Graduating)', date: '2027-03-24', type: 'event' },
    { id: 'mar-term-block', title: 'End-of-Term Block', date: '2027-03-24', end_date: '2027-03-31', type: 'event' },
    { id: 'mar-25', title: 'Maundy Thursday', date: '2027-03-25', type: 'holiday' },
    { id: 'mar-26', title: 'Good Friday', date: '2027-03-26', type: 'holiday' },
    { id: 'mar-27', title: 'Black Saturday', date: '2027-03-27', type: 'holiday' },

    // APRIL 2027
    { id: 'apr-1-block', title: 'End-of-Term Block', date: '2027-04-01', end_date: '2027-04-08', type: 'event' },
    { id: 'apr-inset', title: 'INSET', date: '2027-04-02', end_date: '2027-04-05', type: 'meeting' },
    { id: 'apr-rites', title: 'EOSY Rites (Graduation)', date: '2027-04-06', end_date: '2027-04-07', type: 'event' },
    { id: 'apr-pta', title: 'PTA Meeting & Report Cards', date: '2027-04-08', type: 'event' },
    { id: 'apr-end-sy', title: 'End of Term 3 / SY 2026-2027', date: '2027-04-08', type: 'deadline' },
    { id: 'apr-9', title: 'The Day of Valor', date: '2027-04-09', type: 'holiday' },
    { id: 'apr-eosy-break', title: "Start of Teachers' EOSY Break", date: '2027-04-09', type: 'break' },
    { id: 'apr-nspc', title: '2027 NSPC', date: '2027-04-19', end_date: '2027-04-23', type: 'national' },
    { id: 'apr-nfot', title: '2027 NFOT', date: '2027-04-26', end_date: '2027-04-30', type: 'national' },

    // MAY 2027
    { id: 'may-1', title: 'Labor Day', date: '2027-05-01', type: 'holiday' },
    { id: 'may-palaro', title: '2027 Palarong Pambansa', date: '2027-05-03', end_date: '2027-05-07', type: 'national' },
    { id: 'may-break-end', title: "End of Teachers' EOSY Break", date: '2027-05-09', type: 'break' },
    { id: 'may-interv', title: 'Start of EOSY Intervention Program', date: '2027-05-10', end_date: '2027-05-14', type: 'event' },
    { id: 'may-train', title: 'Teachers Training Window Start', date: '2027-05-10', end_date: '2027-05-14', type: 'meeting' },
    { id: 'may-oplan', title: 'Oplan Balik Eskwela Start', date: '2027-05-17', type: 'event' },

    // JUNE 2027
    { id: 'jun27-train-end', title: 'End of Training Window', date: '2027-06-01', end_date: '2027-06-04', type: 'deadline' },
    { id: 'jun27-oplan-end', title: 'End of Oplan Balik Eskwela', date: '2027-06-04', type: 'event' },
    { id: 'jun27-brigada', title: 'Brigada Eskwela & Enrollment', date: '2027-06-07', end_date: '2027-06-11', type: 'event' },
];
