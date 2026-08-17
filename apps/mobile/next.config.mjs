// Un seul artefact pour les deux cibles : `next build` produit un export statique dans `out/`,
// servi tel quel par l'hébergement web comme par le shell Tauri (frontendDist: ../out).
// Conséquence assumée : aucune donnée n'est lue côté serveur, et seuls les segments dynamiques
// énumérables au build sont pré-rendus (cf. generateStaticParams) — les identifiants créés à
// l'exécution passent par la query string (cf. lib/routes.ts).

import { createNextConfig } from '@lumiris/config/next';

export default createNextConfig({
    target: 'static',
    transpilePackages: ['@lumiris/scoring-ui', '@lumiris/mock-data'],
});
