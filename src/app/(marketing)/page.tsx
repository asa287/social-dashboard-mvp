"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export default function IndexPage() {
    const { t } = useI18n();

    return (
        <>
            <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                    <Link
                        href="https://twitter.com/shadcn"
                        className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium"
                        target="_blank"
                    >
                        Follow along on Twitter
                    </Link>
                    <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                        {t.marketing.tagline}
                    </h1>
                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        {t.marketing.description}
                    </p>
                    <div className="space-x-4">
                        <Link href="/login">
                            <Button size="lg">{t.marketing.getStarted}</Button>
                        </Link>
                        <Link href="https://github.com" target="_blank" rel="noreferrer">
                            <Button variant="outline" size="lg">{t.marketing.github}</Button>
                        </Link>
                    </div>
                </div>
            </section>
            <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                        {t.marketing.features.title}
                    </h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        {t.marketing.features.subtitle}
                    </p>
                </div>
                <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <div className="space-y-2">
                                <h3 className="font-bold">{t.marketing.features.multiPlatform.title}</h3>
                                <p className="text-sm text-muted-foreground">{t.marketing.features.multiPlatform.desc}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <div className="space-y-2">
                                <h3 className="font-bold">{t.marketing.features.aiAssistant.title}</h3>
                                <p className="text-sm text-muted-foreground">{t.marketing.features.aiAssistant.desc}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <div className="space-y-2">
                                <h3 className="font-bold">{t.marketing.features.analytics.title}</h3>
                                <p className="text-sm text-muted-foreground">{t.marketing.features.analytics.desc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
