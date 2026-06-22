import 'server-only'

import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import type { Locale } from '.'
import { i18n } from '.'

function sanitizeLanguages(languages: string[]): string[] {
  return languages
    .map(lang => lang?.trim())
    .filter((lang): lang is string => Boolean(lang) && lang !== '*')
}

export const getLocaleOnServer = async (): Promise<Locale> => {
  // @ts-expect-error locales are readonly
  const locales: string[] = i18n.locales

  let languages: string[] | undefined
  // get locale from cookie
  const localeCookie = (await cookies()).get('locale')
  languages = sanitizeLanguages(localeCookie?.value ? [localeCookie.value] : [])

  if (!languages.length) {
    // Negotiator expects plain object so we need to transform headers
    const negotiatorHeaders: Record<string, string> = {}
    const headersList = await headers()
    headersList.forEach((value, key) => (negotiatorHeaders[key] = value))
    // Use negotiator and intl-localematcher to get best locale
    languages = sanitizeLanguages(new Negotiator({ headers: negotiatorHeaders }).languages())
  }

  if (!languages.length)
    return i18n.defaultLocale

  // match locale
  const matchedLocale = match(languages, locales, i18n.defaultLocale) as Locale
  return matchedLocale
}
