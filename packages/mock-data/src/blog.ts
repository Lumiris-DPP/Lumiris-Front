import type { BlogArticle } from '@lumiris/types';

export const mockBlogArticles: readonly BlogArticle[] = [
    {
        id: 'blog-fr-001',
        title: 'Le DPP textile en 2028 : ce que l’ESPR va changer pour vos passeports',
        slug: 'dpp-textile-2028-espr',
        category: 'regulation',
        status: 'Published',
        author: 'Claire Dubois',
        excerpt:
            'En 2028, chaque vêtement vendu en Europe devra être accompagné d’un Digital Product Passport. Décryptage des champs obligatoires et de leur impact sur les ateliers français.',
        body:
            'En 2028, chaque vêtement, chaque chaussure, chaque accessoire textile vendu sur le marché européen devra exposer un Digital Product Passport. Pour les artisans français, ce n’est pas une contrainte de plus : c’est l’occasion de rendre visible une chaîne de valeur déjà courte et déjà documentée.\n\n' +
            'Le règlement ESPR définit des champs minimaux : composition, origine, durabilité, réparabilité, fin de vie. LUMIRIS pré-remplit la moitié de ces champs à partir des factures fournisseurs scannées et du dossier EPV existant. Restent les preuves : photos, gestes, certifications. C’est ce qui fait la différence entre un passeport conforme et un passeport qui inspire confiance.\n\n' +
            'Dans cet article, nous détaillons chacun des dix champs ESPR, leur traduction en items LUMIRIS et le calendrier officiel - y compris le sursis prévu pour les artisans inscrits au Répertoire des Métiers.',
        readTime: '9 min',
        metaTitle: 'DPP textile ESPR 2028 - guide pour les ateliers',
        metaDescription:
            'À partir de 2028, le règlement ESPR impose un Digital Product Passport pour tout vêtement vendu en Europe. Champs obligatoires, calendrier, sursis RM.',
        ogImage: 'https://placehold.co/1200x630/png?text=DPP+ESPR+2028',
        coverImage: 'https://placehold.co/1200x630/png?text=DPP+ESPR+2028',
        createdAt: '2026-03-04T08:00:00Z',
        updatedAt: '2026-03-08T11:30:00Z',
        publishedAt: '2026-03-08T12:00:00Z',
    },
    {
        id: 'blog-fr-002',
        title: 'Pourquoi LUMIRIS ne vendra jamais ses scores',
        slug: 'manifeste-independance-iris',
        category: 'mode_responsable',
        status: 'Published',
        author: 'Léa Marchand',
        excerpt:
            'Notre charte d’indépendance, en sept articles. Un score Iris ne se monnaie pas - sinon il ne signifie plus rien.',
        body:
            'LUMIRIS s’est créé en réaction. En réaction à des labels privés qui notent leurs propres clients. En réaction à des plateformes qui empilent les badges sponsorisés.\n\n' +
            'Article 1 - Aucun artisan, aucune marque, aucun fournisseur ne peut acheter, négocier ou influencer son score Iris.\n\n' +
            'Article 2 - Notre modèle économique est public : abonnements ATELIER (29 / 79 / 149 €) et abonnements LOCAL retoucheurs.\n\n' +
            'Article 3 - Nous ne plaçons jamais d’encart sponsorisé sur une fiche artisan. Le seul placement payant est l’add-on ATELIER+, qui modifie la visibilité dans l’annuaire - jamais le score.\n\n' +
            'Article 4 - Nos algorithmes sont open-source.\n\n' +
            'Article 5 - Nos jeux de données de référence sont publiés et versionnés.\n\n' +
            'Article 6 - En cas de doute, l’utilisateur peut saisir une commission externe.\n\n' +
            'Article 7 - Si nous ne respectons pas l’un de ces six premiers articles, nous nous engageons à fermer le service.',
        readTime: '4 min',
        metaTitle: 'Manifeste LUMIRIS - pourquoi nos scores ne se vendent pas',
        metaDescription:
            'La charte d’indépendance LUMIRIS en sept articles. Un score Iris ne se monnaie pas. Modèle économique public, algorithmes open source.',
        ogImage: 'https://placehold.co/1200x630/png?text=Manifeste+LUMIRIS',
        coverImage: 'https://placehold.co/1200x630/png?text=Manifeste',
        createdAt: '2026-04-08T07:00:00Z',
        updatedAt: '2026-04-08T07:00:00Z',
        publishedAt: '2026-04-08T08:00:00Z',
    },
    {
        id: 'blog-fr-003',
        title: 'Portrait - Marie Le Goff, le lin breton à la main',
        slug: 'portrait-marie-le-goff',
        category: 'portrait_artisan',
        status: 'Published',
        author: 'Léa Marchand',
        artisanId: 'art-marie',
        excerpt:
            'Quimper, atelier 18 m². Marie coupe au mètre, coud à la machine droite et signe ses pièces. Reportage.',
        body:
            'Quimper, premier mardi d’avril. Le ciel est d’un gris breton sans concession. Marie ouvre l’atelier à 8 h 30, allume la cafetière, sort le mètre ruban et déroule la pièce de lin.\n\n' +
            'Marie a appris la couture aux Compagnons du Devoir, à Tours, entre 2014 et 2019. Elle s’est installée à Quimper l’été suivant, dans un local de 18 mètres carrés rue Kéréon.\n\n' +
            'Ce qui frappe quand on la regarde travailler, c’est la lenteur. La coupe prend 40 minutes, l’épaule 25, le poignet 15. Une chemise demande quatre heures et demie. Au prix de vente public - 240 € - on est largement sous le SMIC horaire si on intègre le temps administratif. « LUMIRIS m’a fait gagner deux heures par semaine sur le passeport », dit-elle.\n\n' +
            'Marie est labellisée Origine France Garantie depuis 2024. Elle vise EPV pour 2027 - il lui manque l’ancienneté minimale (5 ans). Le score Iris de sa chemise lin (passeport pass-marie-001) atteint un grade A : composition documentée, fournisseur identifié, certifications GOTS valides, six étapes de fabrication photographiées, garantie 24 mois.',
        readTime: '7 min',
        metaTitle: 'Portrait - Marie Le Goff, couturière lin breton à Quimper',
        metaDescription:
            "Visite à l'atelier de Marie Le Goff, couturière formée aux Compagnons du Devoir. Lin breton, machine droite, série courte.",
        ogImage: 'https://placehold.co/1200x630/png?text=Marie+Le+Goff',
        coverImage: 'https://placehold.co/1200x630/png?text=Atelier+Marie',
        createdAt: '2026-04-12T10:00:00Z',
        updatedAt: '2026-04-12T10:00:00Z',
        publishedAt: '2026-04-12T11:00:00Z',
    },
    {
        id: 'blog-fr-004',
        title: 'Portrait - Théo Magnan, chausseur de Romans-sur-Isère',
        slug: 'portrait-theo-magnan',
        category: 'portrait_artisan',
        status: 'Published',
        author: 'Maxime Laurent',
        artisanId: 'art-theo',
        excerpt:
            'Troisième génération. Studio EPV de quatre personnes. Cuir tannage végétal. Reportage à Romans-sur-Isère.',
        body:
            'Romans-sur-Isère, capitale historique de la chaussure française. Théo Magnan a repris l’atelier de son père en 2019, ajouté deux apprentis, conservé la couture trépointe.\n\n' +
            'L’EPV - Entreprise du Patrimoine Vivant - a été décrochée en 2018. Cinq ans plus tard, Théo a aussi adopté ATELIER+ pour activer le module dépôt-vente : ses anciens modèles passent en seconde main avec un passeport mis à jour, transparence sur la réparation effectuée.\n\n' +
            'Une paire de bottines Théo, c’est 14 heures de travail, 480 € en boutique, et un grade Iris A consolidé par l’expertise EPV - pas par un boost payant.',
        readTime: '6 min',
        metaTitle: 'Portrait - Théo Magnan, chausseur EPV à Romans',
        metaDescription:
            "Visite à l'atelier de Théo Magnan, troisième génération de chausseurs à Romans-sur-Isère. Tannage végétal, couture trépointe.",
        ogImage: 'https://placehold.co/1200x630/png?text=Theo+Magnan',
        coverImage: 'https://placehold.co/1200x630/png?text=Atelier+Theo',
        createdAt: '2026-03-25T09:30:00Z',
        updatedAt: '2026-03-26T11:00:00Z',
        publishedAt: '2026-03-26T12:00:00Z',
    },
    {
        id: 'blog-fr-005',
        title: 'Lin breton, chanvre, cuir tannage végétal - guide des matières d’atelier',
        slug: 'guide-matieres-atelier',
        category: 'savoir_faire',
        status: 'Published',
        author: 'Claire Dubois',
        excerpt: 'Un panorama des matières utilisées par les ateliers LUMIRIS, leurs origines et leurs certifications.',
        body:
            'Le lin breton est tissé à Locronan depuis le XVIIᵉ siècle. La filature de Bretagne en perpétue le savoir-faire - fil 100 % France, certification GOTS.\n\n' +
            'Le chanvre français revient progressivement, principalement cultivé dans l’Aube. La filière reste artisanale.\n\n' +
            'Le cuir tannage végétal - comme à Graulhet chez Paul Chevreau - utilise des écorces (mimosa, châtaignier) plutôt que du chrome. Bilan eau divisé par trois.',
        readTime: '8 min',
        metaTitle: 'Guide des matières - lin, chanvre, cuir tannage végétal',
        metaDescription:
            'Panorama des matières utilisées par les ateliers LUMIRIS : lin breton, chanvre français, cuir tannage végétal. Origines, filières, certifications.',
        ogImage: 'https://placehold.co/1200x630/png?text=Matieres+atelier',
        createdAt: '2026-04-02T08:30:00Z',
        updatedAt: '2026-04-03T10:00:00Z',
        publishedAt: '2026-04-03T12:00:00Z',
    },
    {
        id: 'blog-fr-006',
        title: 'AGEC - la pénalité 2027 sur l’affichage environnemental, mode d’emploi',
        slug: 'agec-penalite-2027',
        category: 'regulation',
        status: 'Published',
        author: 'Maxime Laurent',
        excerpt:
            'À partir du 1er janvier 2027, l’absence d’affichage environnemental sur les vêtements neufs sera sanctionnée. Décryptage des seuils et des recours.',
        body:
            'La loi AGEC, promulguée le 10 février 2020, impose progressivement l’affichage environnemental sur les produits textiles neufs vendus en France. Le calendrier est cadencé : volontaire jusqu’en 2024, recommandé en 2025-2026, obligatoire à partir du 1er janvier 2027 pour les acteurs au chiffre d’affaires supérieur à 50 millions d’euros.\n\n' +
            'L’affichage AGEC repose sur cinq critères chiffrés : empreinte carbone, eau, recyclé, durabilité, réparabilité. LUMIRIS calcule ces cinq valeurs automatiquement.',
        readTime: '5 min',
        metaTitle: 'AGEC - pénalité 2027 sur l’affichage environnemental textile',
        metaDescription:
            'À partir de 2027, l’absence d’affichage environnemental sur les vêtements sera sanctionnée. Seuils, sursis pour les artisans, recours.',
        ogImage: 'https://placehold.co/1200x630/png?text=AGEC+2027',
        createdAt: '2026-04-24T11:00:00Z',
        updatedAt: '2026-04-25T15:30:00Z',
        publishedAt: '2026-04-25T16:00:00Z',
    },
    {
        id: 'blog-fr-007',
        title: 'Réparer plutôt que jeter - le réflexe local en 5 étapes',
        slug: 'guide-reparer-plutot-que-jeter',
        category: 'guide_retouche',
        status: 'Published',
        author: 'Léa Marchand',
        excerpt:
            'Comment trouver un retoucheur de confiance, comprendre un devis, suivre une réparation. Un guide pratique.',
        body:
            'Étape 1 - diagnostiquer le défaut. Coutures, ourlet, doublure, fermeture éclair : chaque type a son spécialiste.\n\n' +
            'Étape 2 - chercher local. L’annuaire LUMIRIS Local affiche les retoucheurs dans un rayon de 2 km autour de votre code postal.\n\n' +
            'Étape 3 - demander un devis. Une retouche de fermeture éclair se situe entre 25 et 40 €. Une réparation de coutures, 12 à 25 €.\n\n' +
            'Étape 4 - suivre l’avancement. Le retoucheur met à jour le statut côté Vision, photos avant/après.\n\n' +
            'Étape 5 - laisser un avis. Cela alimente le score local du retoucheur.',
        readTime: '5 min',
        metaTitle: 'Guide retouche - réparer plutôt que jeter en 5 étapes',
        metaDescription:
            "Diagnostiquer, chercher local, demander un devis, suivre l'avancement, laisser un avis : le réflexe retouche, étape par étape.",
        ogImage: 'https://placehold.co/1200x630/png?text=Guide+retouche',
        createdAt: '2026-04-15T09:00:00Z',
        updatedAt: '2026-04-16T10:00:00Z',
        publishedAt: '2026-04-16T11:00:00Z',
    },

    {
        id: 'blog-fr-008',
        title: 'Portrait - Paul Chevreau, tannerie familiale depuis 1947',
        slug: 'portrait-paul-chevreau',
        category: 'portrait_artisan',
        status: 'Review',
        author: 'Claire Dubois',
        artisanId: 'art-paul',
        excerpt:
            'Graulhet, trois générations, tannage végétal. Paul Chevreau et l’art de la maroquinerie patrimoniale.',
        body:
            'Graulhet, Tarn. La tannerie Chevreau ouvre tous les jours à 6 h. Paul, 47 ans, a repris l’atelier de son grand-père en 2009. Trente collaborateurs aujourd’hui.\n\n' +
            'Le tannage végétal demande six mois - contre 48 heures pour le chrome. Économie d’eau : 60 %. Cuir plus rigide, plus noble, plus cher.\n\n' +
            'Le passeport pass-paul-001 documente toute la chaîne : du peau brute à la pièce finie, photos d’atelier, certifications EPV.',
        readTime: '6 min',
        metaTitle: 'Portrait - Paul Chevreau, tannerie EPV à Graulhet',
        metaDescription:
            'Visite à la tannerie Chevreau, troisième génération à Graulhet. Tannage végétal, économie d’eau, certification EPV.',
        ogImage: 'https://placehold.co/1200x630/png?text=Paul+Chevreau',
        createdAt: '2026-04-20T10:00:00Z',
        updatedAt: '2026-04-28T14:30:00Z',
    },
    {
        id: 'blog-fr-009',
        title: 'AGEC - calculer son affichage environnemental sans expert',
        slug: 'agec-calculer-affichage-environnemental',
        category: 'regulation',
        status: 'Scheduled',
        author: 'Maxime Laurent',
        excerpt:
            'Cinq critères, une méthode. Voici comment générer son affichage AGEC à partir d’un passeport LUMIRIS.',
        body:
            'L’AGEC repose sur cinq critères : carbone, eau, recyclé, durabilité, réparabilité. LUMIRIS calcule automatiquement ces cinq valeurs depuis le passeport - fibres, masse, étapes, garantie.\n\n' +
            'L’export PDF affichage est conforme au format DGCCRF. Il sert aussi à la fiche-produit côté retail.',
        readTime: '6 min',
        metaTitle: 'AGEC - calculer son affichage environnemental textile',
        metaDescription:
            "Méthode pour générer un affichage environnemental AGEC conforme à partir d'un passeport LUMIRIS, sans bureau d'études.",
        ogImage: 'https://placehold.co/1200x630/png?text=AGEC+calcul',
        coverImage: 'https://placehold.co/1200x630/png?text=AGEC+calcul',
        scheduledAt: '2026-05-08T08:00:00Z',
        createdAt: '2026-04-26T09:00:00Z',
        updatedAt: '2026-04-30T12:00:00Z',
    },
    {
        id: 'blog-fr-010',
        title: 'Portrait - Amélie Berthier, brodeuse main',
        slug: 'portrait-amelie-berthier',
        category: 'portrait_artisan',
        status: 'Draft',
        author: 'Léa Marchand',
        artisanId: 'art-amelie',
        excerpt: "Lyon, Métiers d'Art. Amélie Berthier brode à la main des écharpes en soie, en série très courte.",
        body: 'Brouillon en cours. Note : intégrer photos atelier rue Mercière, citation sur le temps long.',
        readTime: '5 min',
        metaTitle: '',
        metaDescription: '',
        createdAt: '2026-04-29T10:00:00Z',
        updatedAt: '2026-04-30T15:30:00Z',
    },

    {
        id: 'blog-fr-arc-001',
        title: 'AGEC - version 2024 (remplacée)',
        slug: 'agec-version-2024',
        category: 'regulation',
        status: 'Archived',
        author: 'Claire Dubois',
        excerpt: 'Article archivé au profit de la version 2026.',
        body: 'Cet article a été remplacé par les guides AGEC 2026.',
        readTime: '4 min',
        metaTitle: 'AGEC - version 2024',
        metaDescription: 'Archivé au profit de la version 2026.',
        ogImage: 'https://placehold.co/1200x630/png?text=Archive',
        createdAt: '2024-09-01T08:00:00Z',
        updatedAt: '2026-04-22T10:00:00Z',
        publishedAt: '2024-09-02T08:00:00Z',
    },
] as const;

export function blogArticleById(id: string): BlogArticle | undefined {
    return mockBlogArticles.find((a) => a.id === id);
}

export function blogArticlesByArtisan(artisanId: string): readonly BlogArticle[] {
    return mockBlogArticles.filter((a) => a.artisanId === artisanId);
}
