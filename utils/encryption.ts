/**
 * Dify expects passwords to be Base64-encoded before transmission.
 * @see https://github.com/langgenius/dify/blob/main/web/utils/encryption.ts
 */
export function encryptPassword(password: string): string {
  const utf8Bytes = new TextEncoder().encode(password)
  const binary = String.fromCharCode(...utf8Bytes)
  return btoa(binary)
}
