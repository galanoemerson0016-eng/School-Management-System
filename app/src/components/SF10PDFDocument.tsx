import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
	page: {
		padding: 12,
		fontSize: 8,
		fontFamily: 'Helvetica',
		lineHeight: 1.1,
	},
	pageBreak: {
		pageBreakAfter: 'always',
	},
	header: {
		textAlign: 'center',
		marginBottom: 8,
		borderBottom: '2px solid #000',
		paddingBottom: 4,
	},
	headerText: {
		fontSize: 10,
		fontWeight: 'bold',
	},
	headerSubtext: {
		fontSize: 8,
		marginTop: 2,
	},
	formCode: {
		fontSize: 9,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	section: {
		marginBottom: 8,
		paddingBottom: 4,
		borderBottom: '1px solid #ccc',
	},
	sectionTitle: {
		fontSize: 9,
		fontWeight: 'bold',
		backgroundColor: '#e6e6e6',
		padding: 2,
		marginBottom: 4,
	},
	row: {
		flexDirection: 'row',
		marginBottom: 3,
		gap: 4,
	},
	rowItem: {
		flex: 1,
	},
	label: {
		fontWeight: 'bold',
		fontSize: 8,
	},
	value: {
		fontSize: 8,
		borderBottom: '1px solid #000',
		minHeight: 14,
		paddingBottom: 1,
	},
	table: {
		width: '100%',
		borderCollapse: 'collapse',
		marginBottom: 4,
	},
	tableHeader: {
		backgroundColor: '#DDD9C4',
		fontWeight: 'bold',
		fontSize: 8,
		padding: 2,
		borderWidth: 1,
		borderColor: '#000',
	},
	tableCell: {
		padding: 2,
		borderWidth: 1,
		borderColor: '#000',
		fontSize: 8,
	},
	tableCellCenter: {
		padding: 2,
		borderWidth: 1,
		borderColor: '#000',
		fontSize: 8,
		textAlign: 'center',
	},
	quarterRow: {
		flexDirection: 'row',
		gap: 2,
	},
	quarterCell: {
		width: '25%',
		borderWidth: 1,
		borderColor: '#000',
		padding: 1,
		textAlign: 'center',
		fontSize: 7,
	},
	twoColumn: {
		flexDirection: 'row',
		gap: 4,
	},
	column: {
		flex: 1,
	},
	signature: {
		marginTop: 10,
		gap: 2,
	},
	signatureLine: {
		borderBottom: '1px solid #000',
		height: 14,
	},
	signatureLabel: {
		fontSize: 7,
		textAlign: 'center',
		fontWeight: 'bold',
	},
});

interface SF10StudentRecord {
	learner?: {
		firstName?: string;
		lastName?: string;
		middleName?: string;
		nameExtension?: string;
		lrn?: string;
		birthdate?: string;
		sex?: string;
	};
	eligibility?: {
		elementaryCompleter?: boolean;
		generalAverage?: string | number;
		elementarySchoolName?: string;
		elementarySchoolId?: string;
		pept?: { checked?: boolean; rating?: string; examDate?: string };
		als?: { checked?: boolean; rating?: string };
	};
	scholasticRecords?: Array<{
		schoolName?: string;
		schoolId?: string;
		district?: string;
		gradeLevel?: string;
		section?: string;
		schoolYear?: string;
		adviser?: string;
		subjects?: Record<string, { q1?: number | string; q2?: number | string; q3?: number | string; q4?: number | string; final?: number | string }>;
	}>;
}

interface SF10PDFDocumentProps {
	studentsData: SF10StudentRecord[];
}

const format = (value: unknown): string => {
	if (value === null || value === undefined) return '';
	if (typeof value === 'string' || typeof value === 'number') return String(value);
	return '';
};

const LEARNING_AREAS = [
	'Filipino',
	'English',
	'Mathematics',
	'Science',
	'Araling Panlipunan',
	'Edukasyon sa Pagpapakatao',
	'Technology and Livelihood',
	'Music',
	'Arts',
	'Physical Education',
	'Health',
];

