"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Zap, ArrowUp } from "lucide-react";
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
    const [fontSize, setFontSize] = useState(48);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [hasStartedScrolling, setHasStartedScrolling] = useState(false);

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    // Segmentation optimized for vertical flow
    const words = useMemo(() => {
        if (lang === "zh") {
            return content.replace(/\s+/g, "").split("");
        }
        return content.split(/\s+/).filter(w => w.length > 0);
    }, [content, lang]);

    // UNIFIED ACTIVATION LOGIC (RELIABILITY FOCUS)
    const triggerStart = async () => {
        if (isActive) return;
        setIsActive(true);

        if ('documentPictureInPicture' in window) {
            try {
                const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: 600,
                    height: 500,
                });

                // 1. Critical Height Setup for scrolling to work
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

    // HYPER-SENSITIVE SPEECH RECOGNITION
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

            const searchWindow = 25;
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

    // VERTICAL FLOW ENGINE (REFINED INTERPOLATION)
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

        // Base Drift
        let speed = 0.8;

        // Target Logic
        const activeElement = container.querySelector(`[data-index="${currentWordIndex}"]`) as HTMLElement;
        if (activeElement) {
            const containerHeight = container.clientHeight;
            // The goal is to keep the current word roughly at 35% from the top
            const targetPos = activeElement.offsetTop - (containerHeight * 0.35);
            const currentScroll = container.scrollTop;
            const diff = targetPos - currentScroll;

            // Adaptive Speed PID
            if (diff > 200) speed = 5.0; // Urgent catchup
            else if (diff > 50) speed = 2.5;
            else if (diff > 10) speed = 1.2;
            else if (diff < -20) speed = 0.2; // Ahead, slow down
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
            {/* Minimal Header (only visible when hovered in PiP to keep it clean) */}
            {pipWindow && (
                <div className="h-4 flex items-center justify-end px-3 bg-zinc-900/30 opacity-0 hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-zinc-600 hover:text-red-500" onClick={() => pipWindow.close()}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* THE SCROLLING ENGINE VIEWPORT */}
            <div
                ref={scrollContainerRef}
                className="scroll-container flex-1 overflow-y-auto scrollbar-hide pt-[45vh] pb-[60vh] px-12"
                style={{ scrollBehavior: 'auto' }}
            >
                <div className="max-w-xl mx-auto">
                    <div
                        className="text-center font-black leading-[1.7] flex flex-wrap justify-center gap-x-5 gap-y-4"
                        style={{ fontSize: `${pipWindow ? (fontSize * 0.75) : fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isPast = i < currentWordIndex;

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-700 rounded-lg px-2 relative ${isCurrent
                                            ? "text-green-400 scale-110 drop-shadow-[0_0_25px_rgba(74,222,128,0.6)] z-20"
                                            : isPast
                                                ? "text-white/5 opacity-10"
                                                : "text-white/40"
                                        }`}
                                >
                                    {word}
                                    {isCurrent && (
                                        <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recording State Overlay */}
            {isActive && !hasStartedScrolling && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/40">
                    <div className="bg-zinc-900/80 px-4 py-2 rounded-full border border-green-500/30 flex items-center gap-3 animate-pulse">
                        <Zap className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">正在等待语音识别...</span>
                    </div>
                    <p className="mt-4 text-[9px] text-zinc-500 uppercase tracking-[0.3em]">识得第一个字后将开始自动翻页</p>
                </div>
            )}

            {/* Setup View (Main Tab) */}
            {!pipWindow && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-lg z-10 transition-opacity">
                    <div className="text-center space-y-6 max-w-sm p-10 bg-zinc-900/90 rounded-3xl border border-white/5 shadow-2xl">
                        <div className="h-14 w-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/10">
                            <ArrowUp className="h-7 w-7 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white">独立提词器已激活</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed px-4">
                            桌面提词小挂件已弹出。
                            <br /><br />
                            <strong>垂直翻页模式已开启：</strong>
                            它将像电影字幕一样自动向上滚动，并随您的语速快慢自动调节。
                        </p>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 text-zinc-300" onClick={onClose}>
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
