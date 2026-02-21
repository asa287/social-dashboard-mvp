"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { Teleprompter } from "@/components/teleprompter";
import { Mic, Play, MoreHorizontal, History } from "lucide-react";

export default function TeleprompterPage() {
    const { t } = useI18n();
    const [content, setContent] = useState("");
    const [showTeleprompter, setShowTeleprompter] = useState(false);

    return (
        <div className="flex flex-col space-y-6 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.create.teleprompter.title}</h1>
                    <p className="text-muted-foreground">准备你的脚本，开启专业的 AI 语义同步提词体验。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="min-h-[500px] flex flex-col shadow-sm border-2 border-green-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold">编辑提词脚本</CardTitle>
                                <CardDescription>在此输入或粘贴你想要朗读的内容</CardDescription>
                            </div>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 px-6"
                                onClick={async () => {
                                    // Pre-launch PiP if supported (requires user gesture)
                                    if ('documentPictureInPicture' in window) {
                                        setShowTeleprompter(true);
                                    } else {
                                        setShowTeleprompter(true);
                                    }
                                }}
                                disabled={!content.trim()}
                            >
                                <Play className="mr-2 h-4 w-4 fill-current" />
                                {t.create.teleprompter.start}
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col pt-0">
                            <Textarea
                                placeholder={t.create.placeholder}
                                className="flex-1 min-h-[400px] text-xl leading-relaxed resize-none border-none focus-visible:ring-0 p-4 bg-zinc-50/50 rounded-xl"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                {t.create.teleprompter.settings}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    <strong>{t.create.teleprompter.voiceSync}</strong> 已开启。系统将自动根据你的语速滚动字幕，无需手动翻页。
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100 space-y-2">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">录制小贴士</p>
                                <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
                                    <li>保持环境安静以提高识别准确度</li>
                                    <li>尽量将浏览器窗口移近摄像头</li>
                                    <li>支持双设备同步（开发中）</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="opacity-60">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4" />
                                最近脚本
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground text-center py-8 italic">暂无历史记录</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {showTeleprompter && (
                <Teleprompter
                    content={content}
                    onClose={() => setShowTeleprompter(false)}
                />
            )}
        </div>
    );
}

function Settings(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