const renderSchoolRecordSection = (record: NonNullable<SF10StudentRecord['scholasticRecords']>[number] | undefined) => {
	if (!record) return null;
	const subjects = record.subjects || {};
	const hasLegacyQ4 = LEARNING_AREAS.some((area) => {
		const subjectData = subjects[area] as { q4?: number | string } | undefined;
		return Number(subjectData?.q4 || 0) > 0;
	});

	return (
		<>
			<View style={styles.section}>
				<View style={styles.sectionTitle}>
					<Text>SCHOLASTIC RECORD - SCHOOL YEAR {record.schoolYear || '___________'}</Text>
				</View>

				<View style={styles.row}>
					<View style={styles.twoColumn}>
						<View style={styles.column}>
							<Text style={styles.label}>School:</Text>
							<View style={styles.value}>
								<Text>{format(record.schoolName)}</Text>
							</View>
						</View>
						<View style={styles.column}>
							<Text style={styles.label}>District:</Text>
							<View style={styles.value}>
								<Text>{format(record.district)}</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={styles.row}>
					<View style={styles.twoColumn}>
						<View style={styles.column}>
							<Text style={styles.label}>Grade Level:</Text>
							<View style={styles.value}>
								<Text>{format(record.gradeLevel)}</Text>
							</View>
						</View>
						<View style={styles.column}>
							<Text style={styles.label}>Section:</Text>
							<View style={styles.value}>
								<Text>{format(record.section)}</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Text>LEARNING AREAS AND TERM RATINGS</Text>
					</View>

					<View style={{ marginBottom: 4 }}>
						<View style={{ flexDirection: 'row', marginBottom: 2 }}>
							<Text style={{ flex: 3, fontWeight: 'bold', fontSize: 8 }}>Learning Area</Text>
							<Text style={{ flex: 1, fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>T1</Text>
							<Text style={{ flex: 1, fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>T2</Text>
							<Text style={{ flex: 1, fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>T3</Text>
							{hasLegacyQ4 && <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>Legacy Q4</Text>}
							<Text style={{ flex: 1, fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>Final</Text>
						</View>

						{LEARNING_AREAS.map((area) => {
							const subjectData = subjects[area] as { q1?: number | string; q2?: number | string; q3?: number | string; q4?: number | string; final?: number | string };
							return (
								<View key={area} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
									<Text style={{ flex: 3, padding: 2, fontSize: 8 }}>{area}</Text>
									<Text style={{ ...styles.tableCellCenter, flex: 1 }}>{format(subjectData?.q1)}</Text>
									<Text style={{ ...styles.tableCellCenter, flex: 1 }}>{format(subjectData?.q2)}</Text>
									<Text style={{ ...styles.tableCellCenter, flex: 1 }}>{format(subjectData?.q3)}</Text>
									{hasLegacyQ4 && <Text style={{ ...styles.tableCellCenter, flex: 1 }}>{format(subjectData?.q4)}</Text>}
									<Text style={{ ...styles.tableCellCenter, flex: 1 }}>{format(subjectData?.final)}</Text>
								</View>
							);
						})}
					</View>
				</View>
			</View>
		</>
	);
};

export const SF10PDFDocument = ({ studentsData }: SF10PDFDocumentProps) => {
	return (
		<Document>
			{studentsData.map((data, idx) => {
				const learner = data.learner || {};
				const eligibility = data.eligibility || {};
				const records = data.scholasticRecords || [];

				const fullName = `${format(learner.lastName)}, ${format(learner.firstName)} ${format(learner.middleName)}`.replace(/\s+/g, ' ').trim();

				return (
					<React.Fragment key={idx}>
						<Page size={[612, 936]} style={styles.page}>
							<View style={styles.header}>
								<Text style={styles.headerText}>REPUBLIC OF THE PHILIPPINES</Text>
								<Text style={styles.headerText}>DEPARTMENT OF EDUCATION</Text>
								<Text style={styles.headerSubtext}>LEARNER PERMANENT ACADEMIC RECORD</Text>
								<Text style={styles.headerSubtext}>(Formerly Form 137)</Text>
								<Text style={styles.formCode}>SF10-JHS</Text>
							</View>

							<View style={styles.section}>
								<Text style={styles.sectionTitle}>LEARNER'S INFORMATION</Text>

								<View style={styles.row}>
									<View style={styles.rowItem}>
										<Text style={styles.label}>LAST NAME:</Text>
										<View style={styles.value}>
											<Text>{format(learner.lastName)}</Text>
										</View>
									</View>
									<View style={styles.rowItem}>
										<Text style={styles.label}>FIRST NAME:</Text>
										<View style={styles.value}>
											<Text>{format(learner.firstName)}</Text>
										</View>
									</View>
								</View>

								<View style={styles.row}>
									<View style={styles.rowItem}>
										<Text style={styles.label}>LRN:</Text>
										<View style={styles.value}>
											<Text>{format(learner.lrn)}</Text>
										</View>
									</View>
									<View style={styles.rowItem}>
										<Text style={styles.label}>BIRTHDATE:</Text>
										<View style={styles.value}>
											<Text>{format(learner.birthdate)}</Text>
										</View>
									</View>
								</View>
							</View>

							<View style={styles.section}>
								<Text style={styles.sectionTitle}>ELIGIBILITY FOR JUNIOR HIGH SCHOOL</Text>

								<View style={styles.row}>
									<View style={styles.rowItem}>
										<Text style={styles.label}>Elementary Completion:</Text>
										<View style={styles.value}>
											<Text>{eligibility.elementaryCompleter ? '✓' : ''}</Text>
										</View>
									</View>
									<View style={styles.rowItem}>
										<Text style={styles.label}>General Average:</Text>
										<View style={styles.value}>
											<Text>{format(eligibility.generalAverage)}</Text>
										</View>
									</View>
								</View>

								<View style={styles.row}>
									<View style={styles.rowItem}>
										<Text style={styles.label}>Elementary School:</Text>
										<View style={styles.value}>
											<Text>{format(eligibility.elementarySchoolName)}</Text>
										</View>
									</View>
									<View style={styles.rowItem}>
										<Text style={styles.label}>School ID:</Text>
										<View style={styles.value}>
											<Text>{format(eligibility.elementarySchoolId)}</Text>
										</View>
									</View>
								</View>
							</View>

							{renderSchoolRecordSection(records[0])}
						</Page>

						{records.length > 1 && (
							<Page size={[612, 936]} style={styles.page}>
								<View style={styles.header}>
									<Text style={styles.headerText}>CONTINUED - SF10-JHS RECORD</Text>
									<Text style={styles.headerSubtext}>{fullName}</Text>
								</View>

								{records.slice(1).map((record, recordIdx) => (
									<View key={recordIdx}>{renderSchoolRecordSection(record)}</View>
								))}

								<View style={styles.signature}>
									<View style={styles.signatureLine} />
									<Text style={styles.signatureLabel}>School Principal</Text>
									<View style={styles.signatureLine} />
									<Text style={styles.signatureLabel}>Class Adviser</Text>
								</View>
							</Page>
						)}
					</React.Fragment>
				);
			})}
		</Document>
	);
};

export default SF10PDFDocument;
