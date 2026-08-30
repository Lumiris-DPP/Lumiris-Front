import { EmailLogs } from '@/features/emails';
import { PermissionGate } from '@/features/_shared/permission-gate';

export const metadata = { title: 'Emails · LUMIRIS Admin' };

export default function EmailsPage() {
    return (
        <PermissionGate requires="governance.read_audit_log">
            <EmailLogs />
        </PermissionGate>
    );
}
