import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, LifeBuoy, Mail, Send } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@lumiris/ui/components/accordion';
import { Textarea } from '@lumiris/ui/components/textarea';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { SectionLabel } from '@/lib/section';

interface FaqEntry {
    q: string;
    a: React.ReactNode;
}

const FAQ: readonly FaqEntry[] = [
    {
        q: 'Comment LUMIRIS calcule-t-il le score Iris ?',
        a: (
            <>
                Quatre piliers - Transparence (40%), Savoir-faire (25%), Impact (25%), Réparabilité (10%). Le calcul est
                déterministe et reproductible à partir du DPP.{' '}
                <Link to="/about#scoring-doc" className="text-foreground underline-offset-4 hover:underline">
                    Voir la documentation
                </Link>
                .
            </>
        ),
    },
    {
        q: 'Que faire si le QR ne se scanne pas ?',
        a: (
            <>
                Vérifie l&apos;éclairage et la mise au point. Si l&apos;étiquette est abîmée, tu peux saisir
                manuellement le code à l&apos;ouverture du scanner -{' '}
                <Link to="/scan" className="text-foreground underline-offset-4 hover:underline">
                    réessayer maintenant
                </Link>
                .
            </>
        ),
    },
    {
        q: 'Mes données sont-elles vendues ?',
        a: (
            <>
                Non. Aucune donnée n&apos;est partagée ni vendue. Tout est stocké localement dans ton navigateur. Détail
                complet sur la page{' '}
                <Link to="/me/privacy" className="text-foreground underline-offset-4 hover:underline">
                    Confidentialité
                </Link>
                .
            </>
        ),
    },
    {
        q: 'Comment supprimer mon compte ?',
        a: (
            <>
                Depuis la page{' '}
                <Link to="/me/privacy" className="text-foreground underline-offset-4 hover:underline">
                    Confidentialité
                </Link>
                , bouton « Supprimer mon compte ». L&apos;effacement est immédiat et définitif (compte, garde-robe,
                scans, réglages).
            </>
        ),
    },
    {
        q: 'Pourquoi un grade E sature-t-il l’écran ?',
        a: (
            <>
                Un grade E signale un produit dont la transparence ou l&apos;impact est très en deçà des seuils ESPR /
                AGEC. La saturation visuelle reflète la gravité - c&apos;est un signal, pas une décoration.
            </>
        ),
    },
    {
        q: 'Qui finance LUMIRIS ?',
        a: (
            <>
                LUMIRIS est financé par une commission d&apos;affiliation transparente (3 à 7%) sur les produits achetés
                via l&apos;app. Aucune marque ne peut payer pour modifier son score. La répartition exacte est affichée
                sur chaque fiche.
            </>
        ),
    },
    {
        q: 'Comment devenir artisan partenaire ?',
        a: (
            <>
                Écris-nous à{' '}
                <a
                    href="mailto:hello@lumiris.example?subject=Devenir%20artisan%20partenaire%20LUMIRIS"
                    className="text-foreground underline-offset-4 hover:underline"
                >
                    hello@lumiris.example
                </a>{' '}
                avec une présentation de ton atelier (savoir-faire, labels, localisation).
            </>
        ),
    },
    {
        q: 'L’app fonctionne-t-elle hors ligne ?',
        a: (
            <>
                Le mode hors ligne arrive bientôt - les passeports déjà scannés et la garde-robe locale resteront
                accessibles sans connexion. Les nouveaux scans nécessitent encore le réseau.
            </>
        ),
    },
];

export function Help() {
    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <IridescentBackground intensity="subtle" />

            <Header />

            <motion.div className="flex flex-col gap-5 px-4" variants={slideUpFade} initial="initial" animate="animate">
                <FaqSection />
                <ContactSection />
            </motion.div>
        </div>
    );
}

function Header() {
    return (
        <motion.header
            className="px-5 pb-5 pt-[max(env(safe-area-inset-top),3rem)]"
            variants={slideUpFade}
            initial="initial"
            animate="animate"
        >
            <Link
                to="/me"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Profil
            </Link>
            <div className="mt-3 flex items-center gap-3">
                <span
                    aria-hidden
                    className="border-border/60 bg-background/60 flex h-10 w-10 items-center justify-center rounded-full border"
                >
                    <LifeBuoy className="text-lumiris-cyan h-5 w-5" />
                </span>
                <div>
                    <h1 className="text-foreground text-xl font-bold">Aide & Support</h1>
                    <p className="text-muted-foreground text-xs">FAQ et contact direct.</p>
                </div>
            </div>
        </motion.header>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <SectionLabel title={title} />
            <GlassCard intensity="subtle" className="flex flex-col p-4">
                {children}
            </GlassCard>
        </section>
    );
}

function FaqSection() {
    return (
        <Section title="Questions fréquentes">
            <Accordion type="single" collapsible className="w-full">
                {FAQ.map((entry, i) => (
                    <AccordionItem key={entry.q} value={`faq-${i}`}>
                        <AccordionTrigger className="text-foreground text-sm">{entry.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                            {entry.a}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </Section>
    );
}

function ContactSection() {
    const textareaId = useId();
    const [body, setBody] = useState('');

    function buildMailto(): string {
        const subject = encodeURIComponent('LUMIRIS Vision - Bug report');
        const content =
            body.trim().length > 0 ? body : 'Décris le bug rencontré (étapes, écran, comportement attendu).';
        return `mailto:hello@lumiris.example?subject=${subject}&body=${encodeURIComponent(content)}`;
    }

    return (
        <Section title="Nous contacter">
            <div className="flex flex-col gap-4">
                <a
                    href="mailto:hello@lumiris.example"
                    className="border-border/60 bg-background/60 hover:bg-background/80 inline-flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors"
                >
                    <span className="text-foreground inline-flex items-center gap-3">
                        <Mail className="text-muted-foreground h-4 w-4" />
                        hello@lumiris.example
                    </span>
                    <ExternalLink className="text-muted-foreground/60 h-4 w-4" />
                </a>

                <div className="flex flex-col gap-2">
                    <label htmlFor={textareaId} className="text-foreground text-sm font-medium">
                        Signaler un bug
                    </label>
                    <Textarea
                        id={textareaId}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Décris ce qui s’est passé, sur quel écran, et le résultat attendu."
                        className="bg-background/60 min-h-32"
                    />
                    <a
                        href={buildMailto()}
                        className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-10 items-center justify-center gap-2 self-end rounded-full px-4 text-sm font-semibold transition"
                    >
                        <Send className="h-3.5 w-3.5" />
                        Envoyer
                    </a>
                    <p className="text-muted-foreground/80 text-[10px]">
                        Ouvre ton client mail avec le contenu pré-rempli.
                    </p>
                </div>
            </div>
        </Section>
    );
}
