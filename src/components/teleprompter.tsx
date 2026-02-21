"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MonitorPlay, Settings, X, Play, Square, Video, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
}

export function Teleprompter({ content, onClose }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(36);
    const [speed, setSpeed] = useState(5);
    const [words, setWords] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Phrase-based matching parameters
    const WINDOW_SIZE = 4; // Look ahead 4 words/chars to find a match

    useEffect(() => {
        if (lang === "zh") {
            // Segmenting Chinese into reasonable "chunks"
            // For a simple version, we can treat 2-4 chars as a "phrase unit" 
            // but even char-by-char is okay if the matching logic is phrase-based.
            setWords(content.replace(/\s+/g, "").split(""));
        } else {
            setWords(content.split(/\s+/).filter(w => w.length > 0));
        }
    }, [content, lang]);

    useEffect(() => {
        if (!isActive) {
            setCurrentWordIndex(-1);
            return;
        }

        const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

        if (!SpeechRecognition) {
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
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript.toLowerCase();

            // PHRASE-BASED MATCHING LOGIC (Killer Feature Logic)
            // Instead of just checking the 'transcript', we check if the next 'WINDOW_SIZE' 
            // words in our script appear in the transcript.

            let foundIndex = -1;
            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + 10, words.length); i++) {
                // Construct a small phrase from the script to match against
                const scriptChunk = words.slice(i, i + 3).join("").toLowerCase();
                if (transcript.includes(scriptChunk) || transcript.includes(words[i].toLowerCase())) {
                    foundIndex = i;
                    // We don't break immediately; we want the furthest match in this small window
                }
            }

            if (foundIndex !== -1) {
                setCurrentWordIndex(foundIndex);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error", event.error);
        };

        recognition.onend = () => {
            // Keep it alive if still active
            if (isActive) recognition.start();
        };

        recognition.start();
        return () => {
            recognition.onend = null;
            recognition.stop();
        };
    }, [isActive, words, lang, speed, currentWordIndex]);

    useEffect(() => {
        if (currentWordIndex !== -1 && containerRef.current) {
            const activeElement = containerRef.current.querySelector(`[data-index="${currentWordIndex}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [currentWordIndex]);

    const handlePip = async () => {
        alert(lang === "zh" ? "画中画模式正通过 Document PiP API 接入中..." : "PiP mode is being integrated...");
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white font-sans overflow-hidden">
            {/* Minimal Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-zinc-900/50 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <Video className={`h-5 w-5 ${isActive ? "text-red-500 animate-pulse" : "text-zinc-500"}`} />
                    <span className="text-sm font-bold tracking-tight">{t.create.teleprompter.title}</span>
                </div>

                {/* Subtle Hint */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <Info className="h-3 w-3 text-blue-400" />
                    <span className="text-[10px] text-zinc-400 font-medium">{t.create.teleprompter.eyeContactHint}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={handlePip}>
                        <MonitorPlay className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Content Area - Bigger and starts higher up */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto scrollbar-hide pt-10 pb-40 px-6 md:px-24 lg:px-48"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="leading-[1.4] text-center select-none flex flex-wrap justify-center gap-x-2" style={{ fontSize: `${fontSize}px` }}>
                        {words.map((word, i) => (
                            <span
                                key={i}
                                data-index={i}
                                className={`transition-all duration-200 rounded px-1.5 py-0.5 ${i === currentWordIndex
                                        ? "text-green-400 font-bold scale-110 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                                        : i < currentWordIndex
                                            ? "text-white/5"
                                            : "text-white/30"
                                    }`}
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Floating Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center gap-6">
                <Button
                    size="lg"
                    className={`rounded-full h-16 w-16 shadow-2xl transition-all duration-300 ${isActive
                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/40"
                            : "bg-green-500 hover:bg-green-600 shadow-green-500/40"
                        }`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 ml-1 text-white" />}
                </Button>

                <div className="flex gap-12 w-full max-w-xl">
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <label>{t.create.teleprompter.fontSize}</label>
                            <span className="text-green-500">{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="20" max="100" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <label>{t.create.teleprompter.speed}</label>
                            <span className="text-green-500">{speed}x</span>
                        </div>
                        <input
                            type="range" min="1" max="10" value={speed}
                            onChange={(e) => setSpeed(parseInt(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
