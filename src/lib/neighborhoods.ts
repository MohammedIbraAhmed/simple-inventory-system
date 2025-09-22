export const GOVERNORATE_NEIGHBORHOODS = {
  "North Gaza": [
    "Arab Maslakh Beit Lahya",
    "As Shati",
    "Beit Hanun",
    "Beit Lahya",
    "Beit Lahya Hanun",
    "Jabalia",
    "Jabalia Camp",
    "Umm al Naser (Al Qaraya al Badawiya)"
  ],
  "Gaza": [
    "Al Mughraqa",
    "Ash Shati Camp",
    "Gaza",
    "Juhor ad Dik",
    "Madinat Ash-Shida",
    "Madinat Ezahra"
  ],
  "Deir al Balah": [
    "Al Bureij",
    "Al Bureij Camp",
    "Al Musaddar",
    "Al Maghazi Camp",
    "Al Musaddar",
    "An Nuseirat",
    "An Nuseirat Camp",
    "Az Zawayda",
    "Deir al Balah",
    "Deir al Balah Camp",
    "Wadi as Salqa"
  ],
  "Khan Yunis": [
    "Abasan al Jadida",
    "Abasan al Kabira",
    "Al Fukhari",
    "Al Mawasi (Khan Yunis)",
    "Al Qarara",
    "As Sureij",
    "Bani Suheila",
    "Khan Yunis",
    "Khan Yunis Camp",
    "Khuza'a",
    "Qa'al Jraba",
    "Qa'al Qurein",
    "Qaizan an Najjar",
    "Umm al Kilab",
    "Umm Kameil"
  ],
  "Rafah": [
    "Al Bayuk",
    "Al Mawasi (Rafah)",
    "Al Qarya as Suwaydiya",
    "Al-Nasser",
    "Rafah",
    "Rafah Camp",
    "Shoket as Sufi",
    "Tell as Sultan"
  ]
} as const

export type GovernorateKey = keyof typeof GOVERNORATE_NEIGHBORHOODS

export const getNeighborhoods = (governorate: string): string[] => {
  return GOVERNORATE_NEIGHBORHOODS[governorate as GovernorateKey] || []
}