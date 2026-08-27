export function greeting(artisanName: string): string {
    const firstName = artisanName.split(' ')[0] ?? artisanName;
    return `Bonjour ${firstName}`;
}
