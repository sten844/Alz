/**
 * Nordic Warmth Design: SiteFooter
 * - Warm slate background
 * - Simple, clean layout
 * - Large font sizes for accessibility
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-800 text-slate-300 py-12 mt-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl text-white mb-3">Jag och min Alzheimer</h3>
            <p className="text-base leading-relaxed text-slate-400">
              {t(
                "En kunskapsbank om att leva med Alzheimers sjukdom.",
                "A knowledge base about living with Alzheimer's disease."
              )}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-lg">{t("Länkar", "Links")}</h4>
            <ul className="space-y-2 text-base">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t("Hem", "Home")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t("Om mig", "About me")}
                </Link>
              </li>
              <li>
                <a
                  href="https://x.com/stendellby"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t("Följ mig på X", "Follow me on X")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-lg">{t("Kontakt", "Contact")}</h4>
            <a
              href="mailto:sten@dellby.info"
              className="text-base hover:text-white transition-colors"
            >
              sten@dellby.info
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-700 text-center text-base text-slate-500">
          © {new Date().getFullYear()} Sten Dellby. {t("Alla rättigheter förbehållna.", "All rights reserved.")}
        </div>
      </div>
    </footer>
  );
}
