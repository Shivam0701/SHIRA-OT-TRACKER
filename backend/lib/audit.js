const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Log a security/admin event.
 * Never logs passwords, tokens or OTP values.
 */
async function audit(event, { actorId, targetId, ip, meta } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId:  actorId  || null,
        targetId: targetId || null,
        event,
        ip:       ip       || null,
        meta:     meta     || null,
      },
    });
  } catch (err) {
    // Never let audit failure crash the request
    console.error('[audit] Failed to write log:', event, err.message);
  }
}

module.exports = audit;
