export function useLanguageFallback<T>(
  content: Record<string, T> | undefined,
  locale: string,
  defaultLang: string = 'en'
): T | null {
  if (!content) {
    return null;
  }

  // Try to get content in the current locale
  if (content[locale]) {
    return content[locale];
  }

  // If not available, fall back to default language
  if (content[defaultLang]) {
    return content[defaultLang];
  }

  // If neither is available, return the first available language or null
  const firstAvailableLanguage = Object.keys(content)[0];
  return firstAvailableLanguage ? content[firstAvailableLanguage] : null;
} 