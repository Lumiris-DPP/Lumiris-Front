'use client';

import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@lumiris/ui/components/accordion';

interface FaqEntry {
    q: string;
    a: React.ReactNode;
}

const FAQ: readonly FaqEntry[] = [
    {
        q: 'En quoi LUMIRIS est différent des solutions DPP industrielles ?',
        a: (
            <>
                Les plateformes industrielles s’adressent aux donneurs d’ordre et facturent entre 5 000 et 50 000 €/an.
                ATELIER vise les TPE et PME artisanales avec un pricing au passeport et une création guidée — sans
                déployer d’ERP ni de SaaS lourd côté atelier.
            </>
        ),
    },
    {
        q: 'Que se passe-t-il si un justificatif ESPR manque ?',
        a: (
            <>
                Le score Iris est plafonné à D tant qu’un champ ESPR ou AGEC obligatoire n’est pas renseigné. Un tableau
                de bord de complétude liste les champs manquants et trie les passeports par urgence. Aucune publication
                ne saute discrètement.
            </>
        ),
    },
    {
        q: 'Le score Iris peut-il être amélioré contre paiement ?',
        a: (
            <>
                Non, jamais. L’algorithme 40/25/25/10 est open-source (
                <Link href="/reglementation" className="text-foreground underline-offset-4 hover:underline">
                    @lumiris/core
                </Link>
                ) et les datasets (ADEME, Higg, Water Footprint Network) sont publics et versionnés. L’option ATELIER+
                joue à score équivalent uniquement.
            </>
        ),
    },
    {
        q: 'Combien de temps pour créer mon premier passeport ?',
        a: (
            <>
                Environ 30 minutes avec les factures fournisseurs sous la main. L’OCR pré-remplit la composition et la
                traçabilité ; il reste les étapes de fabrication et les certifications à confirmer.
            </>
        ),
    },
];

export function AtelierFaq() {
    return (
        <Accordion type="single" collapsible className="w-full">
            {FAQ.map((entry, index) => (
                <AccordionItem key={entry.q} value={`item-${index}`}>
                    <AccordionTrigger className="text-foreground text-left text-base font-medium">
                        {entry.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                        {entry.a}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
