"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Mic, MonitorPlay, Settings, X, Play, Square, Video, Info, Maximize2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
}

export function Teleprompter({ content, onClose }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(48);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [progress, setProgress] = useState(0);

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);
    const hasAttemptedAutoPip = useRef(false);

    // Optimized segmentation for tracking
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    // Tracking state
    const lastMatchTime = useRef<number>(Date.now());
    const [adaptiveSpeed, setAdaptiveSpeed] = useState(1);
    const recognitionRef = useRef<any>(null);

    // Hyper-sensitive matching function
    const handleVoiceResult = useCallback((transcript: string) => {
        const cleanSpeech = transcript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();
        const searchRange = 30;
        let bestIdx = -1;

        for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + searchRange, words.length); i++) {
            const char = words[i].toLowerCase();
            const phrase = char + (words[i + 1] || "");

            // GREEDY MATCHING
            if (cleanSpeech.includes(phrase) || cleanSpeech.endsWith(char)) {
                bestIdx = i;
            }
        }

        if (bestIdx > currentWordIndex) {
            const now = Date.now();
            const timeDiff = (now - lastMatchTime.current) / 1000;
            const distance = bestIdx - currentWordIndex;

            if (timeDiff > 0.05) {
                const newSpeed = Math.min(Math.max(distance / timeDiff, 0.5), 25);
                setAdaptiveSpeed(newSpeed);
            }

            lastMatchTime.current = now;
            setCurrentWordIndex(bestIdx);
        }
    }, [currentWordIndex, words]);

    // Voice recognition setup
    useEffect(() => {
        if (!isActive) {
            setCurrentWordIndex(-1);
            setProgress(0);
            return;
        }

        const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang === "zh" ? "zh-CN" : "en-US";

        recognition.onresult = (event: any) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            handleVoiceResult(fullTranscript);
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch { } };
        recognition.start();
        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, [isActive, lang, handleVoiceResult]);

    // Smooth visual interpolation
    useEffect(() => {
        if (!isActive || currentWordIndex >= words.length - 1) return;
        let lastTimestamp = performance.now();
        const animate = (timestamp: number) => {
            const dt = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;
            setProgress(prev => {
                const next = prev + (dt * adaptiveSpeed) / 1.1;
                return Math.min(next, currentWordIndex + 1);
            });
            requestAnimationFrame(animate);
        };
        const id = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(id);
    }, [isActive, adaptiveSpeed, currentWordIndex, words.length]);

    // Scrolling logic
    useEffect(() => {
        const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : document.querySelector('.main-tele-container');
        if (container) {
            const activeIdx = Math.floor(progress);
            const activeElement = container.querySelector(`[data-index="${activeIdx}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [progress, pipWindow]);

    // PiP Launch
    const launchPip = useCallback(async () => {
        if (!('documentPictureInPicture' in window) || pipWindow) return;
        try {
            const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 600,
                height: 480,
            });

            // Robust Style Injection
            [...document.styleSheets].forEach((sheet) => {
                try {
                    const style = newPipWindow.document.createElement('style');
                    const cssRules = [...(sheet as any).cssRules].map(r => r.cssText).join('');
                    style.textContent = cssRules;
                    newPipWindow.document.head.appendChild(style);
                } catch (e) {
                    if (sheet.href) {
                        const link = newPipWindow.document.createElement('link');
                        link.rel = 'stylesheet'; link.href = sheet.href;
                        newPipWindow.document.head.appendChild(link);
                    }
                }
            });

            // Set up body
            newPipWindow.document.body.style.margin = '0';
            newPipWindow.document.body.style.backgroundColor = 'black';
            newPipWindow.document.body.style.overflow = 'hidden';

            const root = newPipWindow.document.createElement('div');
            root.id = 'pip-root';
            root.style.height = '100vh';
            newPipWindow.document.body.appendChild(root);

            setPipWindow(newPipWindow);
            pipRootRef.current = root;
            newPipWindow.addEventListener('pagehide', () => { setPipWindow(null); pipRootRef.current = null; }, { once: true });
        } catch (err) { console.error(err); }
    }, [pipWindow]);

    // AUTO-PIP ON MOUNT (Triggered by the same click that mounts the component)
    useEffect(() => {
        if (!hasAttemptedAutoPip.current) {
            hasAttemptedAutoPip.current = true;
            launchPip();
        }
    }, [launchPip]);

    const TeleprompterContent = (
        <div className={`flex flex-col bg-black text-white font-sans overflow-hidden h-full w-full ${pipWindow ? 'fixed inset-0' : ''}`}>
            <header className="flex items-center justify-between px-6 py-2 bg-zinc-900 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className={`h-3 w-3 ${isActive ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-500'}`} />
                    <span className="text-[9px] font-black tracking-[0.3em] uppercase">{t.create.teleprompter.title}</span>
                </div>
                {!pipWindow && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-500" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </header>

            <div className="scroll-container main-tele-container flex-1 overflow-y-auto scrollbar-hide pt-[30vh] pb-[40vh] px-8 md:px-16">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="leading-[1.5] text-center select-none flex flex-wrap justify-center gap-x-2 relative"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const localProgress = Math.max(0, Math.min(1, progress - i));
                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`relative px-1 py-1 my-1 transition-transform duration-300 ${i === Math.floor(progress) ? 'scale-110 z-10' : ''}`}
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, #22c55e ${localProgress * 100}%, #71717a ${localProgress * 100}%)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            <footer className="shrink-0 p-8 bg-black border-t border-white/10 flex flex-col items-center gap-4">
                <Button
                    size="lg"
                    className={`rounded-full h-14 w-14 transition-all duration-500 shadow-xl ${isActive ? "bg-red-500 shadow-red-500/20" : "bg-green-600 shadow-green-500/20"}`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 ml-1 text-white" />}
                </Button>
                <div className="flex gap-10 w-full max-w-sm">
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                            <span>{t.create.teleprompter.fontSize}</span>
                            <span className="text-zinc-300">{fontSize}px</span>
                        </div>
                        <input type="range" min="30" max="150" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1 bg-zinc-800 accent-green-500 appearance-none cursor-pointer rounded-full" />
                    </div>
                </div>
            </footer>
        </div>
    );

    return (
        <>
            {!pipWindow && (
                <div className="fixed inset-0 z-[100] flex">
                    {TeleprompterContent}
                </div>
            )}
            {pipWindow && pipRootRef.current && createPortal(TeleprompterContent, pipRootRef.current)}
        </>
    );
}
