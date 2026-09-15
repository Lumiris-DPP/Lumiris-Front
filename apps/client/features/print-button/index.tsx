'use client';

import { Printer } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';

export function PrintButton() {
    return (
        <Button
            type="button"
            size="sm"
            onClick={() => window.print()}
            className="fixed top-4 right-4 z-50 shadow-md print:hidden"
        >
            <Printer className="h-4 w-4" />
            Imprimer
        </Button>
    );
}
