import { describe, expect, it } from 'bun:test';
import { Glob } from 'bun';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ADMIN_ROOT = join(__dirname, '..');

// Miroir runtime de l'union `AdminAction` — synchroniser avec packages/types/src/admin-rbac.ts à chaque nouvelle clé.
const KNOWN_ADMIN_ACTIONS = new Set([
    'passport.read',
    'passport.curate',
    'passport.validate',
    'passport.flag',
    'passport.request_changes',
    'passport.override',
    'artisan.read',
    'artisan.suspend',
    'artisan.contact',
    'retoucheur.read',
    'retoucheur.kyc_verify',
    'retoucheur.kyc_reject',
    'retoucheur.suspend',
    'retoucheur.review_hide',
    'retoucheur.local_dunning',
    'vision_user.read',
    'vision_user.gdpr_export',
    'vision_user.gdpr_delete',
    'billing.read',
    'billing.dunning',
    'billing.export',
    'billing.invoice_issue',
    'affiliation.read',
    'affiliation.prepare_payout',
    'affiliation.rate_change',
    'affiliation.payout_reconcile',
    'governance.read_audit_log',
    'governance.export_audit_log',
    'governance.anomaly_acknowledge',
    'governance.anomaly_escalate',
]);

const REQUIRED_DISPATCHES = [
    'passport.validate',
    'passport.override',
    'passport.flag',
    'artisan.contact',
    'retoucheur.kyc_verify',
    'retoucheur.review_hide',
    'vision_user.gdpr_export',
    'vision_user.gdpr_delete',
    'billing.invoice_issue',
    'affiliation.rate_change',
    'affiliation.payout_reconcile',
    'governance.anomaly_acknowledge',
    'governance.anomaly_escalate',
] as const;

const ACTION_LITERAL = /action:\s*['"]([a-z_]+\.[a-z_]+)['"]/g;

async function collectDispatchedActions(): Promise<Map<string, string[]>> {
    const found = new Map<string, string[]>();
    const glob = new Glob('{features,lib}/**/*.{ts,tsx}');
    for await (const rel of glob.scan({ cwd: ADMIN_ROOT })) {
        if (rel.includes('__tests__') || rel.includes('_archived')) continue;
        const content = await readFile(join(ADMIN_ROOT, rel), 'utf8');
        ACTION_LITERAL.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = ACTION_LITERAL.exec(content)) !== null) {
            const key = match[1];
            if (!key) continue;
            const list = found.get(key) ?? [];
            list.push(rel);
            found.set(key, list);
        }
    }
    return found;
}

describe('audit log — action literals', () => {
    it('every dispatched action literal exists in the AdminAction union', async () => {
        const found = await collectDispatchedActions();
        const offenders: string[] = [];
        for (const [key, files] of found) {
            if (!KNOWN_ADMIN_ACTIONS.has(key)) {
                offenders.push(`${key} (dispatched in ${files.join(', ')})`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('all sensitive actions required by the audit grid are dispatched at least once', async () => {
        const found = await collectDispatchedActions();
        const missing = REQUIRED_DISPATCHES.filter((k) => !found.has(k));
        expect(missing).toEqual([]);
    });
});
