import { describe, expect, it } from 'vitest';
import { parseSF1 } from './sf1-parser';

const csvRow = (values: Record<number, string | number>): string => {
  const row = Array.from({ length: 37 }, () => '');
  for (const [index, value] of Object.entries(values)) row[Number(index)] = String(value);
  return row.map((value) => (value.includes(',') ? `"${value}"` : value)).join(',');
};

describe('parseSF1', () => {
  it('continues to import supported CSV SF1 files', async () => {
    const csv = [
      csvRow({ 0: 'LRN', 2: 'Learner Name', 7: 'Birthdate', 9: 'Age' }),
      csvRow({
        0: '999900000001',
        2: 'DOE, JANE QUINN',
        7: '05/15/2012',
        9: 13,
        11: 'Ilocano',
        12: 'YES',
        14: 'Roman Catholic',
        17: '12',
        18: 'Rizal Street',
        20: 'Poblacion',
        21: 'Bacarra',
        22: 'Ilocos Norte',
      }),
    ].join('\n');
    const file = new File([csv], 'sf1.csv', { type: 'text/csv' });

    await expect(parseSF1(file)).resolves.toEqual([
      expect.objectContaining({
        lrn: '999900000001',
        last_name: 'DOE',
        first_name: 'JANE',
        middle_name: 'QUINN',
        gender: 'Male',
        birthday: '2012-05-15',
        age: 13,
        address: '12, Rizal Street, Poblacion, Bacarra, Ilocos Norte',
        mother_tongue: 'Ilocano',
        is_ip: true,
      }),
    ]);
  });
});
