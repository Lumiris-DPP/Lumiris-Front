# Modules archivés

Code conservé pour rollback éventuel mais retiré de la navigation et du
business model actif.

## blog/

Blog archivé le **2026-05-17** — vestigial vs business model DPP v6.3
(plateforme à 5 lignes de revenus : abonnements ATELIER, ATELIER+,
affiliation achat, affiliation retouche, abonnement Local). Le journal
éditorial n'est plus une surface admin et migre intégralement côté
`apps/site` quand il sera ré-activé.

Le code reste linké via la glob d'entrées `features/**/index.tsx` du
fichier `knip.json` pour ne pas générer d'orphelins, mais aucun route
`app/` ne le rend ni ne l'importe.
