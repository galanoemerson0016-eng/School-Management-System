import { describe, expect, it } from 'vitest';
import { parseEnrollmentTemplate } from './enrollment-template';

describe('parseEnrollmentTemplate', () => {
  it('continues to import supported CSV enrollment templates', async () => {
    const file = new File([
      'LRN,LAST NAME,FIRST NAME,MIDDLE NAME,NAME EXTENSION,GENDER\n999900000001,Doe,Jane,Quinn,,Female',
    ], 'students.csv', { type: 'text/csv' });

    await expect(parseEnrollmentTemplate(file)).resolves.toEqual([
      expect.objectContaining({
        lrn: '999900000001',
        last_name: 'DOE',
        first_name: 'JANE',
        middle_name: 'QUINN',
        name_extension: '',
        gender: 'Female',
      }),
    ]);
  });
});
