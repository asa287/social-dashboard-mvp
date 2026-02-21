"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/components/i18n-provider";
import { polishContent } from "@/app/actions/posts";
import { toast } from "sonner";
import {
    Sparkles,
    Send,
    Smartphone,
    Tv,
    Mic,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Video
} from "lucide-react";

export default function CreatePostPage() {
    const { t, lang } = useI18n();
    const [content, setContent] = useState("");
    const [isPolishing, setIsPolishing] = useState(false);

    const handleAiPolish = async () => {
        if (!content.trim()) return;

        setIsPolishing(true);
        try {
            const result = await polishContent(content);
            if (result.success && result.polishedContent) {
                setContent(result.polishedContent);
                toast.success(lang === "zh" ? "AI 润色成功！" : "AI Polish Successful!");
            } else {
                toast.error(result.error || "AI Polish Failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsPolishing(false);
        }
    };

    return (
        <div className="flex flex-col space-y-6 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.create.title}</h1>
                    <p className="text-muted-foreground">{t.create.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">{t.create.saveDraft}</Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <Send className="mr-2 h-4 w-4" />
                        {t.create.postToMatrix}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Left: Input Section */}
                <div className="flex flex-col space-y-6">
                    <Card className="border-2 border-primary/10 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="content" className="text-lg font-semibold">{t.create.editorTitle}</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAiPolish}
                                            disabled={isPolishing || !content}
                                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <Sparkles className={`mr-2 h-4 w-4 ${isPolishing ? "animate-spin" : ""}`} />
                                            {isPolishing ? t.create.aiPolishing : t.create.aiPolish}
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    id="content"
                                    placeholder={t.create.placeholder}
                                    className="min-h-[300px] text-lg resize-none border-none focus-visible:ring-0 p-0"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                                <Separator />
                                <div className="flex items-center gap-4 py-2">
                                    <Button variant="outline" size="sm" className="rounded-full">
                                        <ImageIcon className="mr-2 h-4 w-4" /> {t.create.uploadMedia}
                                    </Button>
                                    <p className="text-xs text-muted-foreground italic">{t.create.uploadHint} (Cloudinary 集成中)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold">{t.create.settings}</h3>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2 border rounded-lg p-2 bg-muted/50">
                                    <span className="text-xs font-medium">{t.create.targetPlatforms}:</span>
                                    <div className="flex gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-xs">{t.create.platforms.xiaohongshu}</span>
                                        <CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-xs">{t.create.platforms.douyin}</span>
                                        <CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-xs">{t.create.platforms.bilibili}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-2 bg-muted/50">
                                    <span className="text-xs font-medium">{t.create.copyrightShield}:</span>
                                    <span className="text-xs text-muted-foreground">{t.create.copyrightActive}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Preview Section */}
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2 mb-2 font-semibold text-lg">
                        <Smartphone className="h-5 w-5" /> {t.create.previewTitle}
                    </div>

                    <Tabs defaultValue="xiaohongshu" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="xiaohongshu">{t.create.platforms.xiaohongshu}</TabsTrigger>
                            <TabsTrigger value="douyin">{t.create.platforms.douyin}</TabsTrigger>
                            <TabsTrigger value="bilibili">{t.create.platforms.bilibili}</TabsTrigger>
                            <TabsTrigger value="xiaoyuzhou">{t.create.platforms.xiaoyuzhou}</TabsTrigger>
                        </TabsList>

                        <div className="mt-6 flex justify-center">
                            <TabsContent value="xiaohongshu" className="w-full focus-visible:ring-0">
                                <Card className="mx-auto w-[350px] aspect-[9/19] rounded-[3rem] border-[12px] border-slate-900 shadow-2xl relative overflow-hidden bg-white">
                                    <div className="absolute top-0 w-full h-6 bg-slate-900 flex justify-center items-end pb-1">
                                        <div className="w-20 h-4 bg-slate-900 rounded-full" />
                                    </div>
                                    <div className="p-4 mt-4 h-full flex flex-col">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-200" />
                                            <div className="font-bold text-sm">你的自媒体账号</div>
                                        </div>
                                        <div className="flex-1 bg-slate-50 rounded-lg flex items-center justify-center border-dashed border-2 border-slate-200 mb-4">
                                            <p className="text-xs text-slate-400">图片预览区域</p>
                                        </div>
                                        <div className="space-y-2 max-h-[150px] overflow-hidden">
                                            <p className="text-sm font-bold">{t.create.preview.xhsTitle}</p>
                                            <p className="text-xs text-slate-600 whitespace-pre-wrap">
                                                {content || t.create.preview.xhsBody}
                                            </p>
                                        </div>
                                        <div className="mt-auto pt-4 border-t flex justify-between text-slate-400">
                                            <div className="flex gap-4">
                                                <span className="text-xs">❤ 1.2w</span>
                                                <span className="text-xs">⭐ 3.4k</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="douyin" className="w-full focus-visible:ring-0">
                                <Card className="mx-auto w-[350px] aspect-[9/19] rounded-[3rem] border-[12px] border-slate-900 shadow-2xl relative overflow-hidden bg-black text-white">
                                    <div className="absolute top-0 w-full h-6 bg-slate-900" />
                                    <div className="h-full flex flex-col justify-end p-6 pb-12 bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="space-y-2">
                                            <p className="font-bold">@你的自媒体账号</p>
                                            <p className="text-sm line-clamp-3 whitespace-pre-wrap">
                                                {content || t.create.preview.dyBody}
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="text-xs px-2 py-1 bg-white/20 rounded">#自媒体</span>
                                                <span className="text-xs px-2 py-1 bg-white/20 rounded">#爆款</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center">
                                        <div className="w-12 h-12 rounded-full bg-slate-500 border-2 border-white" />
                                        <div className="flex flex-col items-center"><CheckCircle2 className="h-8 w-8 text-red-500 fill-red-500" /><span className="text-[10px]">12.4w</span></div>
                                        <div className="flex flex-col items-center"><AlertCircle className="h-8 w-8" /><span className="text-[10px]">3.1k</span></div>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="bilibili" className="w-full focus-visible:ring-0">
                                <Card className="mx-auto w-full max-w-[500px] border-none shadow-xl bg-white overflow-hidden">
                                    <div className="bg-[#fb7299] p-3 flex justify-between items-center text-white">
                                        <span className="font-bold text-sm">Bilibili 视频预览</span>
                                        <div className="flex gap-2 text-[10px]">
                                            <span className="bg-white/20 px-2 py-0.5 rounded">分区: 科技</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-100 aspect-video relative flex items-center justify-center border-b">
                                        <Tv className="h-12 w-12 text-slate-300" />
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1 rounded">10:24</div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <h2 className="text-lg font-bold line-clamp-2">
                                            {content.split('\n')[0] || t.create.preview.biliTitle}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200" />
                                            <span className="text-xs font-semibold">你的UP主账号</span>
                                            <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-500 rounded-full border border-pink-200">+ 关注</span>
                                        </div>
                                        <Separator />
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <div className="flex gap-4 text-xs text-slate-400 mb-2">
                                                <span>12.4万播放</span>
                                                <span>3421弹幕</span>
                                                <span>2026-02-15</span>
                                            </div>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed line-clamp-6">
                                                {content || t.create.preview.biliBody}
                                            </p>
                                        </div>
                                        <div className="flex justify-around py-2 border-t mt-4 grayscale opacity-50">
                                            <div className="flex flex-col items-center gap-1"><CheckCircle2 className="h-5 w-5" /><span className="text-[10px]">点赞</span></div>
                                            <div className="flex flex-col items-center gap-1"><Sparkles className="h-5 w-5" /><span className="text-[10px]">投币</span></div>
                                            <div className="flex flex-col items-center gap-1"><AlertCircle className="h-5 w-5" /><span className="text-[10px]">收藏</span></div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="xiaoyuzhou" className="w-full focus-visible:ring-0">
                                <Card className="mx-auto w-[350px] aspect-[9/19] rounded-[3rem] border-[12px] border-slate-900 shadow-2xl relative overflow-hidden bg-[#f9f7f2]">
                                    <div className="absolute top-0 w-full h-8 flex justify-center items-end pb-1">
                                        <div className="w-20 h-4 bg-slate-900 rounded-full" />
                                    </div>
                                    <div className="p-6 mt-6 flex flex-col h-full overflow-y-auto no-scrollbar">
                                        <div className="aspect-square w-full rounded-2xl bg-[#e6e2d3] shadow-inner mb-6 flex items-center justify-center">
                                            <Mic className="h-20 w-20 text-[#c7c2b0]" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-bold text-[#2d2d2d]">{t.create.preview.podTitle}</h3>
                                                <p className="text-sm text-[#8c8c8c]">{t.create.preview.podHost}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="bg-[#ede9d8] text-[#5c5a4f] text-[10px] px-2 py-1 rounded">科技</span>
                                                <span className="bg-[#ede9d8] text-[#5c5a4f] text-[10px] px-2 py-1 rounded">2026-02-15</span>
                                            </div>
                                            <Separator className="bg-[#e6e2d3]" />
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-[#2d2d2d]">Show Notes</h4>
                                                <p className="text-sm text-[#5c5a4f] whitespace-pre-wrap leading-relaxed">
                                                    {content || t.create.preview.podDesc}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-8 bg-white/50 p-4 rounded-2xl border border-white/80">
                                            <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-4">
                                                <div className="h-full w-1/3 bg-orange-400" />
                                            </div>
                                            <div className="flex justify-between items-center px-4">
                                                <span className="text-[10px] opacity-40">-15s</span>
                                                <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-white rounded-sm" />
                                                </div>
                                                <span className="text-[10px] opacity-40">+30s</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
