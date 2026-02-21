"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Play, Square, Maximize2, Ghost, Sparkles, Zap, Flame, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
}

export function Teleprompter({ content, onClose }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(54);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [isGhostMode, setIsGhostMode] = useState(true); // Default to Ghost for v6

    // Hybrid Scroll State
    const [scrollPosition, setScrollPosition] = useState(0); // in pixels
    const [adaptiveSpeed, setAdaptiveSpeed] = useState(1.5); // pixels per frame

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

    // UNIFIED ACTIVATION: Start + PiP
    const handleStart = async () => {
        if (isActive) {
            setIsActive(false);
            if (pipWindow) pipWindow.close();
            return;
        }

        setIsActive(true);

        // Try to open PiP immediately if supported
        if ('documentPictureInPicture' in window) {
            try {
                const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: 700,
                    height: 200, // Thinner, like a caption bar
                });

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

                setPipWindow(newPipWindow);
                pipRootRef.current = root;

                newPipWindow.addEventListener('pagehide', () => {
                    setPipWindow(null);
                    setIsActive(false);
                }, { once: true });
            } catch (err) {
                console.warn("PiP failed, falling back to modal", err);
            }
        }
    };

    // SPEECH RECOGNITION (V6 Hybrid Input)
    useEffect(() => {
        if (!isActive) {
            setCurrentWordIndex(-1);
            return;
        }

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

            // Search ahead
            const searchWindow = 20;
            let maxMatchIdx = currentWordIndex;

            for (let i = currentWordIndex + 1; i < Math.min(words.length, currentWordIndex + searchWindow); i++) {
                const char = words[i].toLowerCase();
                if (cleanSpeech.includes(char) || cleanSpeech.endsWith(char)) {
                    maxMatchIdx = i;
                }
            }

            if (maxMatchIdx > currentWordIndex) {
                setCurrentWordIndex(maxMatchIdx);
            }
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch (e) { } };
        recognition.start();
        return () => { recognition.onend = null; recognition.stop(); };
    }, [isActive, words, lang, currentWordIndex]);

    // HYBRID SCROLL ENGINE (Automatic + Adaptive Offset)
    const animate = (time: number) => {
        if (!isActive || currentWordIndex === -1) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : scrollContainerRef.current;
        if (!container) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        // Calculate Target Position
        const activeElement = container.querySelector(`[data-index="${currentWordIndex}"]`) as HTMLElement;
        if (activeElement) {
            const containerCenter = container.clientHeight / 2;
            const targetPos = activeElement.offsetTop - containerCenter + (activeElement.clientHeight / 2);

            // HYBRID ADAPTIVE LOGIC:
            // Instead of jumping, we move the scroll position smoothly.
            // If we are far behind the voice, we speed up.
            const currentScroll = container.scrollTop;
            const diff = targetPos - currentScroll;

            // PID-lite controller for speed
            let speedAdjustment = 0;
            if (diff > 50) speedAdjustment = 2.0; // Catch up fast
            else if (diff > 0) speedAdjustment = 1.0; // Catch up slowly
            else if (diff < -20) speedAdjustment = -0.5; // Slow down

            const baseSpeed = 0.8; // Constant drift
            const finalSpeed = baseSpeed + speedAdjustment;

            container.scrollTop += finalSpeed;
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isActive, currentWordIndex, pipWindow]);

    const TeleprompterContent = (
        <div className={`flex flex-col h-full w-full transition-all duration-700 select-none ${isGhostMode ? 'bg-black/40 backdrop-blur-2xl' : 'bg-black'
            } ${pipWindow ? 'cursor-grab active:cursor-grabbing' : ''}`}>

            {/* Minimal Drag Handle / Header */}
            <header className={`flex items-center justify-between px-4 py-1.5 transition-all duration-500 border-b border-white/5 ${isActive && pipWindow ? 'h-0 py-0 opacity-0 overflow-hidden' : ''
                }`}>
                <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-zinc-600" />
                    <span className="text-[8px] font-bold tracking-[0.4em] uppercase text-zinc-500">FLOAT V6</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost" size="sm"
                        className={`h-6 px-2 text-[8px] font-bold rounded-full border ${isGhostMode ? 'text-green-400 border-green-500/30 bg-green-500/5' : 'text-zinc-500 border-zinc-800'
                            }`}
                        onClick={() => setIsGhostMode(!isGhostMode)}
                    >
                        {isGhostMode ? "TRANSPARENT" : "OPAQUE"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-500" onClick={onClose}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </header>

            {/* Scrollable Area */}
            <div
                ref={scrollContainerRef}
                className="scroll-container flex-1 overflow-y-auto scrollbar-hide pt-[30vh] pb-[60vh] px-8"
            >
                <div className="max-w-4xl mx-auto">
                    <div
                        className="leading-[1.6] text-center flex flex-wrap justify-center gap-x-3 gap-y-1 font-bold transition-all duration-500"
                        style={{ fontSize: `${pipWindow ? (fontSize * 0.8) : fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isPast = i < currentWordIndex;

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-700 rounded-md px-1.5 ${isCurrent
                                        ? "text-green-400 scale-110 translate-y-[-2px] drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]"
                                        : isPast
                                            ? "text-white/10"
                                            : "text-white/40"
                                        }`}
                                >
                                    {word}
                                    {isCurrent && (
                                        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Ghost Dock (Only show when not active or not in PiP) */}
            {(!isActive || !pipWindow) && (
                <footer className="shrink-0 p-6 bg-black/20 backdrop-blur-xl border-t border-white/5 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-12 w-full max-w-xl">
                        <Button
                            size="lg"
                            className={`rounded-full h-14 w-14 transition-all duration-500 shadow-2xl ${isActive ? "bg-red-500 shadow-red-500/20" : "bg-green-600 shadow-green-500/20"
                                }`}
                            onClick={handleStart}
                        >
                            {isActive ? <Square className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 ml-1 text-white" />}
                        </Button>

                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <label>Zoom</label>
                                <span className="text-green-500">{fontSize}px</span>
                            </div>
                            <input
                                type="range" min="40" max="150" value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </footer>
            )}

            {/* Status indicator in PiP mode when active */}
            {isActive && pipWindow && (
                <div className="absolute top-2 right-2 pointer-events-none transition-opacity duration-1000 opacity-20">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Main Overlay (Used for setup/fallback) */}
            {!pipWindow && (
                <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-500">
                    {TeleprompterContent}
                </div>
            )}

            {/* Floating Portal */}
            {pipWindow && pipRootRef.current && createPortal(
                TeleprompterContent,
                pipRootRef.current
            )}
        </>
    );
}
