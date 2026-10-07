"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Cpu, Sparkles, Database, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  currentModel?: string;
  onModelChange?: (model: "gemini" | "ollama" | "demo") => void;
  activeMeetingCount?: number;
}

export default function Header({
  currentModel = "gemini",
  onModelChange,
  activeMeetingCount = 0,
}: HeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme preference
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-2 border-charcoal dark:border-foreground py-3 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-serif text-2xl font-black tracking-tight text-charcoal dark:text-foreground hover:text-rust transition-colors"
          >
            MeetOps<span className="text-rust">.</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 font-mono text-[11px] font-bold uppercase tracking-widest text-charcoal dark:text-foreground">
          <Link
            href="/"
            className={`transition-colors hover:text-rust hover:underline underline-offset-4 ${
              pathname === "/" ? "text-rust underline" : ""
            }`}
          >
            01/Studio
          </Link>
          <Link
            href="/registry"
            className={`transition-colors hover:text-rust hover:underline underline-offset-4 ${
              pathname === "/registry" ? "text-rust underline" : ""
            }`}
          >
            02/Registry
          </Link>
          <Link
            href="/profiles"
            className={`transition-colors hover:text-rust hover:underline underline-offset-4 ${
              pathname === "/profiles" ? "text-rust underline" : ""
            }`}
          >
            03/Profiles
          </Link>
        </nav>

        {/* Right Tools: Model Selector & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* AI Engine Switcher */}
          {onModelChange && (
            <div className="flex items-center bg-card border-2 border-charcoal dark:border-foreground shadow-[2px_2px_0px_#2F3542] dark:shadow-[2px_2px_0px_#F5F2EB] p-0.5">
              <button
                onClick={() => onModelChange("gemini")}
                className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
                  currentModel === "gemini"
                    ? "bg-rust text-white"
                    : "text-charcoal dark:text-foreground hover:bg-paper-cool/60"
                }`}
                title="Google Gemini 2.0 Flash (Cloud Engine)"
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Gemini</span>
              </button>
              <button
                onClick={() => onModelChange("ollama")}
                className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
                  currentModel === "ollama"
                    ? "bg-lime text-charcoal"
                    : "text-charcoal dark:text-foreground hover:bg-paper-cool/60"
                }`}
                title="Ollama Local LLM (qwen2.5:3b)"
              >
                <Cpu className="w-3 h-3" />
                <span className="hidden sm:inline">Ollama</span>
              </button>
              <button
                onClick={() => onModelChange("demo")}
                className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
                  currentModel === "demo"
                    ? "bg-charcoal text-white dark:bg-foreground dark:text-charcoal"
                    : "text-charcoal dark:text-foreground hover:bg-paper-cool/60"
                }`}
                title="Offline Simulation (No API keys needed)"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden sm:inline">Demo</span>
              </button>
            </div>
          )}

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-card text-charcoal dark:text-foreground border-2 border-charcoal dark:border-foreground shadow-[2px_2px_0px_#2F3542] dark:shadow-[2px_2px_0px_#F5F2EB] hover:bg-lime hover:text-charcoal active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Toggle Theme"
            title="Toggle Light / Dark Archive Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-lime" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
