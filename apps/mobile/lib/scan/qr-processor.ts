import jsQR from 'jsqr';
import type { ExternalDpp, Passport } from '@lumiris/types';
import { decodeQrPayload, resolvePassportFromScan } from '@/features/scan-passport/qr-decoder';

type FrameResult =
    | { kind: 'no-frame' }
    | { kind: 'no-code' }
    | { kind: 'matched'; passport: Passport; raw: string }
    | { kind: 'public-code'; code: string; accessToken?: string; raw: string }
    | { kind: 'external'; dpp: ExternalDpp; raw: string }
    | { kind: 'unknown'; raw: string };

export function processVideoFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): FrameResult {
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return { kind: 'no-frame' };
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return { kind: 'no-frame' };

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { kind: 'no-frame' };

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
    if (!code?.data) return { kind: 'no-code' };

    const decoded = decodeQrPayload(code.data);
    const resolved = resolvePassportFromScan(decoded);
    if (resolved.kind === 'lumiris-passport') {
        return { kind: 'matched', passport: resolved.passport, raw: code.data };
    }
    if (resolved.kind === 'lumiris-public-code') {
        return { kind: 'public-code', code: resolved.code, accessToken: resolved.accessToken, raw: code.data };
    }
    if (resolved.kind === 'external-dpp') {
        return { kind: 'external', dpp: resolved.dpp, raw: code.data };
    }
    return { kind: 'unknown', raw: code.data };
}
