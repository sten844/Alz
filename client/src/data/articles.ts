export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  category: string;
  language: string;
  publishedAt: string;
}

// Image URLs
const IMAGES = {
  behandlingsplan: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/YbglPANoQRTtiZxg.png",
  aiAlzheimer: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/EPhJHiwgqLNNqEFo.png",
  selfTesting: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/jeEdsAXfvgtrREvb.png",
  profile: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/CWIMjveIsySDpsJD.png",
  researchPlaceholder: "https://private-us-east-1.manuscdn.com/sessionFile/8WpNeAbro3JFUbiWRvCLsD/sandbox/zwUeCEkFBJrwdUxgtT1dgG-img-2_1772112529000_na1fn_YXJ0aWNsZS1wbGFjZWhvbGRlci1yZXNlYXJjaA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOFdwTmVBYnJvM0pGVWJpV1J2Q0xzRC9zYW5kYm94L3p3VWVDRWtGQkpyd2RVeGd0VDFkZ0ctaW1nLTJfMTc3MjExMjUyOTAwMF9uYTFmbl9ZWEowYVdOc1pTMXdiR0ZqWldodmJHUmxjaTF5WlhObFlYSmphQS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=KOeM5jFA9XdIwfhl5NgybcV9-vVafmQV7kMa2EWAcOIcRcxJa4X~FQvUZaVnzMK2M6UEVkubXCQIzE1UdVYSg0pEXX~1sRFDZc9SK0t8Ey2x2cokEXOYreKMGgHtR~oUtHDUKMCJpTgIF6hmFM1P-bK7bUb4aeC4jI0zrTpTKVyFySwzSKPoX~CZGSm7Js9Qj42kv5mN6UZWDctbPRNpCBQ~nxUCkz-PrE2r7dMdwgGQsevR0Y6TICVr6TvXMoJPfBkTvQfI6lwia9aOi2CtEpOIzt7D7tZ-gEH9-KU2zwqbz8f06~h2u8GNYptNNkPcFHD3I4~-0YVPnNG9pXN2Hw__",
  dailyPlaceholder: "https://private-us-east-1.manuscdn.com/sessionFile/8WpNeAbro3JFUbiWRvCLsD/sandbox/zwUeCEkFBJrwdUxgtT1dgG-img-3_1772112536000_na1fn_YXJ0aWNsZS1wbGFjZWhvbGRlci1kYWlseQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOFdwTmVBYnJvM0pGVWJpV1J2Q0xzRC9zYW5kYm94L3p3VWVDRWtGQkpyd2RVeGd0VDFkZ0ctaW1nLTNfMTc3MjExMjUzNjAwMF9uYTFmbl9ZWEowYVdOc1pTMXdiR0ZqWldodmJHUmxjaTFrWVdsc2VRLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ntOvOAY2n~vIEDMmEuMUVp2qX~RSTcG4dXE-z-v5yCIZe3-mgpa5OyNzERV8pIj0au9OGv91fEWw06gCfPoKQi7pDgKeFm-vs8AZvClhv3Z0NWwBaCqPGH7~q7QnpKPyfvn~R~5kGuq9GFWfjRbKHhDIZYi~SujytzLapirtCBBsm9saUOW7s2Nk9Ge5w5ZSpxopgS0Zgpje-1kKG0jHfCO1-UyCJAMRS3zluCOds2YkN4IVZtje7SewOy0cnXq1AdKMA35QV53xbHkJEeinduO1HgPelVHE1n6CLzP~aVRPXyUtmn4uUd0iMscFRHsOY38gqAgvCeEDpGydk~SHkw__",
  medicinePlaceholder: "https://private-us-east-1.manuscdn.com/sessionFile/8WpNeAbro3JFUbiWRvCLsD/sandbox/zwUeCEkFBJrwdUxgtT1dgG-img-4_1772112533000_na1fn_YXJ0aWNsZS1wbGFjZWhvbGRlci1tZWRpY2luZQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOFdwTmVBYnJvM0pGVWJpV1J2Q0xzRC9zYW5kYm94L3p3VWVDRWtGQkpyd2RVeGd0VDFkZ0ctaW1nLTRfMTc3MjExMjUzMzAwMF9uYTFmbl9ZWEowYVdOc1pTMXdiR0ZqWldodmJHUmxjaTF0WldScFkybHVaUS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=nlDcGSnHp9VNO-wPzLPs6X43tsJJQ0ZOy9PzVnT2RBd6xOTQwm3uz-jy9Y2jq7WJeEp7aRYEli3OWyRAUIjgpqnyvCrywaCM9O0o-q0Xv2ph-rg596d1Ktno-mLkle9DEXfYzEZg-mjqYaRx1Fvgt8qcbJrpLE9S73r~I9osbXoPxPu7EyqPQbsu~rsxek56eXCsAFNGfiUj32CPua~mqwlzHydWtiugUQlt1V2bKT4skyJ6UHN2uJa34onxZuvQ65aFyXn4dFLiYW-GUAI2l8ja1hXp9mt9KGyO5UIXy4Cw0gkxsznQcaXVJNPFAphM-yH5d6EUpRYACcpcWfnQqw__",
  aiSectionBg: "https://private-us-east-1.manuscdn.com/sessionFile/8WpNeAbro3JFUbiWRvCLsD/sandbox/zwUeCEkFBJrwdUxgtT1dgG-img-5_1772112535000_na1fn_YWktc2VjdGlvbi1iZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOFdwTmVBYnJvM0pGVWJpV1J2Q0xzRC9zYW5kYm94L3p3VWVDRWtGQkpyd2RVeGd0VDFkZ0ctaW1nLTVfMTc3MjExMjUzNTAwMF9uYTFmbl9ZV2t0YzJWamRHbHZiaTFpWncuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=By4kL5xJLSkI6fD1-rLZehCeBsxLJKrkl7wnkg74c1tBXAWL4qRxcqGWKPcxwilarX0joOJ39iZIl2wc39s9CfV7sX8ZX6Jt3MLv4mOKIOOQAf-M0qQ~9NXfQE6mNkl62wx9ABlFw9bKhFzIEnhBr2ps~uT3miMw0gHbp3ELpAd3OTYURWozFYGandRsLrXb6zf9RxiLzveg-pOENC2zLyg6J7girxctsTEpouNak~kf7bMh4i6ZcrRO0eFeyNLiDDYqIUgVzAntmCkIIDh3zpVHap~g53hipSY9j7lOIPvvon5jgLnZEo1I1UP6Eb9vVpjSwlM3Kzn28MNSOlEyxQ__",
  heroBg: "https://private-us-east-1.manuscdn.com/sessionFile/8WpNeAbro3JFUbiWRvCLsD/sandbox/zwUeCEkFBJrwdUxgtT1dgG-img-1_1772112538000_na1fn_aGVyby1iZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOFdwTmVBYnJvM0pGVWJpV1J2Q0xzRC9zYW5kYm94L3p3VWVDRWtGQkpyd2RVeGd0VDFkZ0ctaW1nLTFfMTc3MjExMjUzODAwMF9uYTFmbl9hR1Z5YnkxaVp3LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=dcJCRTmGHYAdo0pEFVE2Ap-NFcqzGR2au2jKacwTnSmvptIZkgbzb880ytctwn73~539ov62pa3LFY48zgMSU5l041D6HJDcONKVKWJuidKgrl~Gt7bomujkEnMx9ETa0kltXVY9LykmyG3JTdmzF9KwnnQvcSqMgRbDIrDuU8hZv-DekTP95FMQuGxUnLlo2dFidvgvODN-gQgbYD75X0MF~8bdms4k0TN47U--Mo3pCG26r5ndt~rWWMqEEFenXmkRkwQIarKOtkaSGGC331p~0nU2zNQ7q-boCQ7blQmIcBq6lwr3N8IQT0RifrHpYEKKRtPW6wOOBaW8L9Tw7A__",
};

