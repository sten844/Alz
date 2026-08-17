export const LIFESTYLE_TOPICS = [
  {
    key: "mat-och-kost",
    sv: "Mat och kost",
    en: "Food and nutrition",
    descriptionSv: "Matvanor, måltider och praktiska råd i vardagen.",
    descriptionEn: "Food habits, meals and practical everyday guidance.",
  },
  {
    key: "finger-livsstil",
    sv: "FINGER-livsstil",
    en: "FINGER lifestyle",
    descriptionSv: "Rörelse, hjärnträning, socialt liv och de andra delarna i FINGER-modellen.",
    descriptionEn: "Exercise, cognitive training, social life and the other parts of the FINGER model.",
  },
  {
    key: "medicin-och-kosttillskott",
    sv: "Medicin och kosttillskott",
    en: "Medication and supplements",
    descriptionSv: "Översikter, frågor att ta med till vården och fördjupning att läsa vidare om.",
    descriptionEn: "Overviews, questions to bring to care providers and further reading.",
  },
  {
    key: "vardagsverktyg",
    sv: "Vardagsverktyg",
    en: "Everyday tools",
    descriptionSv: "Rutiner, hjälpmedel och egna erfarenheter som kan underlätta.",
    descriptionEn: "Routines, aids and personal experiences that can make everyday life easier.",
  },
] as const;

export type LifestyleTopicKey = (typeof LIFESTYLE_TOPICS)[number]["key"];

export function getLifestyleTopic(key: string) {
  return LIFESTYLE_TOPICS.find((topic) => topic.key === key);
}
