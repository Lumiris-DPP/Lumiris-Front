'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { mockArtisanById } from '@lumiris/mock-data';
import type { Passport } from '@lumiris/types';
import { usePassportScore } from '@/lib/iris/use-passport-score';
import { incrementScanCounter } from '@/lib/scan-counter';
import { getCameraPermissionState, hasSeenCameraPrompt, markCameraPromptSeen } from '@/lib/camera/permission-storage';
import type { processVideoFrame } from '@/lib/scan/qr-processor';
import { IrisRing, type IrisRingStatus } from './iris-ring';
import { ScanResultModal } from './scan-result-modal';
import { CameraDeniedState, QrUnreadableState, NonLumirisQrState } from './empty-states';
import { PermissionPrompt } from './permission-prompt';
import { ManualEntrySheet } from './manual-entry';

const UNREADABLE_TIMEOUT_MS = 12_000;
const FRAME_INTERVAL_MS = 1000 / 30;

type ProcessVideoFrame = typeof processVideoFrame;

export function ScanPassport() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const startedAtRef = useRef<number>(0);
    const lastFrameAtRef = useRef<number>(0);
    const processFrameRef = useRef<ProcessVideoFrame | null>(null);

    const [status, setStatus] = useState<IrisRingStatus>('idle');
    const [phase, setPhase] = useState<'pre-prompt' | 'live'>('live');
    const [match, setMatch] = useState<Passport | null>(null);
    const [manualOpen, setManualOpen] = useState(false);

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
        if (!processFrameRef.current) {
            const mod = await import('@/lib/scan/qr-processor');
            processFrameRef.current = mod.processVideoFrame;
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
        const processFrame = processFrameRef.current;
        if (!video || !processFrame) return;
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

        const nowMs = performance.now();
        if (nowMs - lastFrameAtRef.current < FRAME_INTERVAL_MS) {
            rafRef.current = requestAnimationFrame(tick);
            return;
        }
        lastFrameAtRef.current = nowMs;

        const result = processFrame(video, canvasRef.current);
        if (result.kind === 'matched') {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(60);
            incrementScanCounter();
            stopCamera();
            setMatch(result.passport);
            setStatus('matched');
            return;
        }
        if (result.kind === 'external' || result.kind === 'unknown') {
            stopCamera();
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

    const restart = useCallback(() => {
        setMatch(null);
        startCamera();
    }, [startCamera]);

    const openManualEntry = useCallback(() => {
        setManualOpen(true);
    }, []);

    const onOpenMatch = useCallback(() => {
        if (!match) return;
        stopCamera();
        router.push(`/passeport/${match.id}`);
    }, [match, router, stopCamera]);

    const [now] = useState(() => new Date());
    const matchScore = usePassportScore(match, now);
    const matchArtisan = match ? mockArtisanById(match.artisanId) : undefined;

    return (
        <div className="bg-background relative h-full w-full overflow-hidden">
            <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
                aria-label="Vue caméra"
            />

            <div className="bg-background/20 pointer-events-none absolute inset-0" />

            <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pt-12">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="text-foreground bg-card/70 inline-flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md"
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
                <Link
                    href="/help"
                    aria-label="Aide"
                    className="text-foreground bg-card/70 inline-flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md"
                >
                    <HelpCircle className="h-5 w-5" aria-hidden />
                </Link>
            </header>

            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <IrisRing status={status} />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[max(env(safe-area-inset-bottom),1.5rem)]">
                <button
                    type="button"
                    onClick={openManualEntry}
                    className="text-foreground/80 hover:text-foreground inline-flex h-11 items-center px-4 text-sm underline-offset-4 hover:underline"
                >
                    Saisir manuellement
                </button>
            </div>

            {phase === 'pre-prompt' ? <PermissionPrompt onActivate={onAcceptPrompt} /> : null}

            {status === 'denied' ? <CameraDeniedState onManualEntry={openManualEntry} /> : null}
            {status === 'unreadable' ? <QrUnreadableState onRetry={restart} /> : null}
            {status === 'unknown' ? <NonLumirisQrState onRetry={restart} /> : null}

            {match && matchScore ? (
                <ScanResultModal
                    passport={match}
                    artisan={matchArtisan}
                    score={matchScore}
                    onClose={restart}
                    onOpen={onOpenMatch}
                />
            ) : null}

            <ManualEntrySheet open={manualOpen} onOpenChange={setManualOpen} />
        </div>
    );
}
