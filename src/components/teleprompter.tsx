"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MonitorPlay, Settings, X, Play, Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
}

export function Teleprompter({ content, onClose }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(32);
    const [speed, setSpeed] = useState(5);
    const [words, setWords] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Split content into words/chars for highlighting
        if (lang === "zh") {
            // In Chinese, we often highlight character by character or use a segmenter
            setWords(content.replace(/\s+/g, "").split(""));
        } else {
            setWords(content.split(/\s+/));
        }
    }, [content, lang]);

    useEffect(() => {
        if (!isActive) {
            setCurrentWordIndex(-1);
            return;
        }

        // Web Speech API Integration
        const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            // Fallback: simpler auto-scroll logic
            const interval = setInterval(() => {
                setCurrentWordIndex(prev => (prev < words.length - 1 ? prev + 1 : prev));
            }, 1000 / (speed / 2));
            return () => clearInterval(interval);
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang === "zh" ? "zh-CN" : "en-US";

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join("")
                .toLowerCase();

            // Simple heuristic for word tracking
            // We look for the next word in the text that appears in the transcript
            let bestMatch = currentWordIndex;
            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + 10, words.length); i++) {
                if (transcript.includes(words[i].toLowerCase())) {
                    bestMatch = i;
                }
            }

            if (bestMatch !== currentWordIndex) {
                setCurrentWordIndex(bestMatch);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error", event.error);
            setIsActive(false);
        };

        recognition.start();

        return () => {
            recognition.stop();
        };
    }, [isActive, words, lang, speed, currentWordIndex]);

    // Auto-scroll the active word into view safely
    useEffect(() => {
        if (currentWordIndex !== -1 && containerRef.current) {
            const activeElement = containerRef.current.querySelector(`[data-index="${currentWordIndex}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [currentWordIndex]);

    const handlePip = async () => {
        // Picture-in-Picture for a DOM element is still experimental via Document PiP API
        // For now, we'll alert the user about the strategy (PM Storytelling)
        alert(lang === "zh" ? "画中画模式正通过 Document PiP API 接入中，可在录屏时置顶显示。" : "PiP mode is being integrated via Document PiP API for top-level overlay during recording.");
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white p-6 md:p-12 font-sans overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                        <Video className="h-6 w-6 text-green-500 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{t.create.teleprompter.title}</h2>
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{isActive ? "LIVE TRACKING" : "STANDBY"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 bg-white/5 hover:bg-white/20 text-white"
                        onClick={handlePip}
                    >
                        <MonitorPlay className="h-4 w-4 mr-2" />
                        {t.create.teleprompter.pip}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-500/20 hover:text-red-500 text-zinc-400"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </header>

            {/* Display Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto scrollbar-hide py-20 px-4 md:px-20"
            >
                <div className="max-w-4xl mx-auto">
                    <p className="text-center text-xs text-zinc-500 mb-12 font-medium bg-zinc-900/50 py-2 rounded-full inline-block px-4 left-1/2 -translate-x-1/2 relative">
                        {t.create.teleprompter.eyeContactHint}
                    </p>

                    <div className="leading-[1.6] text-center select-none flex flex-wrap justify-center gap-x-1" style={{ fontSize: `${fontSize}px` }}>
                        {words.map((word, i) => (
                            <span
                                key={i}
                                data-index={i}
                                className={`transition-all duration-300 rounded px-1 ${i === currentWordIndex
                                    ? "text-green-500 font-bold scale-110 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                    : i < currentWordIndex
                                        ? "text-white/10"
                                        : "text-white/40"
                                    }`}
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <footer className="mt-8 pt-8 border-t border-white/10 shrink-0 flex flex-col items-center gap-8 bg-gradient-to-t from-black via-black to-transparent">
                <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{t.create.teleprompter.voiceSync}</span>
                    <Button
                        size="lg"
                        className={`rounded-full h-20 w-20 shadow-2xl transition-all duration-300 ${isActive
                            ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/20"
                            : "bg-green-500 hover:bg-green-600 shadow-green-500/20"
                            }`}
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Square className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 ml-1 text-white" />}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mb-8">
                    <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase">
                            <label>{t.create.teleprompter.fontSize}</label>
                            <span>{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="24" max="80" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full accent-green-500 bg-zinc-800 rounded-lg h-1 appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase">
                            <label>{t.create.teleprompter.speed}</label>
                            <span>{speed}x</span>
                        </div>
                        <input
                            type="range" min="1" max="10" value={speed}
                            onChange={(e) => setSpeed(parseInt(e.target.value))}
                            className="w-full accent-green-500 bg-zinc-800 rounded-lg h-1 appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </footer>
        </div>
    );
}
