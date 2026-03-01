/**
 * Nordic Warmth Design: SiteHeader
 * - DM Serif Display for brand name
 * - Warm, calm color palette
 * - Profile photo with soft border
 * - Mobile: photo+title stacked, iPad/desktop: same row
 * - Admin button for admin users
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

      <div className="relative container py-8 md:py-12">
        {/* Top row: Language toggle + Admin (mobile: above, desktop: right) */}
        <div className="flex justify-end mb-4 md:mb-0 md:absolute md:top-8 md:right-8 lg:right-12 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage("sv")}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                language === "sv"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-white/70 text-slate-600 hover:bg-white"
              }`}
            >
              Svenska
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                language === "en"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-white/70 text-slate-600 hover:bg-white"
              }`}
            >
              English
            </button>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-md"
              >
                <Settings className="w-3 h-3 md:w-3.5 md:h-3.5" />
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Photo + Title: stacked on mobile (<640px), side-by-side on sm+ (iPad/desktop) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Link href="/" className="shrink-0">
            <img
              src={IMAGES.profile}
              alt="Sten Dellby"
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover border-3 md:border-4 border-white/80 shadow-lg"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link href="/">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-800 leading-tight tracking-tight">
                <span className="block">Jag och min</span>
                <span className="text-[#c05746]">Alzheimer</span>
              </h1>
            </Link>

            <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-xl text-slate-600 max-w-2xl leading-relaxed">
              {t(
                "Jag har fått en Alzheimers diagnos. Här publicerar jag texter i ett försök att bygga en liten faktasamling anpassad för oss sjuka.",
                "I have been diagnosed with Alzheimer's. Here I publish texts in an attempt to build a small knowledge base adapted for those of us who are ill."
              )}
            </p>

            <div className="mt-2 sm:mt-3 md:mt-4 flex flex-wrap items-center gap-3 md:gap-4">
              <a
                href="https://x.com/stendellby"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </a>
              <a
                href="mailto:sten@dellby.info"
                className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                sten@dellby.info
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
