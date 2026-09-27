const { randomInt, randomUUID } = require('node:crypto');

function generateSerial() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join('')).join('-');
}

function validateCheckout(body) {
  const { name, email, platform } = body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 200 ||
      typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof platform !== 'string' || !['windows', 'mac'].includes(platform.trim().toLowerCase())) {
    throw new Error('Enter a valid name, email address, and platform.');
  }
  return { name: name.trim(), email: email.trim().toLowerCase(), platform: platform.trim().toLowerCase() };
}

async function processInvoice(db, payload) {
  if (!payload || typeof payload.external_id !== 'string' || !/^[\w-]{1,160}$/.test(payload.external_id)) {
    return { status: 400, message: 'Invalid order reference' };
  }
  const requestRef = db.collection('artifacts/g7-special/admin/data/purchase_requests').doc(payload.external_id);
  // The order and license must commit together. Firestore retries this callback
  // if a concurrent webhook changes the order, making repeats idempotent.
  return db.runTransaction(async transaction => {
    const requestDoc = await transaction.get(requestRef);
    if (!requestDoc.exists) return { status: 404, message: 'Order request not found' };
    const order = requestDoc.data();
    if (['approved', 'declined', 'paid'].includes(order.status)) return { status: 200, message: 'Order already processed' };
    if (order.payment_method !== 'Xendit' || !order.xendit_invoice_id || payload.id !== order.xendit_invoice_id) {
      return { status: 400, message: 'Invoice does not match order' };
    }
    if (payload.status === 'PAID') {
      if (!Number.isFinite(payload.amount) || payload.amount !== order.amount ||
          (payload.paid_amount !== undefined && (!Number.isFinite(payload.paid_amount) || payload.paid_amount < order.amount)) ||
          (payload.currency !== undefined && payload.currency !== 'PHP')) {
        return { status: 400, message: 'Payment amount or currency does not match order' };
      }
      const serial = generateSerial();
      transaction.create(db.collection('artifacts/g7-special/public/data/licenses').doc(serial), {
        serial, platform: order.platform, status: 'pending', machine_id: '',
        activated_at: null, expires_at: null, registered_to: order.name,
        created_at: new Date().toISOString(), duration_months: 12,
      });
      transaction.update(requestRef, {
        status: 'approved', license_key: serial, approved_at: new Date().toISOString(),
        paid_amount: payload.paid_amount ?? payload.amount,
        payment_method_channel: typeof payload.payment_method === 'string' ? payload.payment_method : '',
        xendit_payment_id: payload.id,
      });
      return { status: 200, message: 'Payment verified and license created' };
    }
    if (payload.status === 'EXPIRED') {
      transaction.update(requestRef, { status: 'expired', expired_at: new Date().toISOString() });
    }
    return { status: 200, message: 'Invoice status processed' };
  });
}

module.exports = { generateSerial, validateCheckout, processInvoice, createOrderId: () => `req_${randomUUID()}` };