export { IMAGES };

// Category fallback images
function getCategoryImage(category: string): string {
  switch (category) {
    case "Forskning": return IMAGES.researchPlaceholder;
    case "Vardagsliv": return IMAGES.dailyPlaceholder;
    case "Läkemedel": return IMAGES.medicinePlaceholder;
    case "Behandling": return IMAGES.behandlingsplan;
    default: return IMAGES.dailyPlaceholder;
  }
}

export function getArticleImage(article: Article): string {
  if (article.imageUrl) return article.imageUrl;
  return getCategoryImage(article.category);
}

// Swedish-English article pairs (Swedish ID -> English ID)
const articlePairs: Record<number, number> = {
  13: 30027,
  15: 30029,
  16: 30030,
  12: 30026,
  14: 30028,
  10: 30024,
  11: 30025,
};

export function getTranslationId(id: number): number | null {
  // Check if this is a Swedish article
  if (articlePairs[id]) return articlePairs[id];
  // Check if this is an English article
  for (const [svId, enId] of Object.entries(articlePairs)) {
    if (enId === id) return Number(svId);
  }
  return null;
}

export const categories = ["Alla", "Behandling", "Forskning", "Vardagsliv", "Läkemedel", "Åsikt"];
export const categoriesEn = ["All", "Treatment", "Research", "Daily Life", "Medication", "Opinion"];

