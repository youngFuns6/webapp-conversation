import type { Locale } from '@/i18n'
import type { AppInfo } from '@/types/app'

export interface DifySiteInfo {
  title?: string
  description?: string
  copyright?: string
  privacy_policy?: string
  default_language?: string
}

export function mapDifyLocale(language?: string): Locale {
  if (!language)
  { return 'zh-Hans' }

  const normalized = language.toLowerCase()
  if (normalized.startsWith('zh'))
  { return 'zh-Hans' }
  if (normalized.startsWith('ja'))
  { return 'ja' }
  if (normalized.startsWith('fr'))
  { return 'fr' }
  if (normalized.startsWith('es'))
  { return 'es' }
  if (normalized.startsWith('vi'))
  { return 'vi' }

  return 'en'
}

export function mergeSiteInfo(base: AppInfo, site?: DifySiteInfo | null): AppInfo {
  if (!site)
  { return base }

  return {
    ...base,
    title: site.title || base.title,
    description: site.description || base.description,
    copyright: site.copyright || base.copyright,
    privacy_policy: site.privacy_policy || base.privacy_policy,
    default_language: site.default_language
      ? mapDifyLocale(site.default_language)
      : base.default_language,
  }
}
