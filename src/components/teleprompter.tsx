"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Mic, MonitorPlay, Settings, X, Play, Square, Video, Info, Maximize2, Ghost, Sparkles, Zap, Flame } from "lucide-react";
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
    const [isGhostMode, setIsGhostMode] = useState(false);

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);

    // Segmentation
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    const totalChars = words.length;

    // Progress for Hyper-Liquid Rendering (Percentage)
    const [progress, setProgress] = useState(0);

    // Speech Recognition Logic
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
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                sessionTranscript += event.results[i][0].transcript;
            }

            const cleanSpeech = sessionTranscript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();

            const searchWindow = 15;
            let maxMatchIdx = currentWordIndex;

            for (let i = currentWordIndex + 1; i < Math.min(words.length, currentWordIndex + searchWindow); i++) {
                const char = words[i].toLowerCase();
                if (cleanSpeech.includes(char) || cleanSpeech.endsWith(char)) {
                    maxMatchIdx = i;
                }
            }

            if (maxMatchIdx > currentWordIndex) {
                setCurrentWordIndex(maxMatchIdx);
                // Calculate precise character progress
                const p = ((maxMatchIdx + 1) / totalChars) * 100;
                setProgress(p);
            }
        };

        recognition.onend = () => {
            if (isActive) {
                try { recognition.start(); } catch (e) { }
            };
        };

        recognition.start();
        return () => {
            recognition.onend = null;
            recognition.stop();
        };
    }, [isActive, words, lang, currentWordIndex, totalChars]);

    // Centered Scrolling
    useEffect(() => {
        const scrollToActive = () => {
            const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : document.querySelector('.main-tele-container');
            if (currentWordIndex !== -1 && container) {
                const activeElement = container.querySelector(`[data-index="${currentWordIndex}"]`);
                if (activeElement) {
                    activeElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            }
        };
        scrollToActive();
    }, [currentWordIndex, pipWindow]);

    // PiP Portal
    const handlePip = async () => {
        if (!('documentPictureInPicture' in window)) return;
        try {
            const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 600,
                height: 450,
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

            setPipWindow(newPipWindow);
            pipRootRef.current = root;

            newPipWindow.addEventListener('pagehide', () => setPipWindow(null), { once: true });
        } catch (err) { console.error(err); }
    };

    const TeleprompterContent = (
        <div className={`flex flex-col h-full w-full transition-all duration-1000 ${isGhostMode ? 'bg-black/10 backdrop-blur-3xl' : 'bg-black'
            } ${pipWindow ? 'fixed inset-0' : ''}`}>

            {/* Header */}
            <header className={`flex items-center justify-between px-6 py-2 transition-all duration-500 border-b ${isGhostMode ? 'border-white/5 opacity-10 hover:opacity-100' : 'bg-zinc-900/60 border-white/5'
                } shrink-0`}>
                <div className="flex items-center gap-2">
                    <Flame className={`h-3 w-3 ${isActive ? 'text-orange-500 animate-pulse' : 'text-zinc-600'}`} />
                    <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-zinc-500">LIQUID V5.3</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-3 text-[9px] font-bold rounded-full transition-all border ${isGhostMode ? 'text-green-400 bg-green-400/20 border-green-500/50' : 'text-zinc-500 border-zinc-800'
                            }`}
                        onClick={() => setIsGhostMode(!isGhostMode)}
                    >
                        {isGhostMode ? "TRANSPARENT ON" : "OPAQUE"}
                    </Button>
                    {!pipWindow && (
                        <Button
                            variant="ghost" size="sm"
                            className="h-7 px-3 text-[9px] font-bold bg-white/5 text-blue-400 border border-white/10 rounded-full"
                            onClick={handlePip}
                        >
                            POP-OUT
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-500" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* HYPER-LIQUID VIEWPORT */}
            <div
                className="scroll-container main-tele-container flex-1 overflow-y-auto scrollbar-hide pt-[40vh] pb-[60vh] px-12"
            >
                <div className="max-w-5xl mx-auto">
                    <div
                        className="leading-[1.6] text-center select-none flex flex-wrap justify-center gap-x-3 gap-y-2 font-black transition-all duration-500"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isPast = i < currentWordIndex;

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-700 rounded-lg px-2 text-center inline-block relative ${isCurrent
                                            ? "text-green-400 scale-125 translate-y-[-10%] z-20"
                                            : isPast
                                                ? "text-white/10"
                                                : "text-white/30"
                                        }`}
                                >
                                    {word}

                                    {/* Liquid Glow Underline */}
                                    {isCurrent && (
                                        <>
                                            <div className="absolute inset-0 bg-green-400/10 blur-xl scale-150 -z-10 animate-pulse" />
                                            <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,1)] scale-x-110" />
                                        </>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Ghost Panel */}
            <footer className={`shrink-0 p-8 transition-all duration-700 ${isGhostMode && isActive ? 'h-0 p-0 opacity-0' : 'bg-black/20 backdrop-blur-2xl border-t border-white/5'
                } flex flex-col items-center gap-6`}>
                <div className="flex items-center gap-16 w-full max-w-2xl px-12">
                    <Button
                        size="lg"
                        className={`rounded-full h-16 w-16 transition-all duration-500 border-2 ${isActive ? "bg-red-500 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "bg-green-600 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                            }`}
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Square className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 ml-1 text-white" />}
                    </Button>

                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <label>Zoom Level</label>
                            <span className="text-green-500">{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="40" max="180" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{progress.toFixed(0)}%</span>
                </div>
            </footer>
        </div>
    );

    return (
        <>
            {!pipWindow && (
                <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-700">
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
