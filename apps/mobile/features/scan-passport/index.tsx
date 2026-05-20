'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { mockArtisanById } from '@lumiris/mock-data';
import type { ExternalDpp, Passport } from '@lumiris/types';
import { usePassportScore } from '@/lib/iris/use-passport-score';
import { computeExternalScore } from '@/lib/iris/external-score';
import { incrementScanCounter } from '@/lib/scan-counter';
import { processVideoFrame } from '@/lib/scan/qr-processor';
import { getCameraPermissionState, hasSeenCameraPrompt, markCameraPromptSeen } from '@/lib/camera/permission-storage';
import { IrisRing, type IrisRingStatus } from './iris-ring';
import { ScanResultModal } from './scan-result-modal';
import { CameraDeniedState, QrUnreadableState, PassportNotFoundState } from './empty-states';
import { PermissionPrompt } from './permission-prompt';

const UNREADABLE_TIMEOUT_MS = 12_000;

const STATUS_CHIP: Record<IrisRingStatus, { label: string; dot: string }> = {
    idle: { label: 'Ready', dot: 'bg-muted-foreground' },
    scanning: { label: 'Scanning', dot: 'bg-iris-grade-b' },
    matched: { label: 'Locked', dot: 'bg-iris-grade-a' },
    denied: { label: 'Caméra off', dot: 'bg-lumiris-rose' },
    unreadable: { label: 'Illisible', dot: 'bg-lumiris-amber' },
    unknown: { label: 'Inconnu', dot: 'bg-lumiris-orange' },
};

export function ScanPassport() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const startedAtRef = useRef<number>(0);

    const [status, setStatus] = useState<IrisRingStatus>('idle');
    const [phase, setPhase] = useState<'pre-prompt' | 'live'>('live');
    const [match, setMatch] = useState<
        | { kind: 'lumiris-passport'; passport: Passport; raw: string }
        | { kind: 'external-dpp'; dpp: ExternalDpp; raw: string }
        | null
    >(null);
    const [unknownRaw, setUnknownRaw] = useState<string>('');

    const stopCamera = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setStatus('denied');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            streamRef.current = stream;
            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;
                await video.play();
            }
            startedAtRef.current = performance.now();
            setStatus('scanning');
        } catch {
            setStatus('denied');
        }
    }, []);

    const tick = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

        const result = processVideoFrame(video, canvasRef.current);
        if (result.kind === 'matched') {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(60);
            incrementScanCounter();
            stopCamera();
            setMatch({ kind: 'lumiris-passport', passport: result.passport, raw: result.raw });
            setStatus('matched');
            return;
        }
        if (result.kind === 'external') {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(60);
            incrementScanCounter();
            stopCamera();
            setMatch({ kind: 'external-dpp', dpp: result.dpp, raw: result.raw });
            setStatus('matched');
            return;
        }
        if (result.kind === 'unknown') {
            stopCamera();
            setUnknownRaw(result.raw);
            setStatus('unknown');
            return;
        }
        if (performance.now() - startedAtRef.current > UNREADABLE_TIMEOUT_MS) {
            stopCamera();
            setStatus('unreadable');
            return;
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [stopCamera]);

    useEffect(() => {
        if (status === 'scanning') {
            rafRef.current = requestAnimationFrame(tick);
        }
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [status, tick]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const state = await getCameraPermissionState();
            if (cancelled) return;
            if (state === 'granted') {
                setPhase('live');
                startCamera();
                return;
            }
            if (state === 'denied' || !hasSeenCameraPrompt()) {
                setPhase('pre-prompt');
                return;
            }
            setPhase('live');
            startCamera();
        })();
        return () => {
            cancelled = true;
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    const onAcceptPrompt = useCallback(() => {
        markCameraPromptSeen();
        setPhase('live');
        startCamera();
    }, [startCamera]);

    const onDeferPrompt = useCallback(() => {
        router.push('/scan/manual');
    }, [router]);

    const restart = useCallback(() => {
        setMatch(null);
        setUnknownRaw('');
        startCamera();
    }, [startCamera]);

    const openPassport = useCallback(
        (passportId: string) => {
            stopCamera();
            router.push(`/passeport/${passportId}`);
        },
        [router, stopCamera],
    );

    const openExternalDpp = useCallback(
        (gtin: string) => {
            stopCamera();
            router.push(`/dpp/${gtin}`);
        },
        [router, stopCamera],
    );

    const openManualEntry = useCallback(() => {
        stopCamera();
        router.push('/scan/manual');
    }, [router, stopCamera]);

    const [now] = useState(() => new Date());
    const lumirisMatch = match?.kind === 'lumiris-passport' ? match : null;
    const lumirisScore = usePassportScore(lumirisMatch?.passport ?? null, now);
    const externalScore = useMemo(
        () => (match?.kind === 'external-dpp' ? computeExternalScore(match.dpp, now) : null),
        [match, now],
    );
    const matchScore = match?.kind === 'external-dpp' ? externalScore : lumirisScore;
    const matchArtisan = lumirisMatch ? mockArtisanById(lumirisMatch.passport.artisanId) : undefined;
    const onOpenMatch = useCallback(() => {
        if (!match) return;
        if (match.kind === 'lumiris-passport') openPassport(match.passport.id);
        else openExternalDpp(match.dpp.gtin);
    }, [match, openPassport, openExternalDpp]);

    const chip = STATUS_CHIP[status];

    return (
        <div className="bg-background relative h-full w-full overflow-hidden">
            <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
                aria-label="Vue caméra"
            />

            <div className="bg-background/30 pointer-events-none absolute inset-0" />

            <motion.header
                className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <div>
                    <h1 className="text-foreground text-base font-bold tracking-tight">LUMIRIS</h1>
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.2em]">Vision</p>
                </div>
                <div
                    className="border-border bg-card/80 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur-md"
                    role="status"
                    aria-label={`Statut scanner : ${chip.label}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} aria-hidden />
                    <span className="text-foreground text-xs font-medium">{chip.label}</span>
                </div>
            </motion.header>

            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <IrisRing status={status} />
            </div>

            <motion.div
                className="absolute bottom-28 left-0 right-0 z-20 flex flex-col items-center gap-3 px-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <p className="text-muted-foreground text-center text-xs">
                    Approche le QR du passeport jusqu&apos;à ce qu&apos;il rentre dans le cadre.
                </p>
                <button
                    type="button"
                    onClick={openManualEntry}
                    className="border-border/60 bg-card/80 text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-md"
                >
                    <KeyRound className="h-3.5 w-3.5" />
                    Saisir un identifiant
                </button>
            </motion.div>

            {phase === 'pre-prompt' ? <PermissionPrompt onActivate={onAcceptPrompt} onDefer={onDeferPrompt} /> : null}

            {status === 'denied' ? <CameraDeniedState onRetry={startCamera} onManualEntry={openManualEntry} /> : null}
            {status === 'unreadable' ? <QrUnreadableState onRetry={restart} onManualEntry={openManualEntry} /> : null}
            {status === 'unknown' ? (
                <PassportNotFoundState raw={unknownRaw} onRetry={restart} onSubmitManualId={openPassport} />
            ) : null}

            {match && matchScore ? (
                <ScanResultModal
                    result={
                        match.kind === 'lumiris-passport'
                            ? { kind: 'lumiris-passport', passport: match.passport, artisan: matchArtisan }
                            : { kind: 'external-dpp', dpp: match.dpp }
                    }
                    score={matchScore}
                    onClose={restart}
                    onOpen={onOpenMatch}
                />
            ) : null}
        </div>
    );
}
