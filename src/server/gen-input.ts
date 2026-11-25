import "server-only";
import { z } from "zod";
import { LANGUAGES, MAX_INPUT_CHARS, type GenSettings } from "@/lib/generation";
import { MAX_CARDS } from "./queries";
import { getTheme } from "@/lib/themes";

export const SettingsSchema = z.object({
  format: z.enum(["presentation", "document"]).default("presentation"),
  numCards: z.number().int().min(1).max(40).default(8),
  language: z.string().max(40).default("English"),
  textMode: z.enum(["generate", "condense", "preserve"]).default("generate"),
  amount: z.enum(["brief", "medium", "detailed"]).default("medium"),
  tone: z.string().trim().max(80).default(""),
  audience: z.string().trim().max(120).default(""),
  imageSource: z.enum(["art", "stock", "none"]).default("art"),
  themeId: z.string().max(40).default("paper"),
  designNotes: z.string().trim().max(500).default(""),
});

export const InputSchema = z.object({
  source: z.enum(["prompt", "paste"]),
  input: z.string().trim().min(3, "Tell us a bit more about what you want.").max(MAX_INPUT_CHARS),
  settings: SettingsSchema,
});

export function clampSettings(s: z.infer<typeof SettingsSchema>): GenSettings {
  return {
    ...s,
    numCards: Math.min(s.numCards, MAX_CARDS),
    language: LANGUAGES.includes(s.language) ? s.language : "English",
    themeId: getTheme(s.themeId).key,
  };
}

export const OutlineSchema = z.array(z.object({ title: z.string().trim().min(1).max(200), bullets: z.array(z.string().max(400)).max(12) })).min(1).max(40);
