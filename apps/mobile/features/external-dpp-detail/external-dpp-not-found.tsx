import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanSearch, ArrowLeft } from 'lucide-react';

interface ExternalDppNotFoundProps {
    gtin: string;
}

export function ExternalDppNotFound({ gtin }: ExternalDppNotFoundProps) {
    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-5"
            >
                <div className="border-border bg-card text-muted-foreground/70 flex h-20 w-20 items-center justify-center rounded-full border">
                    <ScanSearch className="h-9 w-9" aria-hidden />
                </div>
                <div className="space-y-1.5">
                    <h1 className="text-foreground text-xl font-semibold">Aucun DPP trouvé</h1>
                    <p className="text-muted-foreground text-sm">
                        Le GTIN <span className="text-foreground font-mono">{gtin}</span> n&apos;est pas reconnu comme
                        DPP ESPR valide.
                    </p>
                </div>
                <Link
                    to="/"
                    className="border-border bg-card text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour au scanner
                </Link>
            </motion.div>
        </div>
    );
}
