import type { Subscription } from '@lumiris/types';
import { PRICE_LINES } from '@/lib/pricing';

export function openInvoiceWindow(sub: Subscription) {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
    if (!win) return;
    const now = new Date();
    const invoiceNo = `LMR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${sub.id.slice(-5).toUpperCase()}`;
    const tierLabel =
        sub.subscriberKind === 'artisan'
            ? `ATELIER ${sub.artisanTier ?? sub.tier}${sub.plus ? ' + ATELIER+' : ''}`
            : PRICE_LINES.local.label;
    const line1Eur = sub.mrrEur;
    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Facture ${invoiceNo}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; color:#1c1c1e; padding:48px; max-width:720px; margin:0 auto; }
  header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid #d4d4d8; padding-bottom:16px; }
  h1 { font-size:22px; margin:0; letter-spacing:-0.02em; }
  .meta { color:#71717a; font-size:12px; }
  table { width:100%; border-collapse:collapse; margin-top:32px; }
  th, td { padding:10px 0; text-align:left; font-size:13px; }
  th { color:#71717a; font-weight:500; border-bottom:1px solid #e4e4e7; }
  tfoot td { font-weight:600; border-top:1px solid #d4d4d8; padding-top:16px; }
  .right { text-align:right; }
  .small { color:#a1a1aa; font-size:11px; margin-top:48px; }
</style></head>
<body>
  <header>
    <div>
      <h1>LUMIRIS — Facture</h1>
      <p class="meta">${invoiceNo} · émise le ${now.toLocaleDateString('fr-FR')}</p>
    </div>
    <div class="meta right">
      LUMIRIS SAS<br>RCS Paris · TVA FR 00 000000000<br>contact@lumiris.fr
    </div>
  </header>
  <section style="margin-top:32px;">
    <p class="meta">Facturé à</p>
    <p><strong>${sub.displayName}</strong><br>${sub.city}<br>Compte : ${sub.subscriberId}</p>
  </section>
  <table>
    <thead><tr><th>Désignation</th><th class="right">Période</th><th class="right">Montant HT</th></tr></thead>
    <tbody>
      <tr>
        <td>${tierLabel}</td>
        <td class="right">${new Date(sub.lastChargeAt ?? sub.startedAt).toLocaleDateString('fr-FR')} → ${new Date(sub.nextBillingAt).toLocaleDateString('fr-FR')}</td>
        <td class="right">${line1Eur.toLocaleString('fr-FR')} €</td>
      </tr>
    </tbody>
    <tfoot>
      <tr><td>Total HT</td><td></td><td class="right">${line1Eur.toLocaleString('fr-FR')} €</td></tr>
    </tfoot>
  </table>
  <p class="small">Document généré par LUMIRIS Back-office · stub V1.</p>
  <script>setTimeout(() => window.print(), 250);</script>
</body></html>`;
    win.document.write(html);
    win.document.close();
}
