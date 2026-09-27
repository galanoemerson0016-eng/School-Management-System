const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { validateOrderStatusQuery } = require("./order-status-service");

admin.initializeApp();
const db = admin.firestore();

/**
 * Endpoint: checkOrderStatus
 * Description: Lets a customer look up their purchase request by the email
 * and reference/order ID they submitted with it. Runs with admin
 * privileges so the Storefront does not require direct public read
 * access to the purchase_requests collection (which contains customer PII).
 * Returns only the minimal status fields the status page needs.
 */
exports.checkOrderStatus = onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    let queryParams;
    try {
      queryParams = validateOrderStatusQuery(req.body);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const { targetEmail, targetProofId } = queryParams;

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
          platform: data.platform || "windows",
          name: data.name || "",
          created_at: data.created_at || null,
        };
      });

      return res.status(200).json({ results });
    } catch (err) {
      console.error("Error checking order status:", err);
      return res.status(500).json({ error: "Failed to check order status" });
    }
  });
});
