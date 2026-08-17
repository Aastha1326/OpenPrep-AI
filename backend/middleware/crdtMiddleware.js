/**
 * CRDT Middleware MVP
 * Resolves conflicts using a simple Last-Write-Wins (LWW) based on timestamps.
 */
const crdtMiddleware = (req, res, next) => {
  const incomingData = req.body;
  
  if (!incomingData || !incomingData.updatedAt) {
    return next();
  }

  // MOCK: Suppose we fetch the existing document from DB
  const existingDocument = {
    id: incomingData.id,
    content: "Old server content",
    updatedAt: Date.now() - 10000 // 10 seconds ago
  };

  const incomingTimestamp = new Date(incomingData.updatedAt).getTime();
  const existingTimestamp = new Date(existingDocument.updatedAt).getTime();

  // If the client's offline edit is older than the server's current state, reject or merge
  if (incomingTimestamp < existingTimestamp) {
    console.log(`[CRDT] Conflict detected for ID ${incomingData.id}. Resolving via LWW.`);
    // In a real CRDT, we'd do a deep structural merge. For MVP LWW:
    req.crdtStatus = 'CONFLICT_SERVER_WINS';
    // Reject the offline edit to prevent overwriting newer data
    return res.status(409).json({
      message: 'Conflict: Server has newer data.',
      serverState: existingDocument
    });
  }

  req.crdtStatus = 'MERGED';
  next();
};

module.exports = crdtMiddleware;
