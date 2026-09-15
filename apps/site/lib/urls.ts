// Origines publiques, inlinées au build par Next. Une image construite sans elles sert des
// canoniques, un sitemap et des données structurées qui désignent un autre domaine que celui
// qui la sert — d'où les valeurs de repli sur le domaine de production.
export const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://lumiris.eu';

export const SIGNUP_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? 'https://app.lumiris.eu';
