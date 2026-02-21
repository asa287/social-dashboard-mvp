
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
// import { Icons } from "@/components/icons" 
import { BarChart3, FileText, Settings, LayoutDashboard, Mic } from "lucide-react"

export function DashboardNav() {
    const pathname = usePathname()
    const { t } = useI18n()

    const items = [
        {
            title: t.nav.dashboard,
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: t.nav.create,
            href: "/create",
            icon: FileText,
        },
        {
            title: t.create.teleprompter.title,
            href: "/teleprompter",
            icon: Mic,
        },
        {
            title: "Analytics",
            href: "/dashboard/analytics",
            icon: BarChart3,
        },
        {
            title: t.nav.settings,
            href: "/dashboard/settings",
            icon: Settings,
        },
    ]

    if (!items?.length) {
        return null
    }

    return (
        <nav className="grid items-start gap-2">
            {items.map((item, index) => {
                const Icon = item.icon
                return (
                    item.href && (
                        <Link
                            key={index}
                            href={item.href}
                        >
                            <span
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    pathname === item.href ? "bg-accent" : "transparent"
                                )}
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                <span>{item.title}</span>
                            </span>
                        </Link>
                    )
                )
            })}
        </nav>
    )
}
