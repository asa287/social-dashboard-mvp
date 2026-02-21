"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
    const [baseSpeed, setBaseSpeed] = useState(5); // Manual fallback speed
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [progress, setProgress] = useState(0); // 0 to 1 for smooth sliding

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);

    // Phrase segmentation
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    // VELOCITY TRACKING (V5 Killer Logic)
    // We calculate "Speaking Pace" to adjust scrolling even between matches
    const lastMatchTime = useRef<number>(Date.now());
    const [adaptiveSpeed, setAdaptiveSpeed] = useState(1);

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
            for (let i = Math.max(0, event.results.length - 2); i < event.results.length; i++) {
                recentTranscript += event.results[i][0].transcript;
            }
            const cleanSpeech = recentTranscript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();

            const searchRange = 15;
            let bestIdx = -1;

            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + searchRange, words.length); i++) {
                const char = words[i].toLowerCase();
                const phrase = char + (words[i + 1] || "");

                if (cleanSpeech.includes(phrase) || cleanSpeech.endsWith(char)) {
                    bestIdx = i;
                }
            }

            if (bestIdx > currentWordIndex) {
                const now = Date.now();
                const timeDiff = (now - lastMatchTime.current) / 1000;
                const distance = bestIdx - currentWordIndex;

                // Update pace: distance / time (chars per second)
                if (timeDiff > 0.1) {
                    const newSpeed = Math.min(Math.max(distance / timeDiff, 0.5), 15);
                    setAdaptiveSpeed(newSpeed);
                }

                lastMatchTime.current = now;
                setCurrentWordIndex(bestIdx);
            }
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch { } };
        recognition.start();
        return () => { recognition.onend = null; recognition.stop(); };
    }, [isActive, words, lang, currentWordIndex]);

    // SMOOTH PROGRESS INTERPOLATION
    // This drives the visual "sliding" effect
    useEffect(() => {
        if (!isActive || currentWordIndex >= words.length - 1) return;

        let frameId: number;
        let lastTimestamp = performance.now();

        const animate = (timestamp: number) => {
            const dt = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            setProgress(prev => {
                const next = prev + (dt * adaptiveSpeed) / 1.5; // Smooth factor
                return Math.min(next, currentWordIndex + 1);
            });

            frameId = requestAnimationFrame(animate);
        };

        // Don't let visual progress lag too far behind real index
        if (progress < currentWordIndex) setProgress(currentWordIndex);

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [isActive, adaptiveSpeed, currentWordIndex, words.length, progress]);

    // Centered Scrolling Logic
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

    const handlePip = async () => {
        if (!('documentPictureInPicture' in window)) {
            alert("Browser doesn't support Document PiP.");
            return;
        }

        try {
            const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 600,
                height: 400,
            });

            [...document.styleSheets].forEach((sheet) => {
                try {
                    const css = [...(sheet as any).cssRules].map(r => r.cssText).join('');
                    const s = newPipWindow.document.createElement('style');
                    s.textContent = css;
                    newPipWindow.document.head.appendChild(s);
                } catch (e) {
                    if (sheet.href) {
                        const l = newPipWindow.document.createElement('link');
                        l.rel = 'stylesheet'; l.href = sheet.href;
                        newPipWindow.document.head.appendChild(l);
                    }
                }
            });

            const root = newPipWindow.document.createElement('div');
            root.id = 'pip-root';
            newPipWindow.document.body.appendChild(root);

            // GLASSMORPHISM MODE (Transparent feel)
            newPipWindow.document.body.style.margin = '0';
            // We use a semi-transparent black so user can see behind a bit if OS allows
            newPipWindow.document.body.style.background = 'rgba(0,0,0,0.75)';
            newPipWindow.document.body.style.backdropFilter = 'blur(10px)';

            setPipWindow(newPipWindow);
            pipRootRef.current = root;
            newPipWindow.addEventListener('pagehide', () => { setPipWindow(null); pipRootRef.current = null; }, { once: true });
        } catch (err) { console.error(err); }
    };

    const TeleprompterContent = (
        <div className={`flex flex-col bg-black/90 text-white font-sans overflow-hidden h-full w-full ${pipWindow ? 'fixed inset-0' : ''}`}>
            {/* Minimal Header */}
            <header className="flex items-center justify-between px-6 py-2 bg-zinc-900/40 border-b border-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className={`h-3 w-3 ${isActive ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-500'}`} />
                    <span className="text-[9px] font-black tracking-[0.3em] uppercase opacity-50">{t.create.teleprompter.title}</span>
                </div>
                {!pipWindow && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold border border-white/10" onClick={handlePip}>
                            <Maximize2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </header>

            {/* FLUID HIGHLIGHT VIEWPORT (V5 Core UI) */}
            <div className="scroll-container main-tele-container flex-1 overflow-y-auto scrollbar-hide pt-[30vh] pb-[40vh] px-8 md:px-20 lg:px-40">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="leading-[1.4] text-center select-none flex flex-wrap justify-center gap-x-2 transition-all duration-300 relative"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            // Calculate local progress for this character/word
                            // 0: not reached, 1: fully active, >1: passed
                            const localProgress = Math.max(0, Math.min(1, progress - i));

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`relative transition-all duration-500 rounded px-1 py-1 my-1 ${i === Math.floor(progress)
                                            ? "scale-110 z-10 font-black shadow-[0_0_50px_rgba(34,197,94,0.2)]"
                                            : "opacity-80"
                                        }`}
                                    style={{
                                        // THE SLIDING COLOR EFFECT
                                        backgroundImage: `linear-gradient(90deg, #4ade80 ${localProgress * 100}%, #52525b ${localProgress * 100}%)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        transition: 'all 0.1s linear'
                                    }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Floating Velocity Indicator */}
            {isActive && (
                <div className="absolute top-16 right-6 flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/5 backdrop-blur-sm pointer-events-none">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase">Pace</span>
                    <span className="text-[10px] font-mono text-green-400">{adaptiveSpeed.toFixed(1)}</span>
                </div>
            )}

            {/* Controls */}
            <footer className="shrink-0 p-8 bg-zinc-950/80 border-t border-white/5 flex flex-col items-center gap-4">
                <Button
                    size="lg"
                    className={`rounded-full h-14 w-14 transition-all duration-500 ${isActive
                            ? "bg-red-500 hover:bg-red-600 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            : "bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        }`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 ml-1 text-white" />}
                </Button>

                <div className="flex gap-12 w-full max-w-lg">
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                            <label>Zoom</label>
                            <span className="text-zinc-300">{fontSize}px</span>
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
