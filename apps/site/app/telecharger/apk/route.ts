import { NextResponse } from 'next/server';

// URL permanente GitHub : elle suit la dernière release sans toucher au site,
// à condition que l'asset attaché garde ce nom fixe.
const APK_RELEASE_URL = 'https://github.com/Lumiris-DPP/Lumiris-Front/releases/latest/download/lumiris-vision.apk';

export function GET() {
    return NextResponse.redirect(APK_RELEASE_URL, 302);
}
