"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Settings, X, Play, Square, Maximize2, Ghost, Zap, Flame } from "lucide-react";
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
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [isGhostMode, setIsGhostMode] = useState(true); // Default to ghost for caption feel

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);

    // Segmentation
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    // Speech Recognition Logic (Maintained High-Sensitivity V5.2 Logic)
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

    // Horizontal Auto-Scrolling for "Live Caption" Style
    useEffect(() => {
        const scrollActive = () => {
            const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : document.querySelector('.main-tele-container');
            if (currentWordIndex !== -1 && container) {
                const activeElement = container.querySelector(`[data-index="${currentWordIndex}"]`);
                if (activeElement) {
                    activeElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "center" // Key for horizontal centering
                    });
                }
            }
        };
        scrollActive();
    }, [currentWordIndex, pipWindow]);

    // Doc-PiP for "Live Caption" Window
    const handlePip = async () => {
        if (!('documentPictureInPicture' in window)) return;
        try {
            const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 700,
                height: 180, // Slim horizontal bar
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
            newPipWindow.document.body.style.overflow = 'hidden';
            newPipWindow.document.body.style.backgroundColor = 'transparent';

            setPipWindow(newPipWindow);
            pipRootRef.current = root;
            newPipWindow.addEventListener('pagehide', () => setPipWindow(null), { once: true });
        } catch (err) { console.error(err); }
    };

    const TeleprompterContent = (
        <div className={`relative flex flex-col h-full w-full transition-all duration-500 overflow-hidden ${isGhostMode ? 'bg-zinc-900/90 backdrop-blur-xl' : 'bg-zinc-950'
            } ${pipWindow ? 'fixed inset-0' : ''}`}>

            {/* System Icons (Mimicking Windows Live Caption UI) */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-50">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-500 transition-colors" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* LIVE CAPTION BODY */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Main Caption Viewport: Single Horizontal Line or Slim Paragraph */}
                <div
                    className="scroll-container main-tele-container overflow-hidden w-full px-12 text-center"
                >
                    <div
                        className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 select-none font-bold transition-transform duration-500 py-4"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isPast = i < currentWordIndex;

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-300 rounded px-1.5 py-0.5 whitespace-nowrap ${isCurrent
                                            ? "text-white scale-105"
                                            : isPast
                                                ? "text-white/20"
                                                : "text-white/60"
                                        }`}
                                >
                                    {word}
                                    {isCurrent && (
                                        <div className="absolute inset-0 bg-blue-500/10 blur-md -z-10 rounded-lg scale-125" />
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Status Indicator */}
                {!isActive && (
                    <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
                        <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase opacity-50">
                            {lang === "zh" ? "已准备好语音同步" : "Voice Sync Ready"}
                        </span>
                    </div>
                )}
            </div>

            {/* QUICK TOOLBAR: Auto-hides when active in PiP */}
            <div className={`flex items-center justify-between px-6 py-2 border-t border-white/5 bg-black/20 backdrop-blur-sm transition-all duration-500 ${pipWindow && isActive ? 'h-0 py-0 opacity-0 overflow-hidden' : ''
                }`}>
                <div className="flex items-center gap-4">
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`rounded-full h-8 w-8 p-0 flex items-center justify-center transition-all ${isActive ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                            }`}
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                    </Button>
                    <div className="flex items-center gap-1.5">
                        <Zap className={`h-3 w-3 ${isActive ? 'text-blue-400' : 'text-zinc-600'}`} />
                        <span className="text-[9px] font-bold text-zinc-500">LIVE SYNC</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase">Text Size</span>
                        <input
                            type="range" min="30" max="100" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-24 accent-blue-500 h-0.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    {!pipWindow && (
                        <Button
                            variant="ghost" size="sm"
                            className="h-6 px-3 text-[9px] font-bold bg-white/5 text-blue-400 border border-white/10"
                            onClick={handlePip}
                        >
                            POP-OUT
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {!pipWindow && (
                <div className="fixed inset-x-0 top-0 h-[200px] z-[100] flex animate-in slide-in-from-top-full duration-700">
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
