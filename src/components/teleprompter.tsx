"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Zap, ArrowUp, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

interface TeleprompterProps {
    content: string;
    onClose: () => void;
    autoStart?: boolean;
}

export function Teleprompter({ content, onClose, autoStart = true }: TeleprompterProps) {
    const { t, lang } = useI18n();
    const [isActive, setIsActive] = useState(false);
    const [fontSize, setFontSize] = useState(42);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [hasStartedScrolling, setHasStartedScrolling] = useState(false);

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    // 1. Segmentation + Sentence Grouping
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    const sentenceMap = useMemo(() => {
        const map = new Array(words.length).fill(0);
        let currentSentenceId = 0;
        const delimiters = lang === "zh" ? /[。！？\n]/ : /[.!?\n]/;

        words.forEach((word, i) => {
            map[i] = currentSentenceId;
            if (delimiters.test(word)) {
                currentSentenceId++;
            }
        });
        return map;
    }, [words, lang]);

    // UNIFIED ACTIVATION LOGIC (DOCKING + STRIP BAR)
    const triggerStart = async () => {
        if (isActive) return;
        setIsActive(true);

        if ('documentPictureInPicture' in window) {
            try {
                const screenWidth = window.screen.availWidth;
                const windowWidth = 900;
                const left = (screenWidth - windowWidth) / 2;

                const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: windowWidth,
                    height: 150,
                });

                // Attempt to position at top-center
                try {
                    newPipWindow.moveTo(left, 0);
                } catch (e) {
                    console.warn("Window movement constrained", e);
                }

                const doc = newPipWindow.document;
                doc.documentElement.style.height = '100%';
                doc.body.style.height = '100%';
                doc.body.style.margin = '0';
                doc.body.style.backgroundColor = 'black';
                doc.body.style.overflow = 'hidden';

                // Copy Styles
                [...document.styleSheets].forEach((s) => {
                    try {
                        const rules = [...(s as any).cssRules].map(r => r.cssText).join('');
                        const style = doc.createElement('style');
                        style.textContent = rules;
                        doc.head.appendChild(style);
                    } catch (e) {
                        if (s.href) {
                            const link = doc.createElement('link');
                            link.rel = 'stylesheet'; link.href = s.href;
                            doc.head.appendChild(link);
                        }
                    }
                });

                const root = doc.createElement('div');
                root.id = 'pip-root';
                root.style.height = '100%';
                doc.body.appendChild(root);

                setPipWindow(newPipWindow);
                pipRootRef.current = root;

                newPipWindow.addEventListener('pagehide', () => {
                    setPipWindow(null);
                    setIsActive(false);
                    onClose();
                }, { once: true });
            } catch (err) {
                console.warn("PiP failed", err);
            }
        }
    };

    useEffect(() => {
        if (autoStart) triggerStart();
    }, []);

    // SPEECH RECOGNITION (High Precision)
    useEffect(() => {
        if (!isActive) return;

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

            // Broad search window to catch up phrases
            const searchWindow = 35;
            let maxMatchIdx = currentWordIndex;

            for (let i = currentWordIndex + 1; i < Math.min(words.length, currentWordIndex + searchWindow); i++) {
                const char = words[i].toLowerCase();
                if (cleanSpeech.includes(char) || cleanSpeech.endsWith(char)) {
                    maxMatchIdx = i;
                }
            }

            if (maxMatchIdx > currentWordIndex) {
                if (!hasStartedScrolling) setHasStartedScrolling(true);
                setCurrentWordIndex(maxMatchIdx);
            }
        };

        recognition.onend = () => { if (isActive) try { recognition.start(); } catch (e) { } };
        recognition.start();
        return () => { recognition.onend = null; recognition.stop(); };
    }, [isActive, words, lang, currentWordIndex, hasStartedScrolling]);

    // RECALIBRATED ADAPTIVE ENGINE
    const animate = () => {
        if (!isActive || !hasStartedScrolling) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        const container = pipWindow ? pipRootRef.current?.querySelector('.scroll-container') : scrollContainerRef.current;
        if (!container) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        // 1. Lower base speed for natural flow
        let speed = 0.4;

        // 2. Adaptive logic
        const activeElement = container.querySelector(`[data-index="${currentWordIndex}"]`) as HTMLElement;
        if (activeElement) {
            const containerHeight = container.clientHeight;
            // Target the 35% mark of the strip for the active sentence
            const targetPos = activeElement.offsetTop - (containerHeight * 0.35);
            const currentScroll = container.scrollTop;
            const diff = targetPos - currentScroll;

            // Tighter thresholds for faster adaptation
            if (diff > 80) speed = 3.8;
            else if (diff > 10) speed = 1.4;
            else if (diff < -5) speed = 0.1; // Slow down quickly if we run ahead
        }

        container.scrollTop += speed;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isActive, hasStartedScrolling, currentWordIndex, pipWindow]);

    const TeleprompterContent = (
        <div className="flex flex-col h-full w-full bg-black text-white font-sans overflow-hidden select-none">
            {pipWindow && (
                <div className="h-4 flex items-center justify-end px-4 pt-1 opacity-0 hover:opacity-100 transition-opacity shrink-0 z-50">
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-zinc-600 hover:text-red-500" onClick={() => pipWindow.close()}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            <div
                ref={scrollContainerRef}
                className="scroll-container flex-1 overflow-y-auto scrollbar-hide pt-[25vh] pb-[25vh] px-8"
                style={{ scrollBehavior: 'auto' }}
            >
                <div className="max-w-4xl mx-auto">
                    <div
                        className="text-center font-black leading-[1.3] flex flex-wrap justify-center gap-x-1 gap-y-1"
                        style={{ fontSize: `${pipWindow ? (fontSize * 0.9) : fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const isCurrentWord = i === currentWordIndex;
                            const isPastWord = i < currentWordIndex;
                            const currentSentenceId = currentWordIndex >= 0 ? sentenceMap[currentWordIndex] : -1;
                            const isInCurrentSentence = sentenceMap[i] === currentSentenceId;

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-700 rounded-sm px-0.5 relative ${isCurrentWord
                                            ? "text-sky-400 scale-105 z-30 drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]"
                                            : isInCurrentSentence
                                                ? "text-sky-400/80"
                                                : isPastWord
                                                    ? "text-white/10 opacity-20"
                                                    : "text-white/40"
                                        }`}
                                >
                                    {word}
                                    {isCurrentWord && (
                                        <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-sky-500/80 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Status Feedback */}
            {isActive && !hasStartedScrolling && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
                    <div className="bg-zinc-900/60 px-3 py-1.5 rounded-full border border-sky-500/30 flex items-center gap-2 animate-pulse">
                        <Zap className="h-3 w-3 text-sky-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Listening...</span>
                    </div>
                </div>
            )}

            {/* Main setup view */}
            {!pipWindow && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xl z-20">
                    <div className="text-center space-y-6 max-w-sm p-10 bg-zinc-900/95 rounded-3xl border border-white/5 shadow-2xl">
                        <div className="h-14 w-14 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-sky-500/10">
                            <Type className="h-7 w-7 text-sky-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white">提词器已校准</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            <strong>自适应速度优化：</strong>
                            滚动引擎已针对自然语速进行了重新校准，能更灵敏地响应您的节奏。
                            <br /><br />
                            <strong>置顶居中对齐：</strong>
                            浮窗将尝试自动定位在屏幕正上方中央。
                        </p>
                        <Button variant="outline" className="w-full h-11 rounded-xl border-white/10 text-zinc-400" onClick={onClose}>
                            返回编辑器
                        </Button>
                    </div>
                </div>
            )}
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
