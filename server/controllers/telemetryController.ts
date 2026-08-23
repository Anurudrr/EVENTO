import type { Response, NextFunction } from 'express';
import { recordAuditLog } from '../utils/audit.ts';

export const createClientTelemetryEvent = async (req: any, res: Response, next: NextFunction) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const kind = typeof body.kind === 'string' && body.kind.trim() ? body.kind.trim() : 'event';
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'client-signal';
    const level = typeof body.level === 'string' && body.level.trim() ? body.level.trim() : 'info';
    const path = typeof body.path === 'string' ? body.path.trim() : '';
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    await recordAuditLog({
      actor: req.user?._id?.toString?.() || null,
      role: req.user?.role || 'guest',
      action: `telemetry.${kind}`,
      entityType: 'telemetry',
      entityId: name,
      status: ['success', 'warning', 'error'].includes(level) ? level as 'success' | 'warning' | 'error' : 'info',
      summary: `${kind} reported from ${path || 'unknown route'}: ${name}`,
      metadata,
    });

    res.status(202).json({
      success: true,
      data: {
        accepted: true,
      },
    });
  } catch (error) {
    next(error);
  }
};
