export function isVideoMedia(url: string | null | undefined): boolean {
  return /\.(mp4|webm)(?:$|\?)/i.test(url ?? "");
}
