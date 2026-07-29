import type { Metadata } from 'next';
import { Download, Smartphone, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Télécharger l’app — LUMIRIS',
    description:
        'Téléchargez Lumiris Vision, le scanner universel de passeports numériques de produits (DPP), sur Android.',
    alternates: { canonical: '/telecharger' },
};

// The APK is dropped at public/downloads/lumiris.apk by the Android build
// (see apps/mobile/ANDROID.md).
const APK_HREF = '/downloads/lumiris.apk';

export default function TelechargerPage() {
    return (
        <main className="min-h-screen bg-background pt-28 pb-24">
            <header className="mx-auto max-w-3xl px-6">
                <div className="flex items-center gap-3">
                    <Smartphone className="text-grade-b h-6 w-6" aria-hidden="true" />
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Télécharger Lumiris Vision
                    </h1>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Le scanner universel de passeports numériques de produits (DPP) sur votre téléphone. Scannez
                    n&apos;importe quel produit et lisez son score Iris V2 sur quatre piliers.
                </p>
            </header>

            <section className="mx-auto mt-10 max-w-3xl px-6">
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <a
                        href={APK_HREF}
                        download
                        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                    >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Télécharger l&apos;APK Android
                    </a>
                    <p className="mt-4 text-xs text-muted-foreground">
                        Android 8.0+ · application signée · ~30&nbsp;Mo
                    </p>
                </div>

                <div className="mt-8 flex gap-3 rounded-xl border border-border p-5">
                    <ShieldCheck className="text-grade-b mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div className="text-sm leading-relaxed">
                        <p className="font-medium text-foreground">Installation hors Play Store</p>
                        <p className="mt-1 text-muted-foreground">
                            Comme l&apos;app est distribuée en dehors du Play Store, Android vous demandera
                            d&apos;autoriser l&apos;installation depuis «&nbsp;sources inconnues&nbsp;» pour votre
                            navigateur. Ouvrez le fichier téléchargé, acceptez, et l&apos;installation démarre.
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Version iOS et publication sur le Play Store à venir.
                </p>
            </section>
        </main>
    );
}
