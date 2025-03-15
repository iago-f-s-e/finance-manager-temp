export const defaultLocale = "pt-BR"
export const locales = ["pt-BR", "en-US"] as const
export type ValidLocale = (typeof locales)[number]

export const localeNames: Record<ValidLocale, string> = {
  "pt-BR": "Português",
  "en-US": "English",
}

export type Messages = typeof import("./messages/pt-BR").default
export type MessageKey = keyof Messages

