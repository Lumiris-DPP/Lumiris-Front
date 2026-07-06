/** Taille maximale d'un document uploadé (facture, certificat) : 5 Mo. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Libellé FR de la taille max, pour les hints et messages d'UI. */
export const MAX_UPLOAD_LABEL = '5 Mo';

/** Vrai si le type MIME (d'un File) est une image. */
export function isImageMime(type: string): boolean {
    return type.startsWith('image/');
}

/** Vrai si la source (data URL ou chemin/URL) pointe vers une image. */
export function isImageSrc(src: string): boolean {
    return src.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(src);
}
