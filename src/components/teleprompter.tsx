"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Zap } from "lucide-react";
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

    // UNIFIED ACTIVATION LOGIC (NATIVE LOOK)
    const triggerStart = async () => {
        if (isActive) return;
        setIsActive(true);

        if ('documentPictureInPicture' in window) {
            try {
                const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
                    width: 500,
                    height: 400, // Vertical orientation
                });

                // Copy Styles to ensure native look
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
                newPipWindow.document.body.style.backgroundColor = 'black';
                newPipWindow.document.body.style.overflow = 'hidden';
                newPipWindow.document.body.style.cursor = 'grab';

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

            // Match Logic
            const searchWindow = 20;
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

    // VERTICAL HYBRID SCROLL ENGINE (Automatic + Voice Adaptive)
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

        // 1. Base Drifting Speed (Pixels per frame)
        // This ensures the content is ALWAYS moving slightly even if speech pauses briefly
        let speed = 0.6;

        // 2. Adaptive Speed Multiplier based on current highlit sentence position
        const activeElement = container.querySelector(`[data-index="${currentWordIndex}"]`) as HTMLElement;
        if (activeElement) {
            const containerCenter = container.clientHeight / 2.5; // Target is slightly above center
            const targetPos = activeElement.offsetTop - containerCenter;
            const currentScroll = container.scrollTop;
            const diff = targetPos - currentScroll;

            // P-Controller Logic for vertical scrolling
            if (diff > 150) speed = 3.5; // Catch up fast for large jumps
            else if (diff > 30) speed = 1.8; // Catch up normally
            else if (diff < -50) speed = 0.1; // Ahead of speech, almost stop
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
            {/* Minimal Grip Title Bar (Only in stand-alone PiP) */}
            {pipWindow && (
                <div className="h-6 flex items-center justify-between px-3 bg-zinc-900/50 border-b border-white/5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5">
                        <Zap className="h-2.5 w-2.5 text-green-500" />
                        <span className="text-[7px] font-bold tracking-[0.3em] uppercase text-zinc-400">TELEPROMPTER WIDGET</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-zinc-600 hover:text-red-500" onClick={() => pipWindow.close()}>
                        <X className="h-2.5 w-2.5" />
                    </Button>
                </div>
            )}

            {/* VERTICAL Scrolling Container */}
            <div
                ref={scrollContainerRef}
                className="scroll-container flex-1 overflow-y-auto scrollbar-hide pt-[40vh] pb-[60vh] px-10"
                style={{ scrollBehavior: 'auto' }}
            >
                <div className="max-w-xl mx-auto">
                    <div
                        className="text-center font-black leading-[1.6] flex flex-wrap justify-center gap-x-4 gap-y-3"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isPast = i < currentWordIndex;

                            return (
                                <span
                                    key={i}
                                    data-index={i}
                                    className={`transition-all duration-700 rounded-lg px-1.5 relative ${isCurrent
                                            ? "text-green-400 scale-110 translate-y-[-4px] drop-shadow-[0_0_20px_rgba(74,222,128,0.5)] z-20"
                                            : isPast
                                                ? "text-white/5 opacity-20"
                                                : "text-white/30"
                                        }`}
                                >
                                    {word}
                                    {isCurrent && (
                                        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-green-500/80 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Setup View (Only in Main Browser Tab) */}
            {!pipWindow && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-10 transition-opacity">
                    <div className="text-center space-y-6 max-w-sm p-8 bg-zinc-900/80 rounded-2xl border border-white/5">
                        <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Zap className="h-6 w-6 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold">提词浮窗已激活</h2>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            独立的提词小部件已在您的桌面弹出。
                            <br /><br />
                            <strong>使用说明：</strong>
                            1. 在您的录制软件上方拖动该浮窗。
                            2. 只要您开始说话，文字就会自动垂直翻动。
                        </p>
                        <Button variant="outline" className="w-full border-white/10" onClick={onClose}>
                            关闭并返回
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
