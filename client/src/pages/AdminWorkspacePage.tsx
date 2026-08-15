import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, ExternalLink, Github, Loader2, LogIn, Save, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const GITHUB_URL = "https://github.com/sten844/Alz";
const MANUS_WORKSPACE_URL = "manus-webdev://da85ee0f";

export default function AdminWorkspacePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [chatLink, setChatLink] = useState("");

  const { data, isLoading } = trpc.adminWorkspace.get.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const updateChatLink = trpc.adminWorkspace.updateChatLink.useMutation({
    onSuccess: () => toast.success(t("Arbetschatten är sparad.", "Workspace chat saved.")),
    onError: () => toast.error(t("Kunde inte spara länken.", "Could not save the link.")),
  });

  useEffect(() => {
    if (data) setChatLink(data.chatLink);
  }, [data]);

  const pageFrame = (content: React.ReactNode) => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader showLanguage={false} />
      <main className="flex-1">{content}</main>
      <SiteFooter />
    </div>
  );

  if (authLoading) {
    return pageFrame(<div className="flex h-72 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#c05746]" /></div>);
  }

  if (!isAuthenticated) {
    return pageFrame(
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <LogIn className="w-20 h-20 mx-auto mb-6 text-muted-foreground/50" />
          <h1 className="text-4xl mb-4 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Logga in", "Log in")}</h1>
          <p className="text-xl text-muted-foreground mb-8">{t("Du måste logga in för att öppna denna privata administrationssida.", "You must log in to open this private administration page.")}</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-8 py-4 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-lg">
            <LogIn className="w-5 h-5" />{t("Logga in med Manus", "Log in with Manus")}
          </a>
        </div>
      </div>,
    );
  }

  if (user?.role !== "admin") {
    return pageFrame(
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-20 h-20 mx-auto mb-6 text-red-400" />
          <h1 className="text-4xl mb-4 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Åtkomst nekad", "Access denied")}</h1>
          <p className="text-xl text-muted-foreground mb-8">{t("Bara administratörer kan öppna denna sida.", "Only administrators can open this page.")}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-4 bg-card border border-border/50 rounded-full text-lg font-medium hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" />{t("Tillbaka till startsidan", "Back to home")}</Link>
        </div>
      </div>,
    );
  }

  return pageFrame(
    <div className="container max-w-4xl py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1 text-base text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" />{t("Till admin", "Back to admin")}</Link>
          <h1 className="text-4xl mt-3 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Min webbplats – administration", "My website – administration")}</h1>
        </div>
        <span className="rounded-full bg-[#c05746]/10 px-4 py-2 text-sm font-semibold text-[#a8483b]">{t("Endast för administratör", "Administrators only")}</span>
      </div>

      <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground mb-8">{t("Detta är din privata återväg till webbplatsens viktigaste administrativa verktyg. Sidan visas inte i den publika navigeringen.", "This is your private route back to the website’s key administrative tools. It is not shown in public navigation.")}</p>

      <div className="grid gap-5 md:grid-cols-2">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-colors hover:bg-accent/40">
          <Github className="w-7 h-7 mb-4 text-[#a8483b]" />
          <h2 className="text-2xl font-semibold text-foreground">GitHub</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{t("Webbplatsens kod och säkerhetskopia.", "Website code and backup.")}</p>
          <span className="mt-5 inline-flex items-center gap-1 font-semibold text-[#a8483b]">{t("Öppna GitHub", "Open GitHub")}<ExternalLink className="w-4 h-4" /></span>
        </a>

        <a href={MANUS_WORKSPACE_URL} className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-colors hover:bg-accent/40">
          <ExternalLink className="w-7 h-7 mb-4 text-[#a8483b]" />
          <h2 className="text-2xl font-semibold text-foreground">Manus</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{t("Öppna den publicerade webbplatsversionen och dess projektmiljö.", "Open the published website version and its project environment.")}</p>
          <span className="mt-5 inline-flex items-center gap-1 font-semibold text-[#a8483b]">{t("Öppna Manus", "Open Manus")}<ExternalLink className="w-4 h-4" /></span>
        </a>
      </div>

      <section className="mt-5 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-foreground">{t("Arbetschatt för dellby.info", "Workspace chat for dellby.info")}</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{t("Spara länken till den chatt där arbetet med dellby.info fortsätter. Länken är bara synlig här för administratör.", "Save the link to the chat where work on dellby.info continues. The link is visible here only to an administrator.")}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input type="url" value={chatLink} onChange={(event) => setChatLink(event.target.value)} placeholder="https://…" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-[#c05746]/30" />
          <button onClick={() => updateChatLink.mutate({ chatLink })} disabled={updateChatLink.isPending || isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c05746] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#a8483b] disabled:opacity-50"><Save className="w-4 h-4" />{t("Spara länk", "Save link")}</button>
        </div>
        {chatLink && <a href={chatLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 font-semibold text-[#a8483b] hover:underline">{t("Öppna arbetschatten", "Open workspace chat")}<ExternalLink className="w-4 h-4" /></a>}
      </section>

      <section className="mt-5 rounded-2xl border border-[#c05746]/20 bg-[#fff8f5] p-6">
        <h2 className="text-2xl font-semibold text-foreground">{t("Viktigt", "Important")}</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{t("Den här sidan är din fasta utgångspunkt för administrationen av dellby.info. Den ska inte tas bort eller ersättas vid framtida uppdateringar av webbplatsen.", "This page is your stable starting point for administering dellby.info. It should not be removed or replaced in future website updates.")}</p>
      </section>
    </div>,
  );
}
