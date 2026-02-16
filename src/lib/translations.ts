export type Language = "zh" | "en";

export const translations = {
    zh: {
        nav: {
            dashboard: "控制台",
            create: "创作中心",
            settings: "设置",
            login: "登录",
            register: "注册",
        },
        marketing: {
            tagline: "全能自媒体矩阵管理工具",
            description: "一站式管理你的所有社交媒体账号。支持 X、抖音、小红书等平台，AI 辅助创作，效率翻倍。",
            getStarted: "立即开始",
            github: "开源地址",
            features: {
                title: "核心功能",
                subtitle: "基于现代技术栈构建，助力自媒体人打造爆款。",
                multiPlatform: {
                    title: "多平台发布",
                    desc: "一次编写，全网分发，覆盖主流自媒体矩阵。"
                },
                aiAssistant: {
                    title: "AI 创作助手",
                    desc: "智能润色、爆款标题生成，让你的内容更具竞争力。"
                },
                analytics: {
                    title: "集中式看板",
                    desc: "全平台数据一目了然，助你科学分析笔记流量。"
                }
            }
        },
        create: {
            title: "内容创作中心",
            subtitle: "在这里编写你的爆款内容，并实时预览多端效果。",
            saveDraft: "保存草稿",
            postToMatrix: "发布到矩阵",
            editorTitle: "内容编辑",
            aiPolish: "AI 一键润色",
            aiPolishing: "AI 润色中...",
            placeholder: "写下你的精彩瞬间...",
            uploadMedia: "媒体上传",
            uploadHint: "支持拖拽图片或视频",
            settings: "发布设置",
            targetPlatforms: "目标平台",
            copyrightShield: "版权保护",
            copyrightActive: "已开启智能水印",
            previewTitle: "多端实时预览",
            platforms: {
                xiaohongshu: "小红书",
                douyin: "抖音",
                bilibili: "B站",
                xiaoyuzhou: "小宇宙",
            },
            preview: {
                xhsTitle: "笔记标题预览",
                xhsBody: "此处展示你的笔记正文预览...",
                dyBody: "此处展示你的短视频描述预览...",
                biliTitle: "这里是你的视频标题预览...",
                biliBody: "这里展示视频简介内容...",
                podTitle: "播客节目名称",
                podHost: "你的播客主理人",
                podDesc: "此处展示你的播客节目介绍预览...",
            }
        },
    },
    en: {
        nav: {
            dashboard: "Dashboard",
            create: "Creator Studio",
            settings: "Settings",
            login: "Login",
            register: "Register",
        },
        marketing: {
            tagline: "The Ultimate Social Media Toolkit",
            description: "Manage all your social media accounts from one place. Post to X, Douyin, Red, and more with AI-powered assistance.",
            getStarted: "Get Started",
            github: "GitHub",
            features: {
                title: "Features",
                subtitle: "Built with modern tech stack to empower content creators.",
                multiPlatform: {
                    title: "Multi-Platform",
                    desc: "Write once, publish everywhere. Cover all major social media networks."
                },
                aiAssistant: {
                    title: "AI Assistant",
                    desc: "Smart polish, viral titles, and content rewriting at your fingertips."
                },
                analytics: {
                    title: "Unified Analytics",
                    desc: "Track your performance across platforms in a single dashboard."
                }
            }
        },
        create: {
            title: "Unified Creator Studio",
            subtitle: "Write viral content and preview across multiple platforms in real-time.",
            saveDraft: "Save Draft",
            postToMatrix: "Publish to Matrix",
            editorTitle: "Content Editor",
            aiPolish: "AI Polish",
            aiPolishing: "Polishing...",
            placeholder: "Write your amazing content here...",
            uploadMedia: "Upload Media",
            uploadHint: "Drag and drop images or videos",
            settings: "Publish Settings",
            targetPlatforms: "Target Platforms",
            copyrightShield: "Copyright Shield",
            copyrightActive: "Smart Watermark Enabled",
            previewTitle: "Cross-Platform Preview",
            platforms: {
                xiaohongshu: "Red",
                douyin: "TikTok CN",
                bilibili: "Bilibili",
                xiaoyuzhou: "Cosmos",
            },
            preview: {
                xhsTitle: "Post Title Preview",
                xhsBody: "Your post content will appear here...",
                dyBody: "Your video description will appear here...",
                biliTitle: "Your video title goes here...",
                biliBody: "Video description preview...",
                podTitle: "Podcast Episode Title",
                podHost: "Your Podcast Host",
                podDesc: "Your show notes preview will appear here...",
            }
        },
    },
};
