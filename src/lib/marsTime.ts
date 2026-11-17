/**
 * Mars Sol Date from Earth time, following NASA GISS Mars24 (Allison & McEwen 2000).
 * Ported from the SPHEREx XR project (arvr/src/xr/marsTime.ts).
 */
export function marsSol(date = new Date()): number {
  const jdUT = date.getTime() / 86400000 + 2440587.5
  const jdTT = jdUT + 69.184 / 86400
  return Math.floor((jdTT - 2405522.0028779) / 1.0274912517)
}
