const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { timingSafeEqual } = require("node:crypto");
const { validateCheckout, processInvoice, createOrderId } = require("./payment-service");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// Declare secrets (values are injected securely at runtime from Firebase Secret Manager)
const xenditSecretKey = defineSecret("XENDIT_SECRET_KEY");
const xenditCallbackToken = defineSecret("XENDIT_CALLBACK_TOKEN");

/**
 * Endpoint: createCheckoutSession
 * Description: Call this from the client to initiate an online checkout with Xendit.
 * It will return the Xendit secure checkout page URL.
 */
exports.createCheckoutSession = onRequest({ secrets: [xenditSecretKey, xenditCallbackToken] }, (req, res) => {
  return cors(req, res, async () => {
    const XENDIT_SECRET_KEY = xenditSecretKey.value();
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    let checkout;
    try {
      checkout = validateCheckout(req.body);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    const { name, email: normalizedEmail, platform: cleanPlatform } = checkout;

    // Set prices: 399 for windows, 499 for mac
    const amount = cleanPlatform === "mac" ? 499 : 399;
    
    // Generate a unique order/request ID
    const orderId = createOrderId();

    try {
      if (!XENDIT_SECRET_KEY) {
        throw new Error("Xendit API Secret Key is not configured on the backend.");
      }

      // Call Xendit API to generate a checkout invoice
      const response = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          "Authorization": "Basic " + Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          external_id: orderId,
          amount: amount,
          payer_email: normalizedEmail,
          description: `FormEase Pro - ${cleanPlatform === "mac" ? "macOS" : "Windows"} 1-Year License`,
          invoice_duration: 86400, // invoice valid for 24 hours
          success_redirect_url: `https://formease-licensing.web.app/?status=success&order_id=${orderId}`,
          failure_redirect_url: `https://formease-licensing.web.app/?status=failed`,
          customer: {
            given_names: name,
            email: normalizedEmail
          },
          items: [
            {
              name: `FormEase Pro - ${cleanPlatform === "mac" ? "macOS" : "Windows"} Edition`,
              quantity: 1,
              price: amount,
              category: "Software License"
            }
          ],
          payment_methods: ["GCASH", "MAYA", "SHOPEEPAY", "GRABPAY", "CREDIT_CARD", "BPI", "UBP"]
        })
      });

      if (!response.ok) {
        throw new Error(`Payment provider returned HTTP ${response.status}`);
      }

      const invoice = await response.json();

      // Store a pending purchase request in Firestore
      // Path: artifacts/g7-special/admin/data/purchase_requests
      await db.collection("artifacts/g7-special/admin/data/purchase_requests").doc(orderId).set({
        name: name,
        email: normalizedEmail,
        platform: cleanPlatform,
        amount: amount,
        payment_method: "Xendit",
        proof_id: orderId, // search reference is the Order ID
        status: "pending_payment",
        xendit_invoice_id: invoice.id,
        xendit_invoice_url: invoice.invoice_url,
        created_at: new Date().toISOString(),
        license_key: null
      });

      return res.status(200).json({
        order_id: orderId,
        invoice_url: invoice.invoice_url
      });

    } catch (err) {
      console.error("Error creating checkout session:", err);
      return res.status(500).json({ error: "Unable to create checkout. Please try again." });
    }
  });
});

/**
 * Webhook: xenditWebhook
 * Description: HTTP route that Xendit triggers upon successful payment.
 * Automatically verifies signatures, generates keys, and updates Firestore.
 */
exports.xenditWebhook = onRequest({ secrets: [xenditSecretKey, xenditCallbackToken] }, async (req, res) => {
  const XENDIT_CALLBACK_TOKEN = xenditCallbackToken.value();
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // 1. Verify Callback Token Header
  const callbackToken = typeof req.headers["x-callback-token"] === "string" ? req.headers["x-callback-token"].trim() : "";
  const expectedToken = (XENDIT_CALLBACK_TOKEN || "").trim();
  const received = Buffer.from(callbackToken);
  const expected = Buffer.from(expectedToken);
  if (!expected.length || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    console.warn("Unauthorized webhook callback attempt: x-callback-token header mismatch");
    return res.status(401).send("Unauthorized callback token verification failed");
  }

  try {
    const result = await processInvoice(db, req.body);
    return res.status(result.status).send(result.message);

  } catch (err) {
    console.error("Error writing callback updates to Firestore:", err);
    return res.status(500).send("Internal database synchronization error");
  }
});

/**
 * Endpoint: checkOrderStatus
 * Description: Lets a customer look up their purchase request by the email
 * and reference/order ID they submitted with it. Runs with admin
 * privileges so the Storefront no longer needs direct (and therefore
 * world-listable) read access to the purchase_requests collection, which
 * contains every customer's PII and any approved license_key.
 * Returns only the minimal fields the status page needs.
 */
exports.checkOrderStatus = onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { email, proofId } = req.body || {};
    if (typeof email !== "string" || typeof proofId !== "string" || !email.trim() || !proofId.trim() || email.length > 254 || proofId.length > 160) {
      return res.status(400).json({ error: "Missing required fields: email, proofId" });
    }

    const targetEmail = String(email).toLowerCase().trim();
    const targetProofId = String(proofId).toLowerCase().trim();

    try {
      const snapshot = await db.collection("artifacts/g7-special/admin/data/purchase_requests")
        .where("email", "==", targetEmail)
        .where("proof_id", "==", targetProofId)
        .limit(10)
        .get();

      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status || "pending",
          license_key: data.license_key || null,
          decline_reason: data.decline_reason || null,
        };
      });

      return res.status(200).json({ results });
    } catch (err) {
      console.error("Error checking order status:", err);
      return res.status(500).json({ error: "Failed to check order status" });
    }
  });
});
