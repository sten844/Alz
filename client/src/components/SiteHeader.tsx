/**
 * Nordic Warmth Design: SiteHeader
 * - DM Serif Display for brand name
 * - Warm, calm color palette
 * - Profile photo with soft border
 * - Mobile: compact layout, language buttons with links row
 * - Admin button for admin users
 * - Large font sizes for accessibility
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { IMAGES } from "@/data/articles";
import { Link } from "wouter";
import { Mail, Settings } from "lucide-react";

export default function SiteHeader() {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <header className="relative overflow-hidden">
      {/* Watercolor hero background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/8WpNeAbro3JFUbiWRvCLsD/sandbox/zwUeCEkFBJrwdUxgtT1dgG-img-1_1772112538000_na1fn_aGVyby1iZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOFdwTmVBYnJvM0pGVWJpV1J2Q0xzRC9zYW5kYm94L3p3VWVDRWtGQkpyd2RVeGd0VDFkZ0ctaW1nLTFfMTc3MjExMjUzODAwMF9uYTFmbl9hR1Z5YnkxaVp3LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=dcJCRTmGHYAdo0pEFVE2Ap-NFcqzGR2au2jKacwTnSmvptIZkgbzb880ytctwn73~539ov62pa3LFY48zgMSU5l041D6HJDcONKVKWJuidKgrl~Gt7bomujkEnMx9ETa0kltXVY9LykmyG3JTdmzF9KwnnQvcSqMgRbDIrDuU8hZv-DekTP95FMQuGxUnLlo2dFidvgvODN-gQgbYD75X0MF~8bdms4k0TN47U--Mo3pCG26r5ndt~rWWMqEEFenXmkRkwQIarKOtkaSGGC331p~0nU2zNQ7q-boCQ7blQmIcBq6lwr3N8IQT0RifrHpYEKKRtPW6wOOBaW8L9Tw7A__')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/60" />

      <div className="relative container py-5 sm:py-8 md:py-12">
        {/* Desktop: Language toggle + Admin (top right) */}
        <div className="hidden sm:flex justify-end mb-0 md:absolute md:top-8 md:right-8 lg:right-12 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage("sv")}
              className={`px-4 py-2 rounded-full text-base font-semibold transition-all border ${
                language === "sv"
                  ? "bg-[#c05746] text-white border-[#c05746] shadow-md"
                  : "bg-white/80 text-slate-600 border-slate-300 hover:bg-white hover:border-slate-400"
              }`}
            >
              Svenska
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 rounded-full text-base font-semibold transition-all border ${
                language === "en"
                  ? "bg-[#c05746] text-white border-[#c05746] shadow-md"
                  : "bg-white/80 text-slate-600 border-slate-300 hover:bg-white hover:border-slate-400"
              }`}
            >
              English
            </button>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-md"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Photo + Title: always on same row */}
        <div className="flex flex-row items-center gap-3 sm:gap-5 md:gap-6">
          <Link href="/" className="shrink-0">
            <img
              src={IMAGES.profile}
              alt="Sten Dellby"
              className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full object-cover border-2 sm:border-3 md:border-4 border-white/80 shadow-lg"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link href="/">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-800 leading-none tracking-tight">
                <span>Jag och min </span>
                <span className="text-[#c05746]">Alzheimer</span>
              </h1>
            </Link>

            <p className="hidden sm:block mt-2 md:mt-3 text-base md:text-xl text-slate-600 max-w-2xl leading-relaxed">
              {t(
                "Jag har fått en Alzheimers diagnos. Här publicerar jag texter i ett försök att bygga en liten faktasamling anpassad för oss sjuka.",
                "I have been diagnosed with Alzheimer's. Here I publish texts in an attempt to build a small knowledge base adapted for those of us who are ill."
              )}
            </p>

            <div className="hidden sm:flex mt-2 md:mt-4 flex-wrap items-center gap-3 md:gap-4">
              <a
                href="https://x.com/stendellby"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 md:gap-2 text-base font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </a>
              <a
                href="mailto:sten@dellby.info"
                className="inline-flex items-center gap-1.5 md:gap-2 text-base font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Mail className="w-4 h-4 md:w-5 md:h-5" />
                sten@dellby.info
              </a>
            </div>
          </div>
        </div>

        {/* Mobile-only: description + links + language */}
        <div className="sm:hidden mt-2">
          <p className="text-base text-slate-600 leading-snug">
            {t(
              "Jag har fått en Alzheimers diagnos. Här publicerar jag texter i ett försök att bygga en liten faktasamling anpassad för oss sjuka.",
              "I have been diagnosed with Alzheimer's. Here I publish texts in an attempt to build a small knowledge base adapted for those of us who are ill."
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <a
              href="https://x.com/stendellby"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-base font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </a>
            <a
              href="mailto:sten@dellby.info"
              className="inline-flex items-center gap-1.5 text-base font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Mail className="w-4 h-4" />
              sten@dellby.info
            </a>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setLanguage("sv")}
              className={`px-3 py-1.5 rounded-full text-base font-semibold transition-all border ${
                language === "sv"
                  ? "bg-[#c05746] text-white border-[#c05746] shadow-sm"
                  : "bg-white/80 text-slate-600 border-slate-300 hover:bg-white hover:border-slate-400"
              }`}
            >
              Svenska
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 rounded-full text-base font-semibold transition-all border ${
                language === "en"
                  ? "bg-[#c05746] text-white border-[#c05746] shadow-sm"
                  : "bg-white/80 text-slate-600 border-slate-300 hover:bg-white hover:border-slate-400"
              }`}
            >
              English
            </button>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
