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
                Les plateformes industrielles s&apos;adressent aux donneurs d&apos;ordre et facturent entre 5 000 et 50
                000 €/an. ATELIER vise les TPE et PME artisanales avec un pricing accessible et une création guidée —
                sans déployer d&apos;ERP ni de SaaS lourd côté atelier.
            </>
        ),
    },
    {
        q: 'Le score Iris peut-il être amélioré contre paiement ?',
        a: (
            <>
                Non, jamais. L&apos;algorithme 40/25/25/10 est open-source (
                <Link href="/methode" className="text-foreground underline-offset-4 hover:underline">
                    voir la méthodologie
                </Link>
                ) et les datasets (ADEME, Higg, Water Footprint Network) sont publics et versionnés. L&apos;option
                ATELIER+ joue à score équivalent uniquement.
            </>
        ),
    },
    {
        q: 'Combien de temps pour créer mon premier passeport ?',
        a: (
            <>
                Environ 30 minutes avec les factures fournisseurs sous la main. L&apos;OCR pré-remplit la composition et
                la traçabilité ; il reste les étapes de fabrication et les certifications à confirmer.
            </>
        ),
    },
    {
        q: 'Que se passe-t-il si un justificatif ESPR manque ?',
        a: (
            <>
                Le score Iris est plafonné à D tant qu&apos;un champ ESPR ou AGEC obligatoire n&apos;est pas renseigné.
                Un tableau de bord de complétude liste les champs manquants et trie les passeports par urgence. Aucune
                publication ne saute discrètement.
            </>
        ),
    },
    {
        q: 'Puis-je changer de palier en cours de route ?',
        a: (
            <>
                Oui, à tout moment. Le passage à un palier supérieur est immédiat (prorata du montant restant). La
                descente prend effet au prochain renouvellement mensuel ou annuel.
            </>
        ),
    },
    {
        q: 'Les données de mes passeports sont-elles publiques ?',
        a: (
            <>
                Les informations de base (produit, score, atelier) sont visibles dans VISION pour permettre aux
                acheteurs de scanner. Les données de fabrication détaillées restent privées et ne sont partagées
                qu&apos;avec votre accord.
            </>
        ),
    },
    {
        q: 'LUMIRIS est-il conforme au RGPD et au futur règlement ESPR ?',
        a: (
            <>
                Oui. LUMIRIS est hébergé en France (Scaleway, OVH), conforme RGPD, et structuré pour répondre aux
                exigences du Digital Product Passport européen (ESPR) dès son entrée en vigueur en juillet 2026.
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
