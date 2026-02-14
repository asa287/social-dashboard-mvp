
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function IndexPage() {
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
                        The Ultimate Social Media Toolkit for Creators
                    </h1>
                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        Manage all your social media accounts from one place. Post to X, TikTok, XiaoHongShu, and more with AI-powered assistance.
                    </p>
                    <div className="space-x-4">
                        <Link href="/login">
                            <Button size="lg">Get Started</Button>
                        </Link>
                        <Link href="https://github.com" target="_blank" rel="noreferrer">
                            <Button variant="outline" size="lg">GitHub</Button>
                        </Link>
                    </div>
                </div>
            </section>
            <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                        Features
                    </h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        This project is an experiment to see how a modern app, with features like auth, database, subscriptions, and layout, can be built.
                    </p>
                </div>
                <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <div className="space-y-2">
                                <h3 className="font-bold">Multi-Platform</h3>
                                <p className="text-sm text-muted-foreground">Post to multiple platforms simultaneously.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <div className="space-y-2">
                                <h3 className="font-bold">AI Assistant</h3>
                                <p className="text-sm text-muted-foreground">Generate catchy titles and rewrite content.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <div className="space-y-2">
                                <h3 className="font-bold">Analytics</h3>
                                <p className="text-sm text-muted-foreground">Unified dashboard for all your metrics.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
