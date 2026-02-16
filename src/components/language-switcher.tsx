"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
    const { lang, setLang } = useI18n();

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center gap-2 text-xs font-semibold border-primary/20 bg-background shadow-sm hover:bg-accent"
        >
            <Languages className="h-4 w-4" />
            {lang === "zh" ? "EN" : "中文"}
        </Button>
    );
}
