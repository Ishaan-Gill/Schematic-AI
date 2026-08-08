export const CURRENCY_SYMBOLS: Record<string, string> = {
  "$": "USD",
  "₹": "INR",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "R$": "BRL",
  "₽": "RUB",
  "₩": "KRW",
  "₱": "PHP",
  "₺": "TRY",
}

export const CURRENCY_CODES: string[] = [
  "USD",
  "AED",
  "AFN",
  "ALL",
  "AMD",
  "ANG",
  "AOA",
  "ARS",
  "AUD",
  "AWG",
  "AZN",
  "BAM",
  "BBD",
  "BDT",
  "BGN",
  "BHD",
  "BIF",
  "BMD",
  "BND",
  "BOB",
  "BRL",
  "BSD",
  "BTN",
  "BWP",
  "BYN",
  "BZD",
  "CAD",
  "CDF",
  "CHF",
  "CLP",
  "CNY",
  "COP",
  "CRC",
  "CUP",
  "CVE",
  "CZK",
  "DJF",
  "DKK",
  "DOP",
  "DZD",
  "EGP",
  "ERN",
  "ETB",
  "EUR",
  "FJD",
  "FKP",
  "GBP",
  "GEL",
  "GGP",
  "GHS",
  "GIP",
  "GMD",
  "GNF",
  "GTQ",
  "GYD",
  "HKD",
  "HNL",
  "HRK",
  "HTG",
  "HUF",
  "IDR",
  "ILS",
  "IMP",
  "INR",
  "IQD",
  "IRR",
  "ISK",
  "JEP",
  "JMD",
  "JOD",
  "JPY",
  "KES",
  "KGS",
  "KHR",
  "KMF",
  "KPW",
  "KRW",
  "KWD",
  "KYD",
  "KZT",
  "LAK",
  "LBP",
  "LKR",
  "LRD",
  "LSL",
  "LYD",
  "MAD",
  "MDL",
  "MGA",
  "MKD",
  "MMK",
  "MNT",
  "MOP",
  "MRU",
  "MUR",
  "MVR",
  "MWK",
  "MXN",
  "MYR",
  "MZN",
  "NAD",
  "NGN",
  "NIO",
  "NOK",
  "NPR",
  "NZD",
  "OMR",
  "PAB",
  "PEN",
  "PGK",
  "PHP",
  "PKR",
  "PLN",
  "PYG",
  "QAR",
  "RON",
  "RSD",
  "RUB",
  "RWF",
  "SAR",
  "SBD",
  "SCR",
  "SDG",
  "SEK",
  "SGD",
  "SHP",
  "SLL",
  "SOS",
  "SRD",
  "SSP",
  "STN",
  "SVC",
  "SYP",
  "SZL",
  "THB",
  "TJS",
  "TMT",
  "TND",
  "TOP",
  "TRY",
  "TTD",
  "TWD",
  "TZS",
  "UAH",
  "UGX",
  "USD",
  "UYU",
  "UZS",
  "VES",
  "VND",
  "VUV",
  "WST",
  "XAF",
  "XCD",
  "XDR",
  "XOF",
  "XPF",
  "YER",
  "ZAR",
  "ZMW",
  "ZWL",
]

export type CurrencyDetection = {
  currency: string | null
  currencies: string[]
  mixedCurrency: boolean
}

const CODE_PATTERN = /\b[A-Z]{3}\b/g

export const detectCurrencies = (
  values: unknown[],
): CurrencyDetection => {
  const detected = new Set<string>()

  for (const value of values) {
    if (value === null || value === undefined) continue

    const text = String(value).trim()
    if (!text) continue

    const symbolsByLength = Object.entries(CURRENCY_SYMBOLS).sort(
      (a, b) => b[0].length - a[0].length,
    )

    let remaining = text
    for (const [symbol, code] of symbolsByLength) {
      if (remaining.includes(symbol)) {
        detected.add(code)
        remaining = remaining.split(symbol).join(" ")
      }
    }

    const matches = text.match(CODE_PATTERN)
    if (matches) {
      for (const candidate of matches) {
        if (CURRENCY_CODES.includes(candidate)) {
          detected.add(candidate)
        }
      }
    }
  }

  const currencies = Array.from(detected)
  const mixedCurrency = currencies.length > 1
  const currency = currencies.length === 1 ? currencies[0] : null

  return {
    currency,
    currencies,
    mixedCurrency,
  }
}

export const buildCurrencyWarning = (
  column: string,
  detection: CurrencyDetection,
): string | null => {
  if (!detection.mixedCurrency || detection.currencies.length === 0) {
    return null
  }

  return (
    `⚠️ Mixed currencies detected in ${column} ` +
    `(${detection.currencies.join(", ")}). ` +
    `Cross-currency calculations should not be performed until the currencies are normalized.`
  )
}

type ProfileLike = {
  currency?: string | null
  currencies?: string[]
  mixedCurrency?: boolean
}

export const buildCurrencyNormalizationNotes = (
  profilesByTable: Record<string, Record<string, ProfileLike>>,
  relevantTables: string[],
): string[] => {
  const notes: string[] = []

  for (const tableName of relevantTables) {
    const profile = profilesByTable[tableName]
    if (!profile) continue

    for (const [columnName, columnProfile] of Object.entries(profile)) {
      if (!columnProfile?.mixedCurrency) continue

      const warning = buildCurrencyWarning(columnName, {
        currency: columnProfile.currency ?? null,
        currencies: columnProfile.currencies ?? [],
        mixedCurrency: columnProfile.mixedCurrency,
      })

      if (warning) {
        notes.push(`${tableName}.${columnName}: ${warning}`)
      }
    }
  }

  return notes
}