"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Mic, MonitorPlay, Settings, X, Play, Square, Video, Info, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
    autoPip?: boolean;
}

export function Teleprompter({ content, onClose, autoPip = false }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(48);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);

    // Phrase segmentation (Chinese char-by-char, English word-by-word)
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    // Restore v4.0 Robust Voice Matching logic (Sliding window)
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
            let fullTranscript = "";
            for (let i = Math.max(0, event.results.length - 2); i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            const cleanSpeech = fullTranscript.replace(/[，。！？、；：“”‘’（）]/g, "").toLowerCase();

            // v4 Strategy: Look ahead in search window
            const searchWindow = 12;
            let bestIdx = -1;

            for (let i = currentWordIndex + 1; i < Math.min(currentWordIndex + searchWindow, words.length); i++) {
                const char = words[i].toLowerCase();
                const nextChar = words[i + 1]?.toLowerCase() || "";
                const phrase = char + nextChar;

                // Match phrase first, then single char
                if ((phrase.length > 1 && cleanSpeech.includes(phrase)) || cleanSpeech.endsWith(char)) {
                    bestIdx = i;
                }
            }

            if (bestIdx > currentWordIndex) {
                setCurrentWordIndex(bestIdx);
            }
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch { } };
        recognition.start();
        return () => { recognition.onend = null; recognition.stop(); };
    }, [isActive, words, lang, currentWordIndex]);

    // Centered Auto-Scroll with smooth behavior
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

    const handlePip = async () => {
        if (!('documentPictureInPicture' in window)) {
            alert("Browser doesn't support Document PiP.");
            return;
        }

        try {
            const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 600,
                height: 450,
            });

            // Improved Style Syncing
            const styles = Array.from(document.styleSheets);
            styles.forEach((styleSheet) => {
                try {
                    const cssRules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    newPipWindow.document.head.appendChild(style);
                } catch (e) {
                    if (styleSheet.href) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        newPipWindow.document.head.appendChild(link);
                    }
                }
            });

            const root = newPipWindow.document.createElement('div');
            root.id = 'pip-root';
            newPipWindow.document.body.appendChild(root);

            // Transparency & Glassmorphism
            newPipWindow.document.body.style.margin = '0';
            newPipWindow.document.body.style.backgroundColor = 'transparent';
            newPipWindow.document.body.style.color = 'white';
            newPipWindow.document.documentElement.style.backgroundColor = 'transparent';

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

    // Auto-Pip trigger if requested
    useEffect(() => {
        if (autoPip && !pipWindow) {
            // Note: In real production, this needs to be tied strictly to the same event loop as the button click
            // Since this component might render immediately after the click, we try to trigger it.
            handlePip();
        }
    }, [autoPip]);

    const TeleprompterContent = (
        <div className={`flex flex-col bg-black/80 text-white font-sans overflow-hidden h-full w-full ${pipWindow ? 'fixed inset-0' : ''}`} style={{ backgroundColor: pipWindow ? 'transparent' : '' }}>
            {/* Minimal Header */}
            <header className="flex items-center justify-between px-6 py-2 bg-zinc-900/60 border-b border-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">{t.create.teleprompter.title}</span>
                </div>

                <div className="flex items-center gap-3">
                    {!pipWindow && (
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold bg-white/5 border border-white/10" onClick={handlePip}>
                            <Maximize2 className="h-3 w-3 mr-2" />
                            {t.create.teleprompter.pip}
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-500" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Scrolling Viewport */}
            <div className="scroll-container main-tele-container flex-1 overflow-y-auto scrollbar-hide pt-[25vh] pb-[45vh] px-8 md:px-16">
                <div className="max-w-4xl mx-auto">
                    <div className="leading-[1.5] text-center select-none flex flex-wrap justify-center gap-x-2 transition-all duration-300" style={{ fontSize: `${fontSize}px` }}>
                        {words.map((word, i) => (
                            <span
                                key={i}
                                data-index={i}
                                className={`transition-all duration-300 rounded px-1.5 py-1 my-1 ${i === currentWordIndex
                                    ? "text-green-400 font-extrabold scale-110 bg-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.4)] z-10"
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

            {/* Controls */}
            <footer className="shrink-0 p-8 bg-black/90 border-t border-white/5 flex flex-col items-center gap-6">
                <Button
                    size="lg"
                    className={`rounded-full h-16 w-16 shadow-lg transition-all duration-500 ${isActive
                        ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/20"
                        : "bg-green-600 hover:bg-green-700 shadow-green-500/20"
                        }`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? <Square className="h-7 w-7 text-white" /> : <Play className="h-7 w-7 ml-1 text-white" />}
                </Button>

                <div className="flex gap-10 w-full max-w-lg">
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                            <label>Font Size</label>
                            <span className="text-green-500">{fontSize}px</span>
                        </div>
                        <input
                            type="range" min="30" max="150" value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full accent-green-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
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
