const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// Declare secrets (values are injected securely at runtime from Firebase Secret Manager)
const xenditSecretKey = defineSecret("XENDIT_SECRET_KEY");
const xenditCallbackToken = defineSecret("XENDIT_CALLBACK_TOKEN");

// Generate a randomized key matching FormEase console requirements: XXXX-XXXX-XXXX-XXXX
function generateSerial() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

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

    const { name, email, platform } = req.body;

    if (!name || !email || !platform) {
      return res.status(400).json({ error: "Missing required fields: name, email, platform" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPlatform = platform.toLowerCase().trim();
    
    if (cleanPlatform !== "windows" && cleanPlatform !== "mac") {
      return res.status(400).json({ error: "Invalid platform. Must be 'windows' or 'mac'" });
    }

    // Set prices: 399 for windows, 499 for mac
    const amount = cleanPlatform === "mac" ? 499 : 399;
    
    // Generate a unique order/request ID
    const orderId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      if (!XENDIT_SECRET_KEY) {
        throw new Error("Xendit API Secret Key is not configured on the backend.");
      }

      // Call Xendit API to generate a checkout invoice
      const response = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
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
        const errText = await response.text();
        throw new Error(`Xendit Response Error: ${errText}`);
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
      return res.status(500).json({ error: err.message || "Failed to create checkout session" });
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
  const callbackToken = (req.headers["x-callback-token"] || "").trim();
  const expectedToken = XENDIT_CALLBACK_TOKEN.trim();
  if (!expectedToken || callbackToken !== expectedToken) {
    console.warn("Unauthorized webhook callback attempt: x-callback-token header mismatch");
    return res.status(401).send("Unauthorized callback token verification failed");
  }

  const payload = req.body;
  const orderId = payload.external_id;
  const paymentStatus = payload.status; // e.g., "PAID", "EXPIRED"

  if (!orderId) {
    return res.status(400).send("Bad Request: missing external_id");
  }

  try {
    const requestRef = db.collection("artifacts/g7-special/admin/data/purchase_requests").doc(orderId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      console.warn(`Webhook received for unknown order reference ID: ${orderId}`);
      return res.status(404).send("Order request not found");
    }

    const requestData = requestDoc.data();

    // If order has already been finalized/approved, return success to prevent double generation
    if (requestData.status === "approved" || requestData.status === "declined" || requestData.status === "paid") {
      return res.status(200).send("Order already processed");
    }

    if (paymentStatus === "PAID") {
      // 2. Generate new serial key
      const serialKey = generateSerial();
      const platform = requestData.platform || "windows";
      const name = requestData.name || "Customer";

      // 3. Create key in /licenses database (matching current structure)
      // Path: artifacts/g7-special/public/data/licenses
      await db.collection("artifacts/g7-special/public/data/licenses").doc(serialKey).set({
        serial: serialKey,
        platform: platform,
        status: "pending", // pending customer machine lock
        machine_id: "",
        activated_at: null,
        expires_at: null,
        registered_to: name,
        created_at: new Date().toISOString(),
        duration_months: 12
      });

      // 4. Update the purchase request document to approved and assign license key
      await requestRef.update({
        status: "approved",
        license_key: serialKey,
        approved_at: new Date().toISOString(),
        paid_amount: payload.amount,
        payment_method_channel: payload.payment_method || "",
        xendit_payment_id: payload.id || ""
      });

      console.log(`Auto-generated and approved license key ${serialKey} for order ID ${orderId}`);
      return res.status(200).send("Webhook successfully verified, key created.");
    } else if (paymentStatus === "EXPIRED") {
      // Mark as expired to stop polling/status checks
      await requestRef.update({
        status: "expired",
        expired_at: new Date().toISOString()
      });
      console.log(`Order ID ${orderId} marked as expired.`);
      return res.status(200).send("Order expired.");
    } else {
      return res.status(200).send(`Ignoring webhook status: ${paymentStatus}`);
    }

  } catch (err) {
    console.error("Error writing callback updates to Firestore:", err);
    return res.status(500).send("Internal database synchronization error");
  }
});
