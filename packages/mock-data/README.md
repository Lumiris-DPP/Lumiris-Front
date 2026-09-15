# @lumiris/mock-data

Demo fixtures shared across surfaces. Pure data, no logic.

| Entry                             | Symbols                                         |
| --------------------------------- | ----------------------------------------------- |
| `@lumiris/mock-data/dpp`          | `mockDpps`, `mockDppById`, `mockDppBySku`       |
| `@lumiris/mock-data/certificates` | `mockCertificates`, `mockCertificatesByFactory` |
| `@lumiris/mock-data/journal`      | `mockJournalArticles`, `mockJournalArticleById` |
| `@lumiris/mock-data/regulatory`   | `mockRegulatoryItems`                           |
| `@lumiris/mock-data/team`         | `mockTeamActivity` + `MockTeamActivityEntry`    |
| `@lumiris/mock-data/kpi`          | `mockKpi` + `MockKpi`                           |

## Why a package, not `apps/admin/lib`?

Web and mobile now showcase the same SKUs as the admin demo without
re-typing fixtures. When the API ships (roadmap prompt #2), this package
keeps E2E and Storybook seeds aligned with what production will return.
