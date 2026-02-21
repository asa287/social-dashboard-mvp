"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Mic, Settings, X, Play, Square, Video, Info, Maximize2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
    externalPipWindow?: Window | null;
}

export function Teleprompter({ content, onClose, externalPipWindow = null }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(50);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [progress, setProgress] = useState(0);

    // Internal PiP state (fallback or controlled)
    const [internalPipWindow, setInternalPipWindow] = useState<Window | null>(null);
    const pipWindow = externalPipWindow || internalPipWindow;
    const pipRootRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    const lastMatchTime = useRef<number>(Date.now());
    const [adaptiveSpeed, setAdaptiveSpeed] = useState(1);

    // Initialize root in pipWindow if it exists
    useEffect(() => {
        if (pipWindow && !pipRootRef.current) {
            let root = pipWindow.document.getElementById('pip-root') as HTMLDivElement;
            if (!root) {
                root = pipWindow.document.createElement('div');
                root.id = 'pip-root';
                pipWindow.document.body.appendChild(root);
            }
            pipRootRef.current = root;

            // Re-apply styles if it's the external window
            const copyStyles = () => {
                [...document.styleSheets].forEach((sheet) => {
                    try {
                        const css = [...(sheet as any).cssRules].map(r => r.cssText).join('');
                        const s = pipWindow.document.createElement('style');
                        s.textContent = css;
                        pipWindow.document.head.appendChild(s);
                    } catch (e) {
                        if (sheet.href) {
                            const l = pipWindow.document.createElement('link');
                            l.rel = 'stylesheet'; l.href = sheet.href;
                            pipWindow.document.head.appendChild(l);
                        }
                    }
                });
                pipWindow.document.body.style.backgroundColor = '#000';
                pipWindow.document.body.style.margin = '0';
            };
            copyStyles();

            const handleClose = () => {
                setInternalPipWindow(null);
                pipRootRef.current = null;
                onClose(); // Close the whole feature if PiP is closed? Or just return to main?
                // Let's just close the whole thing for now as per user request flow
            };
            pipWindow.addEventListener('pagehide', handleClose, { once: true });
            return () => pipWindow.removeEventListener('pagehide', handleClose);
        }
    }, [pipWindow]);

    // Speech Recognition & Velocity Tracking (V6: Hyper-sensitive)
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
            let recentTranscript = "";
            const lookbackChunks = 3;
            for (let i = Math.max(0, event.results.length - lookbackChunks); i < event.results.length; i++) {
                recentTranscript += event.results[i][0].transcript;
            }
            const cleanSpeech = recentTranscript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();

            // Depth search for the "best" match block
            const searchWindow = 15;
            let bestIdx = -1;

            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + searchWindow, words.length); i++) {
                const char = words[i].toLowerCase();
                const nextChar = i + 1 < words.length ? words[i + 1].toLowerCase() : "";

                // Match the character or the next pair for robustness
                if (cleanSpeech.includes(char) || (nextChar && cleanSpeech.includes(char + nextChar))) {
                    bestIdx = i;
                }
            }

            if (bestIdx > currentWordIndex) {
                const now = Date.now();
                const elapsedSinceLastMatch = (now - lastMatchTime.current) / 1000;
                const charDistance = bestIdx - currentWordIndex;

                if (elapsedSinceLastMatch > 0.1) {
                    // Update the "rhythm" of speech
                    const pace = charDistance / elapsedSinceLastMatch;
                    setAdaptiveSpeed(Math.min(Math.max(pace, 1.2), 15));
                }

                lastMatchTime.current = now;
                setCurrentWordIndex(bestIdx);
                // Force progress to sync if it's falling behind
                if (progress < bestIdx) setProgress(bestIdx);
            }
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch { } };
        recognition.start();

        return () => {
            recognition.onend = null;
            recognition.stop();
        };
    }, [isActive, words, lang, currentWordIndex, progress]);

    // Smooth High-Resolution Interpolation
    useEffect(() => {
        if (!isActive || currentWordIndex >= words.length - 1) return;

        let frameId: number;
        let lastTimestamp = performance.now();

        const animate = (timestamp: number) => {
            const dt = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            setProgress(prev => {
                // We advance at the current adaptive speed
                return prev + dt * adaptiveSpeed;
            });

            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [isActive, adaptiveSpeed, currentWordIndex, words.length]);

    // Precise Center-Point Scrolling
    useEffect(() => {
        const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : containerRef.current;
        if (container) {
            const focusIdx = Math.floor(progress);
            const activeEl = container.querySelector(`[data-index="${focusIdx}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [progress, pipWindow]);

    const TeleprompterContent = (
        <div className={`flex flex-col bg-black text-white font-sans overflow-hidden h-full w-full ${pipWindow ? 'fixed inset-0' : ''}`}>
            {/* Header / Info bar */}
            <header className="flex items-center justify-between px-6 py-2 bg-zinc-900/80 border-b border-white/5 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className={`h-3 w-3 ${isActive ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-500'}`} />
                    <span className="text-[9px] font-black tracking-[0.4em] uppercase opacity-60">AI Smart Prompt</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-500" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </header>

            {/* THE KTV VIEWPORT */}
            <div
                ref={containerRef}
                className="scroll-container flex-1 overflow-y-auto scrollbar-hide pt-[25vh] pb-[40vh] px-8 md:px-12"
            >
                <div className="max-w-4xl mx-auto">
                    <div
                        className="leading-[1.5] text-center select-none flex flex-wrap justify-center gap-x-2 transition-all duration-300 relative"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const wordProgress = Math.max(0, Math.min(1, progress - i));

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`relative transition-all duration-300 rounded px-1.5 py-1 my-1 ${i === Math.floor(progress)
                                            ? "scale-110 z-10 font-black text-white"
                                            : "opacity-90"
                                        }`}
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, #22c55e ${wordProgress * 100}%, #52525b ${wordProgress * 100}%)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        transition: 'all 0.05s linear'
                                    }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Glass Controlls */}
            <footer className="shrink-0 p-8 bg-black/90 border-t border-white/5 flex flex-col items-center gap-5 backdrop-blur-xl">
                <Button
                    size="lg"
                    className={`rounded-full h-14 w-14 transition-all duration-500 ${isActive
                            ? "bg-red-500 hover:bg-red-600 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                            : "bg-green-600 hover:bg-green-700 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                        }`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 ml-1 text-white" />}
                </Button>

                <div className="flex gap-12 w-full max-w-sm">
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                            <label>Zoom</label>
                            <span className="text-green-500">{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="30" max="150" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
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
            {pipWindow && pipRootRef.current && createPortal(
                TeleprompterContent,
                pipRootRef.current
            )}
        </>
    );
}
