const { test } = require('node:test');
const assert = require('node:assert/strict');
const { processInvoice, validateCheckout, generateSerial } = require('./payment-service');

function database() {
  const order = { status: 'pending_payment', payment_method: 'Xendit', xendit_invoice_id: 'invoice-1', amount: 399, platform: 'windows', name: 'Synthetic Customer' };
  const records = new Map([['artifacts/g7-special/admin/data/purchase_requests/req_test', order]]);
  let tail = Promise.resolve();
  return {
    records,
    failCommit: false,
    collection: path => ({ doc: id => `${path}/${id}` }),
    runTransaction(callback) {
      const result = tail.then(async () => {
        const staged = new Map(records);
        const response = await callback({
          get: async ref => ({ exists: staged.has(ref), data: () => staged.get(ref) }),
          create: (ref, data) => { assert.equal(staged.has(ref), false); staged.set(ref, data); },
          update: (ref, data) => staged.set(ref, { ...staged.get(ref), ...data }),
        });
        if (this.failCommit) throw new Error('synthetic commit failure');
        records.clear();
        for (const [key, value] of staged) records.set(key, value);
        return response;
      });
      tail = result.catch(() => undefined);
      return result;
    },
  };
}
const paid = { external_id: 'req_test', id: 'invoice-1', status: 'PAID', amount: 399, paid_amount: 399, currency: 'PHP' };

test('concurrent duplicate callbacks issue one license', async () => {
  const db = database();
  const results = await Promise.all(Array.from({ length: 5 }, () => processInvoice(db, paid)));
  assert.ok(results.every(result => result.status === 200));
  assert.equal(db.records.size, 2);
  assert.equal(db.records.get('artifacts/g7-special/admin/data/purchase_requests/req_test').status, 'approved');
});
test('failed commit leaves no license or approved order', async () => {
  const db = database(); db.failCommit = true;
  await assert.rejects(processInvoice(db, paid));
  assert.equal(db.records.size, 1);
  assert.equal(db.records.values().next().value.status, 'pending_payment');
});
test('rejects mismatched invoices, amounts and currencies', async () => {
  for (const mismatch of [{ id: 'wrong' }, { amount: 1 }, { paid_amount: 1 }, { currency: 'USD' }, { amount: '399' }]) {
    const db = database();
    assert.equal((await processInvoice(db, { ...paid, ...mismatch })).status, 400);
    assert.equal(db.records.size, 1);
  }
});
test('late expiry cannot reverse a paid order', async () => {
  const db = database();
  await processInvoice(db, paid);
  await processInvoice(db, { ...paid, status: 'EXPIRED' });
  assert.equal(db.records.values().next().value.status, 'approved');
});
test('validates untrusted checkout types and missing webhook bodies', async () => {
  for (const body of [null, {}, { name: [], email: {}, platform: true }, { name: 'A', email: 'invalid', platform: 'mac' }]) assert.throws(() => validateCheckout(body));
  assert.deepEqual(validateCheckout({ name: ' A ', email: 'A@Example.test ', platform: ' MAC ' }), { name: 'A', email: 'a@example.test', platform: 'mac' });
  assert.equal((await processInvoice(database(), null)).status, 400);
  assert.match(generateSerial(), /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/);
});
