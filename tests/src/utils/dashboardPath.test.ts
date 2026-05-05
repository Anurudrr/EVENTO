import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDashboardPathForRole } from '../../../src/utils/dashboard.ts';

describe('dashboard path routing', () => {
  it('routes admins to the admin dashboard after authentication', () => {
    assert.equal(getDashboardPathForRole('admin'), '/dashboard/admin');
  });

  it('routes organizers and buyers to their existing dashboards', () => {
    assert.equal(getDashboardPathForRole('organizer'), '/dashboard/seller');
    assert.equal(getDashboardPathForRole('user'), '/dashboard/buyer');
    assert.equal(getDashboardPathForRole(undefined), '/dashboard/buyer');
  });
});
