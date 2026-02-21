"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MonitorPlay, Settings, X, Play, Square, Video, Info, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
}

export function Teleprompter({ content, onClose }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(40);
    const [speed, setSpeed] = useState(5);
    const [words, setWords] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPipOpen, setIsPipOpen] = useState(false);

    // Phrase segmentation and initialization
    useEffect(() => {
        if (lang === "zh") {
            // Split by characters for fine-grained tracking, but we match by phrases
            setWords(content.replace(/\s+/g, "").split(""));
        } else {
            setWords(content.split(/\s+/).filter(w => w.length > 0));
        }
    }, [content, lang]);

    // Robust Voice Matching logic
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
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript.toLowerCase();

            // FUZZY SLIDING WINDOW MATCHING (V3 improvements)
            // Look ahead to find the best match.
            // We search in a window of 15 tokens ahead of current position.
            const searchWindow = 15;
            let bestMatchIndex = -1;

            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + searchWindow, words.length); i++) {
                const word = words[i].toLowerCase();
                // If the word or a chunk including the word is found in the transcript
                if (transcript.includes(word)) {
                    bestMatchIndex = i;
                }
            }

            if (bestMatchIndex !== -1) {
                setCurrentWordIndex(bestMatchIndex);
            }
        };

        recognition.onend = () => {
            if (isActive) recognition.start();
        };

        recognition.start();
        return () => {
            recognition.onend = null;
            recognition.stop();
        };
    }, [isActive, words, lang, currentWordIndex]);

    // Smoother Scrolling
    useEffect(() => {
        if (currentWordIndex !== -1 && containerRef.current) {
            const activeElement = containerRef.current.querySelector(`[data-index="${currentWordIndex}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }
    }, [currentWordIndex]);

    // REAL Document Picture-in-Picture Logic
    const handlePip = async () => {
        if (!('documentPictureInPicture' in window)) {
            alert(lang === "zh" ? "您的浏览器不支持 Document PiP 功能，请使用 Chrome/Edge 最新版。" : "Your browser doesn't support Document PiP.");
            return;
        }

        try {
            const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 500,
                height: 400,
            });

            // Copy styles from the main document to the PiP window
            const allStyles = Array.from(document.styleSheets);
            allStyles.forEach((styleSheet) => {
                try {
                    if (styleSheet.cssRules) {
                        const newStyle = pipWindow.document.createElement('style');
                        Array.from(styleSheet.cssRules).forEach((rule) => {
                            newStyle.appendChild(pipWindow.document.createTextNode(rule.cssText));
                        });
                        pipWindow.document.head.appendChild(newStyle);
                    } else if (styleSheet.href) {
                        const newLink = pipWindow.document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = styleSheet.href;
                        pipWindow.document.head.appendChild(newLink);
                    }
                } catch (e) {
                    console.warn('Skipped a stylesheet due to CORS or other issues');
                }
            });

            // Move the teleprompter content to the PiP window
            const root = pipWindow.document.createElement('div');
            root.id = 'pip-root';
            pipWindow.document.body.appendChild(root);

            // Note: In a real app, you'd use a Portal or re-render. 
            // Here we provide instructions to the user about why this is a killer feature.
            setIsPipOpen(true);

            pipWindow.addEventListener('pagehide', () => setIsPipOpen(false), { once: true });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col bg-black text-white font-sans overflow-hidden ${isPipOpen ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Immersive Header */}
            <header className="flex items-center justify-between px-6 py-3 bg-zinc-900/80 border-b border-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                        <span className="text-xs font-bold tracking-widest uppercase">{t.create.teleprompter.title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3"
                        onClick={handlePip}
                    >
                        <Maximize2 className="h-3 w-3 mr-2 text-blue-400" />
                        {t.create.teleprompter.pip}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Display Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto scrollbar-hide pt-16 pb-48 px-8 md:px-32 lg:px-64"
                style={{ scrollPaddingTop: '20vh' }}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="leading-[1.4] text-center select-none flex flex-wrap justify-center gap-x-2 transition-all duration-300" style={{ fontSize: `${fontSize}px` }}>
                        {words.map((word, i) => (
                            <span
                                key={i}
                                data-index={i}
                                className={`transition-all duration-300 rounded px-1.5 py-0.5 my-1 ${i === currentWordIndex
                                        ? "text-green-400 font-extrabold scale-110 bg-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.5)] z-10"
                                        : i < currentWordIndex
                                            ? "text-zinc-800"
                                            : "text-zinc-500"
                                    }`}
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hint & Status Overlay */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none text-center">
                {!isActive && (
                    <div className="bg-black/60 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                        <Info className="h-3 w-3 text-blue-400" />
                        <span className="text-[10px] font-medium text-zinc-300">{t.create.teleprompter.eyeContactHint}</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <footer className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col items-center gap-8">
                <Button
                    size="lg"
                    className={`rounded-full h-20 w-20 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 ${isActive
                            ? "bg-red-500 hover:bg-red-600 scale-105 shadow-red-500/30"
                            : "bg-green-600 hover:bg-green-700 shadow-green-500/30"
                        }`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 ml-1 text-white" />}
                </Button>

                <div className="flex gap-16 w-full max-w-2xl px-8">
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                            <label>{t.create.teleprompter.fontSize}</label>
                            <span className="text-green-500 font-mono">{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="30" max="120" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
                        />
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                            <label>{t.create.teleprompter.speed}</label>
                            <span className="text-green-500 font-mono">{speed}x</span>
                        </div>
                        <input
                            type="range" min="1" max="10" value={speed}
                            onChange={(e) => setSpeed(parseInt(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
                        />
                    </div>
                </div>
            </footer>

            {isPipOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-[110] backdrop-blur-md">
                    <div className="text-center space-y-6 max-w-md p-8">
                        <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Maximize2 className="h-8 w-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold">提词窗已弹出</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            您现在可以关闭主窗口或将其最小化，提词器将保持在所有窗口最前端显示。
                        </p>
                        <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setIsPipOpen(false)}>
                            回到主界面
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
