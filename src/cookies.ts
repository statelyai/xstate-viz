export function get(key: string): string | null {
  const found = document.cookie.split(';').find((cookie) => {
    const [cookieKey] = cookie.split('=');
    return decodeURIComponent(cookieKey.trimLeft()) === key;
  });

  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

export function set(
  key: string,
  value: string,
  {
    path,
    expiresAt,
    sameSite = 'Lax',
    secure = true,
  }: {
    path?: string;
    expiresAt: Date;
    sameSite?: 'Lax' | 'Strict' | 'None';
    secure?: boolean;
  },
): void {
  document.cookie = [
    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    expiresAt && `expires=${expiresAt.toUTCString()}`,
    path && `path=${path}`,
    sameSite && `SameSite=${sameSite}`,
    secure && 'Secure',
  ]
    .filter(Boolean)
    .join('; ');
}

export function remove(key: string): void {
  set(key, '', { expiresAt: new Date(Date.now() - 1000) });
}
