"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);

    // Phrase segmentation (Stable mapping to the rendered characters)
    const words = useMemo(() => {
        if (lang === "zh") {
            // Split into characters but preserve their original identity for matching
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    // Robust Voice Matching logic (Hyper-accurate for Chinese)
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
            // 1. Collect the most recent segment of speech
            let recentTranscript = "";
            const historySize = 3; // Look at last 3 result segments for continuity
            for (let i = Math.max(0, event.results.length - historySize); i < event.results.length; i++) {
                recentTranscript += event.results[i][0].transcript;
            }

            // 2. Clean transcript (remove punctuation)
            const cleanSpeech = recentTranscript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();

            // 3. Sliding window search ahead in the script
            const searchRange = 12; // Search depth 
            let maxMatchIdx = -1;

            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + searchRange, words.length); i++) {
                // For Chinese, we match either a 2-char phrase OR a single char if the context is strong
                const char = words[i].toLowerCase();
                const nextChar = i + 1 < words.length ? words[i + 1].toLowerCase() : "";
                const phrase = char + nextChar;

                if ((phrase.length > 1 && cleanSpeech.includes(phrase)) || cleanSpeech.endsWith(char)) {
                    maxMatchIdx = i;
                }
            }

            if (maxMatchIdx !== -1) {
                // Update to the latest match
                setCurrentWordIndex(maxMatchIdx);
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
    }, [isActive, words, lang, currentWordIndex]);

    // Smoother Scrolling - Centered on highlight
    useEffect(() => {
        const scrollToActive = () => {
            // Find container in standard view or PiP portal
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

    // Pic-in-Pic via React Portal
    const handlePip = async () => {
        if (!('documentPictureInPicture' in window)) {
            alert(lang === "zh" ? "您的浏览器不支持 Document PiP。" : "Your browser doesn't support Document PiP.");
            return;
        }

        try {
            const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 600,
                height: 450,
            });

            // Copy CSS
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...(styleSheet as any).cssRules].map((rule) => rule.cssText).join('');
                    const style = newPipWindow.document.createElement('style');
                    style.textContent = cssRules;
                    newPipWindow.document.head.appendChild(style);
                } catch (e) {
                    if (styleSheet.href) {
                        const link = newPipWindow.document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        newPipWindow.document.head.appendChild(link);
                    }
                }
            });

            const root = newPipWindow.document.createElement('div');
            root.id = 'pip-root';
            newPipWindow.document.body.appendChild(root);
            newPipWindow.document.body.style.margin = '0';
            newPipWindow.document.body.style.backgroundColor = 'black';

            setPipWindow(newPipWindow);
            pipRootRef.current = root;

            newPipWindow.addEventListener('pagehide', () => {
                setPipWindow(null);
                pipRootRef.current = null;
            }, { once: true });
        } catch (err) {
            console.error(err);
        }
    };

    const TeleprompterContent = (
        <div className={`flex flex-col bg-black text-white font-sans overflow-hidden h-full w-full ${pipWindow ? 'fixed inset-0' : ''}`}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 bg-zinc-900/60 border-b border-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t.create.teleprompter.title}</span>
                </div>

                <div className="flex items-center gap-3">
                    {!pipWindow && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] font-bold bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3"
                            onClick={handlePip}
                        >
                            <Maximize2 className="h-3 w-3 mr-2" />
                            {t.create.teleprompter.pip}
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Scrolling Viewport */}
            <div
                className="scroll-container main-tele-container flex-1 overflow-y-auto scrollbar-hide pt-[25vh] pb-[40vh] px-8 md:px-20 lg:px-40"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="leading-[1.4] text-center select-none flex flex-wrap justify-center gap-x-2 transition-all duration-300" style={{ fontSize: `${fontSize}px` }}>
                        {words.map((word, i) => (
                            <span
                                key={i}
                                data-index={i}
                                className={`transition-all duration-300 rounded px-1 py-1 ${i === currentWordIndex
                                        ? "text-green-400 font-extrabold translate-y-[-4px] scale-110 bg-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.4)] z-10"
                                        : i < currentWordIndex
                                            ? "text-zinc-900 border-b border-zinc-800"
                                            : "text-zinc-600"
                                    }`}
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <footer className="shrink-0 p-8 bg-black/90 border-t border-white/5 flex flex-col items-center gap-6">
                <Button
                    size="lg"
                    className={`rounded-full h-16 w-16 shadow-xl transition-all duration-500 ${isActive
                            ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/20"
                            : "bg-green-600 hover:bg-green-700 shadow-green-500/20"
                        }`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square className="h-7 w-7 text-white" /> : <Play className="h-7 w-7 ml-1 text-white" />}
                </Button>

                <div className="flex gap-12 w-full max-w-xl">
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                            <label>{t.create.teleprompter.fontSize}</label>
                            <span className="text-green-500">{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="30" max="150" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
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
            </footer>
        </div>
    );

    return (
        <>
            {/* Main Modal */}
            {!pipWindow && (
                <div className="fixed inset-0 z-[100] flex">
                    {TeleprompterContent}
                </div>
            )}

            {/* PiP Window Content */}
            {pipWindow && pipRootRef.current && createPortal(
                TeleprompterContent,
                pipRootRef.current
            )}
        </>
    );
}
