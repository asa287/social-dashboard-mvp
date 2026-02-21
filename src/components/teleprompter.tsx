"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Mic, MonitorPlay, Settings, X, Play, Square, Video, Info, Maximize2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
    externalPipWindow?: Window | null; // Pass from parent for instant gesture-triggered PiP
}

export function Teleprompter({ content, onClose, externalPipWindow }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(48);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [progress, setProgress] = useState(0);

    // Internal PiP state
    const [pipWindow, setPipWindow] = useState<Window | null>(externalPipWindow || null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);

    // Phrase segmentation
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    // Adaptive speed state
    const lastMatchTime = useRef<number>(Date.now());
    const [adaptiveSpeed, setAdaptiveSpeed] = useState(1.2);

    // CUMULATIVE FUZZY MATCHING (V6 Professional Logic)
    // This logic handles "lag" and "similarity" much better
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
            // We analyze the entire current 'result' cluster to pick up missed chars
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                sessionTranscript += event.results[i][0].transcript;
            }
            const cleanSpeech = sessionTranscript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();

            // SENSITIVITY SEARCH: Look ahead up to 25 chars/words
            const searchWindow = 25;
            let bestMatchIdx = currentWordIndex;

            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + searchWindow, words.length); i++) {
                const target = words[i].toLowerCase();
                const nextTarget = words[i + 1]?.toLowerCase() || "";
                const biGram = target + nextTarget;

                // Threshold Check: If the transcript contains the bigram OR the ending matches the char
                // This is much more sensitive than exact string matching
                if (cleanSpeech.includes(biGram) || cleanSpeech.endsWith(target)) {
                    bestMatchIdx = i;
                }
            }

            if (bestMatchIdx > currentWordIndex) {
                const now = Date.now();
                const deltaT = (now - lastMatchTime.current) / 1000;
                const deltaD = bestMatchIdx - currentWordIndex;

                if (deltaT > 0.1) {
                    // Update CPS (Characters Per Second)
                    setAdaptiveSpeed(prev => (prev * 0.7) + ((deltaD / deltaT) * 0.3));
                }

                lastMatchTime.current = now;
                setCurrentWordIndex(bestMatchIdx);
            }
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch { } };
        recognition.start();
        return () => { recognition.onend = null; recognition.stop(); };
    }, [isActive, words, lang, currentWordIndex]);

    // Visual Smoothing
    useEffect(() => {
        if (!isActive || currentWordIndex >= words.length - 1) return;
        let lastT = performance.now();
        const animate = (now: number) => {
            const dt = (now - lastT) / 1000;
            lastT = now;
            setProgress(prev => {
                const next = prev + (dt * adaptiveSpeed);
                // Clamp visual progress: cannot be more than 3 units ahead of real match
                return Math.min(next, currentWordIndex + 3);
            });
            requestAnimationFrame(animate);
        };
        const id = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(id);
    }, [isActive, adaptiveSpeed, currentWordIndex, words.length]);

    // Handle PiP Window Setup
    useEffect(() => {
        if (pipWindow && !pipRootRef.current) {
            const doc = pipWindow.document;

            // 1. Clear previous content
            doc.body.innerHTML = "";

            // 2. Transmit styles
            [...document.styleSheets].forEach((sheet) => {
                try {
                    const css = [...(sheet as any).cssRules].map(r => r.cssText).join('');
                    const s = doc.createElement('style');
                    s.textContent = css;
                    doc.head.appendChild(s);
                } catch (e) {
                    if (sheet.href) {
                        const l = doc.createElement('link');
                        l.rel = 'stylesheet'; l.href = sheet.href;
                        doc.head.appendChild(l);
                    }
                }
            });

            // 3. Setup Layout
            const root = doc.createElement('div');
            root.id = 'pip-root';
            doc.body.appendChild(root);
            doc.body.style.margin = '0';
            doc.body.style.background = 'black';
            doc.body.style.overflow = 'hidden';

            pipRootRef.current = root;

            pipWindow.addEventListener('pagehide', () => {
                setPipWindow(null);
                pipRootRef.current = null;
            }, { once: true });
        }
    }, [pipWindow]);

    // Scroll Sync
    useEffect(() => {
        const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : document.querySelector('.main-tele-container');
        if (container) {
            const activeIdx = Math.floor(progress);
            const el = container.querySelector(`[data-index="${activeIdx}"]`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [progress, pipWindow]);

    const TeleprompterContent = (
        <div className={`flex flex-col bg-black text-white font-sans overflow-hidden h-full w-full ${pipWindow ? 'fixed inset-0' : ''}`}>
            {/* Minimal Control Bar */}
            <header className="flex items-center justify-between px-6 py-2 bg-zinc-900/60 border-b border-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className={`h-3 w-3 ${isActive ? 'text-green-400 fill-green-400' : 'text-zinc-600'}`} />
                    <span className="text-[8px] font-black tracking-widest uppercase opacity-40">{t.create.teleprompter.title}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                        <span className="text-[8px] text-zinc-500">CPS</span>
                        <span className="text-[10px] font-mono text-green-500/80">{adaptiveSpeed.toFixed(1)}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* FLUID TEXT AREA */}
            <div className={`scroll-container main-tele-container flex-1 overflow-y-auto scrollbar-hide pt-[25vh] pb-[45vh] px-10 transition-all duration-500 ${pipWindow ? 'px-6 pt-[15vh]' : 'md:px-32 lg:px-48'}`}>
                <div className="max-w-4xl mx-auto">
                    <div
                        className="leading-[1.5] text-center select-none flex flex-wrap justify-center gap-x-1.5 transition-all duration-300"
                        style={{ fontSize: `${pipWindow ? fontSize * 0.8 : fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const localProgress = Math.max(0, Math.min(1, progress - i));
                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-300 rounded px-1 py-1 ${i === Math.floor(progress) ? "scale-105 z-10 font-bold" : ""
                                        }`}
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, #4ade80 ${localProgress * 100}%, #71717a ${localProgress * 100}%)`,
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

            {/* Footer Only in Main View */}
            {!pipWindow && (
                <footer className="shrink-0 p-8 bg-zinc-950 border-t border-white/5 flex flex-col items-center gap-5">
                    <Button
                        size="lg"
                        className={`rounded-full h-14 w-14 transition-all duration-500 ${isActive ? "bg-red-500 animate-pulse" : "bg-green-600"
                            }`}
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Square className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    </Button>
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase">
                            <label>Zoom</label>
                            <span>{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="30" max="150" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none accent-green-500"
                        />
                    </div>
                </footer>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* Render in current window if not in PiP */}
            {!pipWindow && TeleprompterContent}

            {/* Render in PiP window if it exists */}
            {pipWindow && pipRootRef.current && createPortal(
                TeleprompterContent,
                pipRootRef.current
            )}
        </div>
    );
}
