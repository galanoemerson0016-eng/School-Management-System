/**
 * Official DepEd Order No. 017, s. 2026 (Strengthened Senior High School Curriculum)
 * Annex F.2: Equivalency Matrix (2016 K-12 SHS vis-a-vis SSHS Curriculum)
 */

import { normalizeElectiveTitle } from './sshsCatalog';

export interface EquivalencyRule {
    k12Subjects: string[]; // Required completed 2016 K-12 subjects
    sshsElectives: string[]; // Corresponding credited SSHS electives
    cluster: string;
    remarks: string;
}

export const SSHS_EQUIVALENCY_MATRIX: EquivalencyRule[] = [
    // =========================================================================
    // Arts, Social Sciences, and Humanities
    // =========================================================================
    {
        k12Subjects: [
            'Creative Industries I: Arts and Design Appreciation and Production',
            'Physical and Personal Development in the Arts'
        ],
        sshsElectives: ['Creative Industries - Visual Arts', 'Art Criticism and Creative Markets'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: [
            'Creative Industries II: Performing Arts',
            'Physical and Personal Development in the Arts'
        ],
        sshsElectives: ['Creative Industries - Music', 'Performance Criticism and Creative Markets'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Creative Writing', 'Creative Nonfiction'],
        sshsElectives: ['Creative Composition 1', 'Creative Composition 2'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: [
            'Developing Filipino Identity in the Arts',
            'Integrating the Elements and Principles of Organization in the Arts',
            'Contemporary Philippine Arts from the Regions'
        ],
        sshsElectives: ['Filipino Identity Through the Arts'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Introduction to Philosophy of the Human Person'],
        sshsElectives: ['Introduction to the Philosophy of the Human Person'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Leadership and Management in Different Arts Fields'],
        sshsElectives: ['Leadership and Management in the Arts'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Filipino sa Piling Larang (Teknikal-Bokasyunal)'],
        sshsElectives: ['Filipino 2 (Filipino sa Larang Teknikal-Propesyonal)'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Filipino sa Piling Larang (Isports)'],
        sshsElectives: ['Filipino 2 (Filipino sa Isports)'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Filipino sa Piling Larang (Sining at Disenyo)'],
        sshsElectives: ['Filipino 2 (Filipino sa Sining at Disenyo)'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Community Engagement, Solidarity and Citizenship'],
        sshsElectives: ['Citizenship and Civic Engagement'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['21st Century Literature from the Philippines and the World'],
        sshsElectives: ['Contemporary Literature 1', 'Contemporary Literature 2'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: [
            'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
            'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik',
            'Filipino sa Piling Larang (Akademik)'
        ],
        sshsElectives: ['Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Malikhaing Pagsulat'],
        sshsElectives: ['Malikhaing Pagsulat'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Philippine Politics and Governance'],
        sshsElectives: ['Philippine Governance (Philippine Politics and Governance)'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: [
            'Disciplines and Ideas in the Applied Social Sciences',
            'Disciplines and Ideas in the Social Sciences'
        ],
        sshsElectives: ['Social Sciences (Theory and Practice)'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Introduction to World Religions and Belief Systems'],
        sshsElectives: ['SSHS Elective: World Religions'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED AS SSHS ELECTIVE'
    },
    {
        k12Subjects: ['Trends, Networks, and Critical Thinking in the 21st Century'],
        sshsElectives: ['SSHS Elective: Trends and Networks'],
        cluster: 'Arts, Social Sciences, and Humanities',
        remarks: 'CREDITED AS SSHS ELECTIVE'
    },

    // =========================================================================
    // Business and Entrepreneurship
    // =========================================================================
    {
        k12Subjects: [
            'Fundamentals of Accountancy, Business, and Management 1',
            'Fundamentals of Accountancy, Business, and Management 2'
        ],
        sshsElectives: ['Business 1 (Basic Accounting)'],
        cluster: 'Business and Entrepreneurship',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: [
            'Organization and Management',
            'Business Ethics and Social Responsibility'
        ],
        sshsElectives: ['Introduction to Organization and Management'],
        cluster: 'Business and Entrepreneurship',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Entrepreneurship'],
        sshsElectives: ['Entrepreneurship'],
        cluster: 'Business and Entrepreneurship',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Business Finance'],
        sshsElectives: ['Business 2 (Business Finance and Income Taxation)'],
        cluster: 'Business and Entrepreneurship',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Applied Economics'],
        sshsElectives: ['Business 3 (Business Economics)'],
        cluster: 'Business and Entrepreneurship',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Principles of Marketing'],
        sshsElectives: ['Contemporary Marketing'],
        cluster: 'Business and Entrepreneurship',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Business Math'],
        sshsElectives: ['SSHS Elective: Business Math'],
        cluster: 'Business and Entrepreneurship',
        remarks: 'CREDITED AS SSHS ELECTIVE'
    },

    // =========================================================================
    // STEM
    // =========================================================================
    {
        k12Subjects: ['General Biology 1', 'General Biology 2'],
        sshsElectives: ['Biology 1', 'Biology 2', 'Biology 3', 'Biology 4'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['General Chemistry 1', 'General Chemistry 2'],
        sshsElectives: ['Chemistry 1', 'Chemistry 2', 'Chemistry 3', 'Chemistry 4'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Earth Science', 'Disaster Readiness and Risk Reduction'],
        sshsElectives: ['Earth and Space Science 1', 'Earth and Space Science 2', 'Earth and Space Science 3', 'Earth and Space Science 4'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['General Physics 1', 'General Physics 2'],
        sshsElectives: ['Physics 1', 'Physics 2', 'Physics 3', 'Physics 4'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Physical Science'],
        sshsElectives: ['Conceptual Physics and Chemistry in Daily Life'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Earth and Life Science'],
        sshsElectives: ['Conceptual Biology and Earth and Space Science'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Empowerment Technologies'],
        sshsElectives: ['Empowerment Technologies'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Pre-Calculus'],
        sshsElectives: ['Pre-Calculus'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Basic Calculus'],
        sshsElectives: ['Basic Calculus'],
        cluster: 'Science, Technology, Engineering, and Mathematics',
        remarks: 'CREDITED'
    },

    // =========================================================================
    // Sports, Health, and Wellness
    // =========================================================================
    {
        k12Subjects: ['Human Movement'],
        sshsElectives: ['Human Movement 1 (Basic Anatomy in Sports and Exercise)'],
        cluster: 'Sports, Health, and Wellness',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Fundamentals of Coaching'],
        sshsElectives: ['Sports Coaching'],
        cluster: 'Sports, Health, and Wellness',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Sports Officiating and Activity Management'],
        sshsElectives: ['Sports Officiating', 'Sports Activity Management'],
        cluster: 'Sports, Health, and Wellness',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Safety and First Aid'],
        sshsElectives: ['First Aid'],
        cluster: 'Sports, Health, and Wellness',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: [
            'Physical Education and Health 1', 'Physical Education and Health 2',
            'Health Optimizing Physical Education 1', 'Health Optimizing Physical Education 2',
            'Health Optimizing Physical Education and Health 1', 'Health Optimizing Physical Education and Health 2',
            'Physical Education 1', 'Physical Education 2'
        ],
        sshsElectives: ['Physical Education 1 (Fitness and Recreation)'],
        cluster: 'Sports, Health, and Wellness',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: [
            'Physical Education and Health 3', 'Physical Education and Health 4',
            'Health Optimizing Physical Education 3', 'Health Optimizing Physical Education 4',
            'Health Optimizing Physical Education and Health 3', 'Health Optimizing Physical Education and Health 4',
            'Physical Education 3', 'Physical Education 4'
        ],
        sshsElectives: ['Physical Education 2 (Sports and Dance)'],
        cluster: 'Sports, Health, and Wellness',
        remarks: 'CREDITED'
    },

    // =========================================================================
    // Field Experience
    // =========================================================================
    {
        k12Subjects: ['Inquiries, Investigations, and Immersion', 'Culminating Activity'],
        sshsElectives: ['Design and Innovation'],
        cluster: 'Field Experience',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Practical Research 1', 'Practical Research 2'],
        sshsElectives: ['Research 1', 'Research 2'],
        cluster: 'Field Experience',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Practicum (In-Campus)'],
        sshsElectives: ['In-Campus Field Exposure for Sports'],
        cluster: 'Field Experience',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Work Immersion'],
        sshsElectives: ['Work Immersion for Academic Track', 'Work Immersion for Tech-Pro Track'],
        cluster: 'Field Experience',
        remarks: 'CREDITED'
    },

    // =========================================================================
    // Tech-Pro Electives (TVL -> Tech-Pro)
    // =========================================================================
    {
        k12Subjects: ['Beauty Care (Nail Care) NC II', 'Beauty/Nail Care NC II'],
        sshsElectives: ['Aesthetic Services (Beauty Care)'],
        cluster: 'Aesthetic, Wellness, and Human Care',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Caregiving NC II'],
        sshsElectives: ['Caregiving (Adult Care)', 'Caregiving (Child Care)'],
        cluster: 'Aesthetic, Wellness, and Human Care',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Hairdressing NC II'],
        sshsElectives: ['Hairdressing Services'],
        cluster: 'Aesthetic, Wellness, and Human Care',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Agricultural Crops Production NC I/II'],
        sshsElectives: ['Agricultural Crops Production'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Aquaculture NC II'],
        sshsElectives: ['Aquaculture'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Fish Capture NC II'],
        sshsElectives: ['Fish Capture Operation'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Food Processing NC II'],
        sshsElectives: ['Food Processing'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Organic Agriculture NC II'],
        sshsElectives: ['Organic Agriculture Production'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Animal Production (Poultry-Chicken) NC II'],
        sshsElectives: ['Poultry Production (Chicken)'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Animal Production (Large Ruminants) NC II', 'Animal Production (Ruminants) NC II'],
        sshsElectives: ['Ruminants Production'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Animal Production (Swine) NC II'],
        sshsElectives: ['Swine Production'],
        cluster: 'Agri-Fishery Business and Food Innovation',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Dressmaking NC II', 'Tailoring NC II'],
        sshsElectives: ['Garments Artisanry'],
        cluster: 'Artisanry and Creative Enterprise',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Handicraft (Non-NC)'],
        sshsElectives: ['Handicrafts (Weaving)'],
        cluster: 'Artisanry and Creative Enterprise',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Driving NC II', 'Automotive Servicing NC I'],
        sshsElectives: ['Driving and Automotive Servicing'],
        cluster: 'Automotive and Small Engine Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Carpentry NC I and NC II'],
        sshsElectives: ['Carpentry'],
        cluster: 'Construction and Building Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Masonry NC II', 'Tile Setting NC II', 'Plumbing NC II'],
        sshsElectives: ['Construction Operation'],
        cluster: 'Construction and Building Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['SMAW NC I and NC II', 'Manual Metal Arc Welding'],
        sshsElectives: ['Manual Metal Arc Welding'],
        cluster: 'Construction and Building Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Technical Drafting NC II'],
        sshsElectives: ['Technical Drafting'],
        cluster: 'Construction and Building Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Animation NC II'],
        sshsElectives: ['Animation'],
        cluster: 'Creative Arts and Design Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Illustration NC II'],
        sshsElectives: ['Illustration'],
        cluster: 'Creative Arts and Design Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Visual Graphic Design NC II', 'Visual Graphic Design NC III'],
        sshsElectives: ['Visual Graphic Design'],
        cluster: 'Creative Arts and Design Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Bread and Pastry Production NC II'],
        sshsElectives: ['Bakery Operations'],
        cluster: 'Hospitality and Tourism',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Events Management Services NC III'],
        sshsElectives: ['Events Management Services'],
        cluster: 'Hospitality and Tourism',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Food and Beverage Services NC II'],
        sshsElectives: ['Food and Beverage Operation'],
        cluster: 'Hospitality and Tourism',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Front Office Services NC II'],
        sshsElectives: ['Hotel Operations (Front Office Services)'],
        cluster: 'Hospitality and Tourism',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Housekeeping NC II'],
        sshsElectives: ['Hotel Operations (Housekeeping Services)'],
        cluster: 'Hospitality and Tourism',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Cookery NC II'],
        sshsElectives: ['Kitchen Operations'],
        cluster: 'Hospitality and Tourism',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Local Tour Guiding NC II', 'Tourism Promotion Services NC II'],
        sshsElectives: ['Tourism Services'],
        cluster: 'Hospitality and Tourism',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Domestic Refrigeration and Air-Conditioning NC II'],
        sshsElectives: ['Domestic Refrigeration and Air-Conditioning Servicing'],
        cluster: 'Industrial Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Electrical Installation and Maintenance NC II'],
        sshsElectives: ['Electrical Installation and Maintenance'],
        cluster: 'Industrial Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Electronic Products Assembly and Servicing NC II'],
        sshsElectives: ['Electronic Products Assembly and Servicing'],
        cluster: 'Industrial Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Commercial Air-Conditioning Installation and Servicing NC III'],
        sshsElectives: ['Commercial Air-Conditioning Installation and Servicing'],
        cluster: 'Industrial Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Broadband Installation NC II'],
        sshsElectives: ['Broadband Installation'],
        cluster: 'ICT Support and Computer Programming Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Computer Programming (Java) NC III'],
        sshsElectives: ['Computer Programming (Java)'],
        cluster: 'ICT Support and Computer Programming Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Computer Programming (.Net Technology) NC III'],
        sshsElectives: ['Computer Programming (.Net Technology)'],
        cluster: 'ICT Support and Computer Programming Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Computer Programming (Oracle Database) NC III'],
        sshsElectives: ['Computer Programming (Oracle Database)'],
        cluster: 'ICT Support and Computer Programming Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Computer System Servicing NC II', 'Computer Systems Servicing NC II'],
        sshsElectives: ['Computer Systems Servicing'],
        cluster: 'ICT Support and Computer Programming Technologies',
        remarks: 'CREDITED'
    },
    {
        k12Subjects: ['Contact Center Services NC II'],
        sshsElectives: ['Contact Center Services'],
        cluster: 'ICT Support and Computer Programming Technologies',
        remarks: 'CREDITED'
    }
];

export interface TransfereeCreditEvaluation {
    completedK12Subjects: string[];
    creditedSshsElectives: string[];
    creditedHours: number;
    recommendedRemainingHours: number;
    recommendedRemainingSubjects: number;
    recommendation: 'Qualified for Grade 12' | 'Requires G11 Subject Completion';
    notes: string[];
}

/**
 * Evaluates subject credits for transferees and Balik-Aral learners (Annex F.1 & F.2).
 */
export function evaluateTransfereeCredits(completedK12Subjects: string[]): TransfereeCreditEvaluation {
    const normalizedCompleted = new Set(completedK12Subjects.map(s => normalizeElectiveTitle(s)));
    const creditedSet = new Set<string>();
    const notes: string[] = [];

    for (const rule of SSHS_EQUIVALENCY_MATRIX) {
        // If single subject rule and learner completed it
        if (rule.k12Subjects.length === 1) {
            const reqNorm = normalizeElectiveTitle(rule.k12Subjects[0]);
            if (normalizedCompleted.has(reqNorm)) {
                rule.sshsElectives.forEach(e => creditedSet.add(e));
            }
        } else {
            // Multi-subject rule: learner must have completed at least one or all depending on type
            const matchedCount = rule.k12Subjects.filter(req => normalizedCompleted.has(normalizeElectiveTitle(req))).length;
            if (matchedCount === rule.k12Subjects.length) {
                rule.sshsElectives.forEach(e => creditedSet.add(e));
            } else if (matchedCount > 0) {
                // Partial match: credit proportionate or first elective
                creditedSet.add(rule.sshsElectives[0]);
                notes.push(`Partial credit granted for ${rule.k12Subjects.join(' + ')} -> ${rule.sshsElectives[0]}`);
            }
        }
    }

    const creditedList = Array.from(creditedSet);
    // Approximate hours (each academic elective = 80h, Tech-Pro = 320h)
    let creditedHours = 0;
    for (const elective of creditedList) {
        const norm = normalizeElectiveTitle(elective);
        if (norm.includes('techpro') || norm.includes('caregiving') || norm.includes('automotive') || norm.includes('culinary') || norm.includes('tourism') || norm.includes('welding') || norm.includes('electrical')) {
            creditedHours += 320;
        } else {
            creditedHours += 80;
        }
    }

    // Annex F: Grade 12 completion requires at least 960 hours of Electives
    const requiredGrade12ElectiveHours = 960;
    const remainingHours = Math.max(0, requiredGrade12ElectiveHours - creditedHours);
    const remainingSubjects = Math.ceil(remainingHours / 80);

    const qualifiedForG12 = completedK12Subjects.length >= 6 || creditedHours >= 240;

    return {
        completedK12Subjects,
        creditedSshsElectives: creditedList,
        creditedHours,
        recommendedRemainingHours: remainingHours,
        recommendedRemainingSubjects: remainingSubjects,
        recommendation: qualifiedForG12 ? 'Qualified for Grade 12' : 'Requires G11 Subject Completion',
        notes
    };
}