export const categoryColors: Record<string, string> = {
  "Behandling": "bg-teal-100 text-teal-800",
  "Forskning": "bg-amber-100 text-amber-800",
  "Vardagsliv": "bg-emerald-100 text-emerald-800",
  "Läkemedel": "bg-rose-100 text-rose-800",
  "Åsikt": "bg-slate-100 text-slate-700",
};

export const articles: Article[] = [
  {
    id: 13,
    title: "Min behandlingsplan",
    content: `# Min behandlingsplan

Efter min diagnos har jag utvecklat en behandlingsplan baserad på femfingermodellen, men med mitt eget fokus på hur medicin och kost fungerar tillsammans som ett system.

## 1️⃣ Metabolism & energi

**Syfte:** jämn energitillgång till hjärnan, undvika glukostoppar och dippar

**Medicinskt/tillskott**
- Berberin 2×400 mg (ökar cellernas insulinkänslighet och minskar blodsockersvängningar)

**Kost & livsstil**
- Kost med mål om stabilt blodsocker (lågt glykemiskt genomslag)
- Måltidsrytm / lätt fasta (förbättrar cellernas energistyrning)
- Regelbunden fysisk aktivitet (gym 5 d/v eller cykling – ökar glukosupptag utan insulin)
- CGM (kontinuerlig glukosmätning som gör sambandet mellan mat, rörelse och energi synligt i realtid)

👉 **Integration:** Berberin + kost + rörelse + CGM bildar ett självreglerande energisystem, där kosten styr inflödet, rörelsen förbrukningen och CGM ger feedback.

## 2️⃣ Kärl & blodflöde

**Syfte:** säkerställa syre, näring och intakt blod–hjärnbarriär

**Medicinskt**
- Losartan 50 mg (vidgar blodkärl och skyddar kärlväggar även vid lågt blodtryck)
- Atorvastatin 20 mg (sänker skadliga blodfetter och minskar kärlinflammation)

**Kost & livsstil**
- Motion (ökar blodflöde och kärlreaktivitet)
- Kärlvänlig kost – Medelhavsdiet (olivolja, fisk, grönsaker → bättre kärlfunktion)

👉 **Integration:** Läkemedlen skapar strukturellt kärlskydd, medan kost och rörelse ger funktionellt flöde. Tillsammans stödjer de hjärnans mikrocirkulation.

## 3️⃣ Neurotransmission (vardagskognition)

**Syfte:** stabil kognitiv funktion i dagligt liv

**Medicin**
- Rivastigmin depåplåster 4,5 mg (förstärker kolinerg funktion = hjärnans minnes- och uppmärksamhetssignalering via acetylkolin), inledningsvis 9,5 mg men halverad dos pga sömnstörning
- Donepezil utsatt p.g.a. hallucinationer
- Dos sänkt från 9,5 mg p.g.a. sömnstörning

**Kost & livsstil**
- Struktur i vardagen (minskar kognitiv belastning)
- Kognitiv och social stimulans (aktiva nervkretsar bevaras längre)

👉 **Integration:** Rivastigmin förbättrar signaleringen – struktur och social aktivitet ser till att signalerna används.

## 4️⃣ Neuroinflammation & neuroprotektion

**Syfte:** bromsa sjukdomsprogression på cellnivå

**Medicin /tillskott**
- Litium orotate 5 mg (stabiliserar nervcellernas skyddssystem och dämpar inflammation)
- Magnesium (stödjer nervsignalering och sömn)
- Omega-3 (antiinflammatoriskt, ingår i Souvenaid)
- Gurkmeja/curcumin (Meriva 500 mg) (minskar låggradig inflammation och oxidativ stress)

**Kost & livsstil**
- Golden milk (fett + piperin förbättrar upptag av curcumin)
- Sömnoptimering (hjärnans viktigaste reparationsfas)
- Vaccination mot bältros (minskar risken för inflammatoriska stresspåslag)

👉 **Integration:** Här möts biokemiskt skydd (tillskott) och biologisk återhämtning (sömn). Kosten fungerar som bärare och förstärkare av de antiinflammatoriska effekterna.

## 5️⃣ Kost & näring – struktur och funktion i vardagen

**Syfte:** bevara praktisk och social funktion över tid

**Medicinskt / näring**
- Souvenaid 1 fl/dag (ger specifika byggstenar till synapser)
- B-vitaminer (B12/folat) (nödvändiga för nervfunktion och DNA-reparation)
- MCT-olja 1 tsk till frukost (snabb alternativ energi till hjärnan, oberoende av glukos)

**Livsstil**
- Dagliga rutiner
- Meningsfulla aktiviteter inte minst ett huvudprojekt (se separat artikel)
- Anhörigstöd
- Ett huvudprojekt

👉 **Integration:** Kost och näring ger materialet, rutinerna ger formen, och det sociala sammanhanget ger mening – alla tre behövs för funktion i vardagen.`,
    excerpt: "Min variant av femfingermodellen: Medicin + kost som ett system",
    imageUrl: IMAGES.behandlingsplan,
    category: "Behandling",
    language: "sv",
    publishedAt: "2026-02-15T00:00:00.000Z",
  },
  {
    id: 15,
    title: "Det meningsskapande projektet i min behandlingsplan",
    content: `# Det meningsskapande projektet i min behandlingsplan

Hjärnan svarar starkast på sammanhängande, långsiktigt engagemang – inte på isolerade aktiviteter. Det är därför mitt huvudprojekt är en central del av min behandlingsplan.

## Varför ett huvudprojekt?

Forskning visar att kognitiv stimulans som är meningsfull, social och strukturerad har starkare effekt på hjärnans motståndskraft än passiv underhållning eller slumpmässiga övningar. Ett projekt som kräver planering, problemlösning och kommunikation aktiverar flera hjärnregioner samtidigt.

## Mitt projekt: Denna kunskapsbank

Jag har valt att bygga denna webbplats – en kunskapsbank om att leva med Alzheimers – som mitt huvudprojekt. Det ger mig:

**Kognitiv stimulans**
- Skriva artiklar kräver research, strukturering och formulering
- Teknisk problemlösning (webbdesign, AI-verktyg)
- Kontinuerligt lärande om min sjukdom

**Social koppling**
- Delning med andra i samma situation
- Feedback och diskussion
- Känsla av att bidra till något större

**Struktur och rutin**
- Regelbundet arbete med tydliga mål
- Daglig kontakt med projektet
- Mätbara framsteg

## Hur det fungerar i praktiken

Varje dag ägnar jag tid åt projektet. Det kan vara att:
- Researcha och skriva en ny artikel
- Uppdatera befintligt innehåll
- Lära mig nya tekniska verktyg
- Kommunicera med läsare

## Vetenskaplig grund

Konceptet bygger på forskning om kognitiv reserv och neuroplasticitet. Studier visar att personer som upprätthåller intellektuellt stimulerande aktiviteter kan kompensera för hjärnskador bättre än de som inte gör det.

Det handlar inte om att "träna bort" Alzheimers – det handlar om att ge hjärnan bästa möjliga förutsättningar att använda de resurser som finns kvar.

## Mall för självutvärdering

Jag har skapat en mall för att regelbundet utvärdera hur projektet påverkar mitt mående och min kognitiva funktion. Se separat artikel.`,
    excerpt: "Hjärnan svarar starkast på sammanhängande, långsiktigt engagemang",
    imageUrl: null,
    category: "Vardagsliv",
    language: "sv",
    publishedAt: "2026-02-06T00:00:00.000Z",
  },
  {
    id: 16,
    title: "Min behandlingsplan: Vetenskaplig bakgrund",
    content: `# Min behandlingsplan: Vetenskaplig bakgrund

Vad forskningen visar och inte visar om min behandlingsplan.

## Evidensläget

Min behandlingsplan bygger på en kombination av etablerad medicin och kompletterande åtgärder. Här redovisar jag evidensläget för varje del.

### Kolinesterashämmare (Rivastigmin)
**Evidens: Stark**
Rivastigmin är godkänt för behandling av mild till måttlig Alzheimers sjukdom. Studier visar måttlig men signifikant effekt på kognition och daglig funktion. Effekten är symtomatisk – den bromsar inte sjukdomsprocessen i sig.

### Statiner (Atorvastatin)
**Evidens: Måttlig**
Observationsstudier antyder att statiner kan minska risken för demens, men randomiserade studier har inte visat tydlig effekt som behandling. Jag tar det primärt för kardiovaskulärt skydd, med potentiell sekundär nytta.

### Berberin
**Evidens: Lovande men begränsad**
Prekliniska studier visar antiinflammatoriska och neuroprotektiva effekter. Kliniska studier på människa är få och små. Jag använder det primärt för blodsockerreglering.

### Litium (låg dos)
**Evidens: Intressant men otillräcklig**
Epidemiologiska studier visar lägre demensrisk hos litiumanvändare. Små kliniska studier med mikrodos litium visar lovande resultat. Mer forskning behövs.

### Souvenaid
**Evidens: Måttlig**
Kliniska studier (LipiDiDiet) visar effekt på kognitiv funktion vid tidig Alzheimers. Effekten är modest men konsistent.

### Kost och livsstil
**Evidens: Stark för prevention, begränsad för behandling**
Medelhavsdiet, motion och kognitiv stimulans har stark evidens för att minska demensrisk. Som behandling vid etablerad sjukdom är evidensen svagare men logiken stark.

### Curcumin
**Evidens: Preklinisk lovande, klinisk osäker**
Starka antiinflammatoriska effekter i laboratoriet. Kliniska studier har gett blandade resultat, delvis på grund av dålig biotillgänglighet. Meriva-formen förbättrar upptaget.

## Min slutsats

Ingen enskild åtgärd har stark evidens för att bromsa Alzheimers. Men kombinationen av åtgärder som var och en har viss evidens – och som dessutom stödjer varandra – ger enligt min bedömning bästa möjliga chans.

Jag är medveten om att jag kan ha fel. Men jag föredrar att agera på bästa tillgängliga kunskap framför att vänta på perfekt evidens.`,
    excerpt: "Vad forskningen visar och inte visar om min behandlingsplan",
    imageUrl: null,
    category: "Forskning",
    language: "sv",
    publishedAt: "2026-02-04T00:00:00.000Z",
  },
  {
    id: 12,
    title: "AI och alzheimer",
    content: `# AI och alzheimer

AI har blivit min livlina efter jag fått Alzheimersdiagnosen.

## Hur AI hjälper mig varje dag

När jag fick min diagnos var en av mina första tankar: hur ska jag klara vardagen? Svaret kom från ett oväntat håll – artificiell intelligens.

### ChatGPT som samtalspartner
Jag använder ChatGPT dagligen. Den hjälper mig att:
- Formulera texter när orden inte vill komma
- Förklara medicinska termer på enkel svenska
- Strukturera mina tankar
- Vara en tålmodig samtalspartner som aldrig dömer

### AI för research
När jag ska skriva artiklar till denna kunskapsbank använder jag AI för att:
- Söka och sammanfatta vetenskapliga studier
- Kontrollera fakta
- Hitta relevanta källor
- Översätta mellan svenska och engelska

### Praktiska AI-verktyg
- **Röststyrning**: Siri och Google Assistant för påminnelser
- **Google Lens**: Identifiera piller och läsa skyltar
- **Transkribering**: Spela in läkarbesök och låta AI sammanfatta

## Varför AI är särskilt värdefullt vid Alzheimers

1. **Tålamod**: AI tröttnar aldrig på att förklara samma sak igen
2. **Tillgänglighet**: Alltid tillgängligt, dygnet runt
3. **Anpassningsbarhet**: Kan anpassa språknivå och tempo
4. **Icke-dömande**: Ingen skam i att fråga "dumma" frågor

## Min uppmaning

Om du har en kognitiv diagnos – ge AI en chans. Det behöver inte vara komplicerat. Börja med att prata med ChatGPT om något du undrar över. Du kan bli förvånad.`,
    excerpt: "AI har blivit min livlina efter jag fått Alzheimersdiagnosen",
    imageUrl: IMAGES.aiAlzheimer,
    category: "Vardagsliv",
    language: "sv",
    publishedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: 14,
    title: "Läkemedel: Regionala medicinska riktlinjer och rutiner",
    content: `# Läkemedel: Regionala medicinska riktlinjer och rutiner

En sammanfattning av de regionala riktlinjerna för läkemedelsbehandling vid Alzheimers sjukdom.

## Kolinesterashämmare

### Indikation
Mild till måttlig Alzheimers sjukdom (MMSE 10-26)

### Tillgängliga preparat
- **Donepezil** (Aricept): Startdos 5 mg, måldos 10 mg
- **Rivastigmin** (Exelon): Plåster 4,6 mg → 9,5 mg → 13,3 mg
- **Galantamin** (Reminyl): Startdos 8 mg, måldos 16-24 mg

### Uppföljning
- Utvärdering efter 3-6 månader
- MMSE och klinisk bedömning
- Biverkningar: illamående, diarré, sömnstörning

## Memantin

### Indikation
Måttlig till svår Alzheimers sjukdom (MMSE < 20)

### Dosering
Startdos 5 mg, upptrappning till 20 mg över 4 veckor

## BPSD-behandling

### Icke-farmakologisk behandling i första hand
- Miljöanpassning
- Bemötandestrategier
- Aktivitetsanpassning

### Farmakologisk behandling vid behov
- SSRI vid depression/ångest
- Kortvarig neuroleptika vid svår agitation
- Melatonin vid sömnstörning

## Regionala skillnader

Riktlinjerna varierar mellan regioner. Kontakta din minnesmottagning för lokala rutiner.`,
    excerpt: "Regionala riktlinjer för läkemedelsbehandling vid Alzheimers",
    imageUrl: null,
    category: "Läkemedel",
    language: "sv",
    publishedAt: "2026-01-08T00:00:00.000Z",
  },
  {
    id: 10,
    title: "Mall för självtestning (meningsskapande projekt)",
    content: `# Mall för självtestning

Denna mall hjälper dig att regelbundet utvärdera hur ditt meningsskapande projekt påverkar ditt mående och din kognitiva funktion.

## Veckovis utvärdering

### Kognitiv funktion (1-5)
- Koncentrationsförmåga: ___
- Ordfinning: ___
- Planering/organisation: ___
- Minne (korttid): ___

### Emotionellt mående (1-5)
- Motivation: ___
- Glädje/tillfredsställelse: ___
- Ångestnivå (omvänd): ___
- Känsla av mening: ___

### Social koppling (1-5)
- Antal sociala interaktioner: ___
- Kvalitet på interaktioner: ___
- Känsla av tillhörighet: ___

### Projektspecifikt
- Tid spenderad på projektet (timmar): ___
- Antal avslutade uppgifter: ___
- Nya saker lärda: ___

## Månadsvis reflektion

Skriv fritt om:
1. Vad har gått bra denna månad?
2. Vad har varit utmanande?
3. Har jag märkt förändringar i min kognitiva funktion?
4. Vill jag justera något i mitt projekt?

## Tips
- Fyll i mallen vid samma tid varje vecka
- Var ärlig – det finns inga rätta svar
- Dela med din anhöriga eller vårdgivare om du vill`,
    excerpt: "Utvärdera hur ditt meningsskapande projekt påverkar ditt mående",
    imageUrl: IMAGES.selfTesting,
    category: "Vardagsliv",
    language: "sv",
    publishedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 11,
    title: "Läkemedel avsedda för andra diagnoser som ev kan påverka Alzheimers",
    content: `# Läkemedel avsedda för andra diagnoser som eventuellt kan påverka Alzheimers

En översikt av läkemedel som ursprungligen utvecklats för andra sjukdomar men som visat intressanta signaler för Alzheimers.

## GLP-1-agonister (diabetesläkemedel)

**Exempel:** Semaglutid (Ozempic/Wegovy), Liraglutid

Stora observationsstudier visar lägre demensrisk hos diabetespatienter som behandlas med GLP-1-agonister. Kliniska prövningar pågår specifikt för Alzheimers.

**Möjlig mekanism:** Förbättrad insulinsignalering i hjärnan, antiinflammatorisk effekt, skydd mot neuronal celldöd.

## Litium

**Ursprunglig indikation:** Bipolär sjukdom

Epidemiologiska data visar konsekvent lägre demensrisk hos litiumanvändare. Mikrodos-studier (300 µg) visar lovande resultat.

**Möjlig mekanism:** Hämmar GSK-3β (involverat i tau-fosforylering), neuroprotektiv effekt.

## Losartan (blodtrycksmedicin)

**Ursprunglig indikation:** Hypertoni

Angiotensin II-receptorblockerare (ARB) har i observationsstudier associerats med lägre demensrisk jämfört med andra blodtrycksmediciner.

**Möjlig mekanism:** Förbättrad cerebral blodflöde, minskad neuroinflammation, skydd av blod-hjärnbarriären.

## Statiner

**Ursprunglig indikation:** Högt kolesterol

Blandade resultat. Observationsstudier positiva, randomiserade studier negativa. Möjligen mest nytta vid tidig behandling.

## Viktigt att notera

Ingen av dessa läkemedel är godkända för behandling av Alzheimers. Diskutera alltid med din läkare innan du gör ändringar i din medicinering.`,
    excerpt: "Läkemedel för andra diagnoser som kan påverka Alzheimers",
    imageUrl: null,
    category: "Läkemedel",
    language: "sv",
    publishedAt: "2025-10-11T00:00:00.000Z",
  },
  // English translations
  {
    id: 30027,
    title: "My Treatment Plan",
    content: `# My Treatment Plan

After my diagnosis, I have developed a treatment plan based on the five-finger model, but with my own focus on how medication and diet work together as a system.

## 1️⃣ Metabolism & Energy

**Purpose:** stable energy supply to the brain, avoiding glucose spikes and dips

**Medical/Supplement**
- Berberine 2×400 mg (increases cellular insulin sensitivity and reduces blood sugar fluctuations)

**Diet & Lifestyle**
- Diet aiming for stable blood sugar (low glycemic impact)
- Meal rhythm / light fasting (improves cellular energy management)
- Regular physical activity (gym 5 d/w or cycling – increases glucose uptake without insulin)
- CGM (continuous glucose monitoring that makes the connection between food, movement, and energy visible in real-time)

👉 **Integration:** Berberine + diet + movement + CGM form a self-regulating energy system, where diet controls inflow, movement controls consumption, and CGM provides feedback.

## 2️⃣ Vessels & Blood Flow

**Purpose:** ensure oxygen, nutrients, and an intact blood-brain barrier

**Medical**
- Losartan 50 mg (dilates blood vessels and protects vessel walls even with low blood pressure)
- Atorvastatin 20 mg (lowers harmful blood fats and reduces vascular inflammation)

**Diet & Lifestyle**
- Exercise (increases blood flow and vascular reactivity)
- Vascular-friendly diet – Mediterranean diet (olive oil, fish, vegetables → better vascular function)

👉 **Integration:** Medications provide structural vascular protection, while diet and exercise provide functional flow. Together, they support the brain's microcirculation.

## 3️⃣ Neurotransmission (Everyday Cognition)

**Purpose:** stable cognitive function in daily life

**Medication**
- Rivastigmine transdermal patch 4.5 mg (enhances cholinergic function = the brain's memory and attention signaling via acetylcholine), initially 9.5 mg but dose halved due to sleep disturbance

**Diet & Lifestyle**
- Structure in everyday life (reduces cognitive load)
- Cognitive and social stimulation (active neural circuits are preserved longer)

👉 **Integration:** Rivastigmine improves signaling – structure and social activity ensure that signals are used.

## 4️⃣ Neuroinflammation & Neuroprotection

**Purpose:** slow down disease progression at the cellular level

**Medication / Supplement**
- Lithium orotate 5 mg (stabilizes nerve cell protection systems and dampens inflammation)
- Magnesium (supports nerve signaling and sleep)
- Omega-3 (anti-inflammatory, included in Souvenaid)
- Turmeric/curcumin (Meriva 500 mg) (reduces low-grade inflammation and oxidative stress)

**Diet & Lifestyle**
- Golden milk (fat + piperine improves curcumin absorption)
- Sleep optimization (the brain's most important repair phase)
- Shingles vaccination (reduces the risk of inflammatory stress responses)

👉 **Integration:** Here, biochemical protection (supplements) and biological recovery (sleep) meet. Diet acts as a carrier and enhancer of anti-inflammatory effects.

## 5️⃣ Diet & Nutrition – Structure and Function in Everyday Life

**Purpose:** preserve practical and social function over time

**Medical / Nutrition**
- Souvenaid 1 bottle/day (provides specific building blocks for synapses)
- B vitamins (B12/folate) (essential for nerve function and DNA repair)
- MCT oil 1 tsp for breakfast (fast alternative energy for the brain, independent of glucose)

**Lifestyle**
- Daily routines
- Meaningful activities, not least a main project (see separate article)
- Caregiver support
- A main project

👉 **Integration:** Diet and nutrition provide the material, routines provide the form, and the social context provides meaning – all three are needed for function in everyday life.`,
    excerpt: "My version of the five-finger model: Medicine + diet as a system",
    imageUrl: IMAGES.behandlingsplan,
    category: "Behandling",
    language: "en",
    publishedAt: "2026-02-15T00:00:00.000Z",
  },
  {
    id: 30029,
    title: "The Meaning-Making Project in My Treatment Plan",
    content: `# The Meaning-Making Project in My Treatment Plan

The brain responds strongest to coherent, long-term engagement – not to isolated activities. That's why my main project is a central part of my treatment plan.

## Why a Main Project?

Research shows that cognitive stimulation that is meaningful, social, and structured has a stronger effect on the brain's resilience than passive entertainment or random exercises.

## My Project: This Knowledge Base

I have chosen to build this website – a knowledge base about living with Alzheimer's – as my main project. It gives me cognitive stimulation, social connection, and structure.

## Scientific Basis

The concept builds on research about cognitive reserve and neuroplasticity. Studies show that people who maintain intellectually stimulating activities can compensate for brain damage better than those who don't.`,
    excerpt: "The brain responds strongest to coherent, long-term engagement",
    imageUrl: null,
    category: "Vardagsliv",
    language: "en",
    publishedAt: "2026-02-06T00:00:00.000Z",
  },
  {
    id: 30030,
    title: "My Treatment Plan: Scientific Background",
    content: `# My Treatment Plan: Scientific Background

What research shows and doesn't show about my treatment plan.

## The Evidence

My treatment plan builds on a combination of established medicine and complementary measures. Here I present the evidence for each part.

### Cholinesterase Inhibitors (Rivastigmine)
**Evidence: Strong**
Rivastigmine is approved for treatment of mild to moderate Alzheimer's disease.

### Statins (Atorvastatin)
**Evidence: Moderate**
Observational studies suggest statins may reduce dementia risk.

### Berberine
**Evidence: Promising but limited**
Preclinical studies show anti-inflammatory and neuroprotective effects.

### Lithium (low dose)
**Evidence: Interesting but insufficient**
Epidemiological studies show lower dementia risk in lithium users.

### Souvenaid
**Evidence: Moderate**
Clinical studies (LipiDiDiet) show effect on cognitive function in early Alzheimer's.

## My Conclusion

No single measure has strong evidence for slowing Alzheimer's. But the combination of measures that each have some evidence – and that also support each other – gives in my assessment the best possible chance.`,
    excerpt: "What research shows and doesn't show about my treatment plan",
    imageUrl: null,
    category: "Forskning",
    language: "en",
    publishedAt: "2026-02-04T00:00:00.000Z",
  },
  {
    id: 30026,
    title: "AI and Alzheimer's",
    content: `# AI and Alzheimer's

AI has become my lifeline after receiving my Alzheimer's diagnosis.

## How AI Helps Me Every Day

When I received my diagnosis, one of my first thoughts was: how will I manage everyday life? The answer came from an unexpected place – artificial intelligence.

### ChatGPT as a Conversation Partner
I use ChatGPT daily. It helps me formulate texts, explain medical terms, structure my thoughts, and be a patient conversation partner.

### AI for Research
When writing articles for this knowledge base, I use AI to search and summarize scientific studies, check facts, find relevant sources, and translate between Swedish and English.

### My Call to Action
If you have a cognitive diagnosis – give AI a chance. It doesn't have to be complicated. Start by talking to ChatGPT about something you're wondering about.`,
    excerpt: "AI has become my lifeline after receiving my Alzheimer's diagnosis",
    imageUrl: IMAGES.aiAlzheimer,
    category: "Vardagsliv",
    language: "en",
    publishedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: 30028,
    title: "Medication: Regional Medical Guidelines and Routines",
    content: `# Medication: Regional Medical Guidelines and Routines

A summary of regional guidelines for medication treatment of Alzheimer's disease.

## Cholinesterase Inhibitors

### Indication
Mild to moderate Alzheimer's disease (MMSE 10-26)

### Available Preparations
- **Donepezil** (Aricept): Starting dose 5 mg, target dose 10 mg
- **Rivastigmine** (Exelon): Patch 4.6 mg → 9.5 mg → 13.3 mg
- **Galantamine** (Reminyl): Starting dose 8 mg, target dose 16-24 mg

## Memantine

### Indication
Moderate to severe Alzheimer's disease (MMSE < 20)

## Regional Differences

Guidelines vary between regions. Contact your memory clinic for local routines.`,
    excerpt: "Regional guidelines for medication treatment of Alzheimer's",
    imageUrl: null,
    category: "Läkemedel",
    language: "en",
    publishedAt: "2026-01-08T00:00:00.000Z",
  },
  {
    id: 30024,
    title: "Template for Self-Testing (Meaning-Making Project)",
    content: `# Template for Self-Testing

This template helps you regularly evaluate how your meaning-making project affects your well-being and cognitive function.

## Weekly Evaluation

### Cognitive Function (1-5)
- Concentration ability: ___
- Word finding: ___
- Planning/organization: ___
- Memory (short-term): ___

### Emotional Well-being (1-5)
- Motivation: ___
- Joy/satisfaction: ___
- Anxiety level (reversed): ___
- Sense of meaning: ___

## Tips
- Fill in the template at the same time each week
- Be honest – there are no right answers
- Share with your caregiver or healthcare provider if you wish`,
    excerpt: "Evaluate how your meaning-making project affects your well-being",
    imageUrl: IMAGES.selfTesting,
    category: "Vardagsliv",
    language: "en",
    publishedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 30025,
    title: "Medications intended for other diagnoses that may affect Alzheimer's",
    content: `# Medications Intended for Other Diagnoses That May Affect Alzheimer's

An overview of medications originally developed for other diseases but showing interesting signals for Alzheimer's.

## GLP-1 Agonists (Diabetes Medication)

**Examples:** Semaglutide (Ozempic/Wegovy), Liraglutide

Large observational studies show lower dementia risk in diabetes patients treated with GLP-1 agonists.

## Lithium

**Original indication:** Bipolar disorder

Epidemiological data consistently show lower dementia risk in lithium users.

## Important Note

None of these medications are approved for treatment of Alzheimer's. Always discuss with your doctor before making changes to your medication.`,
    excerpt: "Medications for other diagnoses that may affect Alzheimer's",
    imageUrl: null,
    category: "Läkemedel",
    language: "en",
    publishedAt: "2025-10-11T00:00:00.000Z",
  },
];
