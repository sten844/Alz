/**
 * Nordic Warmth Design: SiteHeader
 * - DM Serif Display for brand name
 * - Warm, calm color palette
 * - Profile photo with soft border
 * - Mobile: compact layout, language buttons with links row
 * - Admin button for admin users
 * - Large font sizes for accessibility
 * - Reads description, ledord, X link, email from database settings
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { IMAGES } from "@/data/articles";
import { Link } from "wouter";
import { Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

const HEADER_KEYS = ["header_description_sv", "header_description_en", "homepage_intro_sv", "homepage_intro_en", "header_ledord", "header_x_link", "header_email"];

const DEFAULTS = {
  header_description_sv: "Jag har fått en Alzheimers diagnos (Kod F002/F018). Här publicerar jag texter i ett försök att bygga en faktasamling om sjukdomen. Mina ledord: Vetenskap, Behandling, Vardag",
  header_description_en: "I have been diagnosed with Alzheimer's (Code F002/F018). Here I publish texts in an attempt to build a knowledge base about the disease. My keywords: Science, Treatment, Everyday Life",
  homepage_intro_sv: "En personlig webbplats om att leva med Alzheimer – och om mitt försök att följa forskning, finna behandling och förbättra vardagsliv.",
  homepage_intro_en: "A personal website about living with Alzheimer's – and about my attempt to follow research, find treatments, and improve everyday life.",
  header_ledord: "Vetenskap, Behandling, Vardag",
  header_x_link: "https://x.com/stendellby",
  header_email: "sten@dellby.info",
};

export default function SiteHeader({ showLanguage = true }: { showLanguage?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  const { data: settings } = trpc.settings.getMany.useQuery({ keys: HEADER_KEYS });

  const introSv = settings?.homepage_intro_sv || DEFAULTS.homepage_intro_sv;
  const introEn = settings?.homepage_intro_en || DEFAULTS.homepage_intro_en;
  const ledord = settings?.header_ledord || DEFAULTS.header_ledord;
  const xLink = settings?.header_x_link || DEFAULTS.header_x_link;
  const email = settings?.header_email || DEFAULTS.header_email;

  const description = language === "sv" ? introSv : introEn;

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
        {showLanguage && (
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
          </div>
        </div>
        )}

        {/* Photo + Title: always on same row */}
        <div className="flex flex-row items-center gap-3 sm:gap-5 md:gap-6">
          <Link href="/" className="shrink-0 cursor-pointer group">
            <img
              src={IMAGES.profile}
              alt="Sten Dellby"
              className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full object-cover border-2 sm:border-3 md:border-4 border-white/80 shadow-lg group-hover:shadow-xl group-hover:border-[#c05746]/40 transition-all duration-200"
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
              {description}
            </p>

            <div className="hidden sm:flex mt-2 md:mt-4 flex-wrap items-center gap-3 md:gap-4">
              <a
                href={xLink}
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
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 md:gap-2 text-base font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Mail className="w-4 h-4 md:w-5 md:h-5" />
                {email}
              </a>
            </div>


          </div>
        </div>

        {/* Mobile-only: description + links + language */}
        <div className="sm:hidden mt-2">
          <p className="text-base text-slate-600 leading-snug">
            {description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <a
              href={xLink}
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
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 text-base font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {email}
            </a>

            {showLanguage && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setLanguage("sv")}
                  className={`px-2.5 py-1 rounded-full text-sm font-semibold transition-all border ${
                    language === "sv"
                      ? "bg-[#c05746] text-white border-[#c05746] shadow-sm"
                      : "bg-white text-slate-600 border-slate-400 hover:bg-white hover:border-slate-500 shadow-sm"
                  }`}
                >
                  Sv
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 rounded-full text-sm font-semibold transition-all border ${
                    language === "en"
                      ? "bg-[#c05746] text-white border-[#c05746] shadow-sm"
                      : "bg-white text-slate-600 border-slate-400 hover:bg-white hover:border-slate-500 shadow-sm"
                  }`}
                >
                  En
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
