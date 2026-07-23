import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Keyboard } from 'lucide-react';
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
    const navigate = useNavigate();
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
        if (result.kind === 'public-code') {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(60);
            incrementScanCounter();
            stopCamera();
            navigate(`/p/${result.code}`);
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
    }, [stopCamera, navigate]);

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
        navigate(`/passeport/${match.id}`);
    }, [match, navigate, stopCamera]);

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
                    onClick={() => navigate(-1)}
                    aria-label="Retour"
                    className="text-foreground bg-card/70 inline-flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md"
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
                <Link
                    to="/help"
                    aria-label="Aide"
                    className="text-foreground bg-card/70 inline-flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md"
                >
                    <HelpCircle className="h-5 w-5" aria-hidden />
                </Link>
            </header>

            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <IrisRing status={status} />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-6 pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">
                <button
                    type="button"
                    onClick={openManualEntry}
                    className="bg-card/70 text-foreground hover:bg-card/90 inline-flex h-12 items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-semibold backdrop-blur-md active:scale-[0.98]"
                >
                    <Keyboard className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Saisir un code à la main
                </button>
            </div>

            {phase === 'pre-prompt' ? <PermissionPrompt onActivate={onAcceptPrompt} /> : null}

            {status === 'denied' ? <CameraDeniedState onAllow={startCamera} onManualEntry={openManualEntry} /> : null}
            {status === 'unreadable' ? <QrUnreadableState onRetry={restart} onManualEntry={openManualEntry} /> : null}
            {status === 'unknown' ? <NonLumirisQrState onRetry={restart} onManualEntry={openManualEntry} /> : null}

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
