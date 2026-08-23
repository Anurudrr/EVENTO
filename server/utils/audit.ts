import AuditLog from '../models/AuditLog.ts';

interface AuditInput {
  actor?: string | null;
  role?: string;
  action: string;
  entityType: string;
  entityId?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
  summary: string;
  metadata?: Record<string, unknown>;
}

export const recordAuditLog = async ({
  actor = null,
  role = 'system',
  action,
  entityType,
  entityId = '',
  status = 'info',
  summary,
  metadata = {},
}: AuditInput) => {
  try {
    return await AuditLog.create({
      actor,
      role,
      action,
      entityType,
      entityId,
      status,
      summary,
      metadata,
    });
  } catch (error) {
    console.error('[audit] Failed to record audit log', {
      action,
      entityType,
      entityId,
      message: error instanceof Error ? error.message : 'Unknown audit error',
    });

    return null;
  }
};
