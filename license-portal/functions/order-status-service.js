function validateOrderStatusQuery(body) {
  const { email, proofId } = body || {};
  if (
    typeof email !== "string" ||
    typeof proofId !== "string" ||
    !email.trim() ||
    !proofId.trim() ||
    email.length > 254 ||
    proofId.length > 160
  ) {
    throw new Error("Missing or invalid required fields: email, proofId");
  }

  const targetEmail = String(email).toLowerCase().trim();
  const targetProofId = String(proofId).toLowerCase().trim();

  // Basic email pattern check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  return { targetEmail, targetProofId };
}

module.exports = {
  validateOrderStatusQuery,
};
