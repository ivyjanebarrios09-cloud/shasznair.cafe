export function getQRCodeUrl(data: string): string {
  if (!data) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}&color=4a2c11&bgcolor=fffcf9`;
}

export function parseTableQR(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('table') || null;
  } catch (e) {
    if (url.startsWith('TABLE-')) {
      return url;
    }
    return null;
  }
}
