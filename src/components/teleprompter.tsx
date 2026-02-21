"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Play, Square, Maximize2, Ghost, Sparkles, Zap, Flame, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
    autoStart?: boolean;
}

export function Teleprompter({ content, onClose, autoStart = true }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(50);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [isGhostMode, setIsGhostMode] = useState(true);
    const [hasStartedScrolling, setHasStartedScrolling] = useState(false);

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    // Segmentation
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    const totalChars = words.length;

    // UNIFIED ACTIVATION LOGIC
    const triggerStart = async () => {
        if (isActive) return;
        setIsActive(true);

        if ('documentPictureInPicture' in window) {
            try {
                const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: 800,
                    height: 180,
                });

                // Copy Styles
                [...document.styleSheets].forEach((s) => {
                    try {
                        const rules = [...(s as any).cssRules].map(r => r.cssText).join('');
                        const style = newPipWindow.document.createElement('style');
                        style.textContent = rules;
                        newPipWindow.document.head.appendChild(style);
                    } catch (e) {
                        if (s.href) {
                            const link = newPipWindow.document.createElement('link');
                            link.rel = 'stylesheet'; link.href = s.href;
                            newPipWindow.document.head.appendChild(link);
                        }
                    }
                });

                const root = newPipWindow.document.createElement('div');
                root.id = 'pip-root';
                newPipWindow.document.body.appendChild(root);
                newPipWindow.document.body.style.margin = '0';
                newPipWindow.document.body.style.backgroundColor = 'transparent';
                newPipWindow.document.body.style.overflow = 'hidden';
                newPipWindow.document.body.style.cursor = 'grab';

                setPipWindow(newPipWindow);
                pipRootRef.current = root;

                newPipWindow.addEventListener('pagehide', () => {
                    setPipWindow(null);
                    setIsActive(false);
                    onClose();
                }, { once: true });
            } catch (err) {
                console.warn("PiP failed", err);
            }
        }
    };

    // Auto-trigger on mount if autoStart is true
    useEffect(() => {
        if (autoStart) {
            triggerStart();
        }
    }, []);

    // SPEECH RECOGNITION
    useEffect(() => {
        if (!isActive) return;

        const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang === "zh" ? "zh-CN" : "en-US";

        recognition.onresult = (event: any) => {
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                sessionTranscript += event.results[i][0].transcript;
            }
            const cleanSpeech = sessionTranscript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();

            // Match Logic
            const searchWindow = 20;
            let maxMatchIdx = currentWordIndex;

            for (let i = currentWordIndex + 1; i < Math.min(words.length, currentWordIndex + searchWindow); i++) {
                const char = words[i].toLowerCase();
                if (cleanSpeech.includes(char) || cleanSpeech.endsWith(char)) {
                    maxMatchIdx = i;
                }
            }

            if (maxMatchIdx > currentWordIndex) {
                if (!hasStartedScrolling) setHasStartedScrolling(true);
                setCurrentWordIndex(maxMatchIdx);
            }
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch (e) { } };
        recognition.start();
        return () => { recognition.onend = null; recognition.stop(); };
    }, [isActive, words, lang, currentWordIndex, hasStartedScrolling]);

    // HYBRID ADAPTIVE SCROLL ENGINE
    const animate = () => {
        if (!isActive || !hasStartedScrolling) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : scrollContainerRef.current;
        if (!container) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        // Base scroll speed (pixels per frame)
        let speed = 0.5;

        // Adaptive speed factor
        const activeElement = container.querySelector(`[data-index="${currentWordIndex}"]`) as HTMLElement;
        if (activeElement) {
            const containerCenter = container.clientHeight / 2;
            const targetPos = activeElement.offsetTop - containerCenter + (activeElement.clientHeight / 2);
            const diff = targetPos - container.scrollTop;

            if (diff > 100) speed = 2.5; // Far behind
            else if (diff > 20) speed = 1.2; // Slightly behind
            else if (diff < -20) speed = 0.2; // Ahead of speech, slow down
        }

        container.scrollTop += speed;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isActive, hasStartedScrolling, currentWordIndex, pipWindow]);

    const TeleprompterContent = (
        <div className={`flex flex-col h-full w-full transition-all duration-700 select-none overflow-hidden ${isGhostMode ? 'bg-black/30 backdrop-blur-3xl' : 'bg-black'
            }`}>
            {/* Native Appearance Grip Handle */}
            <div className={`h-1.5 flex justify-center items-center py-2 shrink-0 ${pipWindow ? 'opacity-40' : 'hidden'}`}>
                <div className="w-16 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Standard Header (only in modal view or when hovered in PiP) */}
            {!pipWindow && (
                <header className="flex items-center justify-between px-4 py-1.5 border-b border-white/5 shrink-0 bg-zinc-900/40">
                    <div className="flex items-center gap-2">
                        <Zap className={`h-3 w-3 ${isActive ? 'text-green-400' : 'text-zinc-600'}`} />
                        <span className="text-[8px] font-bold tracking-[0.4em] uppercase text-zinc-500">PROMPTER V6.1</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-500" onClick={onClose}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </header>
            )}

            {/* Scrolling Viewport */}
            <div
                ref={scrollContainerRef}
                className="scroll-container flex-1 overflow-y-auto scrollbar-hide pt-[40vh] pb-[60vh] px-12"
            >
                <div className="max-w-4xl mx-auto">
                    <div
                        className="leading-[1.6] text-center flex flex-wrap justify-center gap-x-4 gap-y-2 font-black transition-all duration-500"
                        style={{ fontSize: `${pipWindow ? (fontSize * 0.7) : fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isPast = i < currentWordIndex;

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-500 rounded-md px-1 relative ${isCurrent
                                            ? "text-green-400 scale-110 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)] z-20"
                                            : isPast
                                                ? "text-white/10"
                                                : "text-white/40"
                                        }`}
                                >
                                    {word}
                                    {isCurrent && (
                                        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-500/80 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Floating Hint Overlay */}
            {!hasStartedScrolling && isActive && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center animate-pulse">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-green-500/60 font-medium">
                        Waiting for voice...
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {!pipWindow && (
                <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-500">
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
