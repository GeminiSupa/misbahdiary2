"use client";

import { useEffect, useMemo, useState } from "react";

type SupportedCurrency = "USD" | "EUR" | "GBP" | "PKR" | "SAR" | "AED" | "INR";
type NisabMethod = "gold" | "silver";

type FiqhView =
  | "hanafi"
  | "shafii"
  | "maliki"
  | "hanbali"
  | "contemporary"
  | "gold_based"
  | "silver_based";

type WealthInputs = {
  cash: string;
  bankBalance: string;
  businessAssets: string;
  otherAssets: string;
  goldGrams: string;
  silverGrams: string;
  debts: string;
};

type RatesState = {
  base: "USD";
  rates: Record<SupportedCurrency, number>;
  fetchedAt: number | null;
  source: string;
};

const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["USD", "EUR", "GBP", "PKR", "SAR", "AED", "INR"];
const ZAKAT_RATE = 0.025;
const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;

const FIQH_OPTIONS: Array<{ value: FiqhView; label: string; nisabDefault: NisabMethod }> = [
  { value: "hanafi", label: "Hanafi", nisabDefault: "silver" },
  { value: "shafii", label: "Shafi’i", nisabDefault: "gold" },
  { value: "maliki", label: "Maliki", nisabDefault: "gold" },
  { value: "hanbali", label: "Hanbali", nisabDefault: "gold" },
  { value: "contemporary", label: "Contemporary General View", nisabDefault: "gold" },
  { value: "gold_based", label: "Gold-Based Nisab", nisabDefault: "gold" },
  { value: "silver_based", label: "Silver-Based Nisab", nisabDefault: "silver" },
];

const EMPTY_INPUTS: WealthInputs = {
  cash: "",
  bankBalance: "",
  businessAssets: "",
  otherAssets: "",
  goldGrams: "",
  silverGrams: "",
  debts: "",
};

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(n, 0) : 0;
}

function clampRate(value: number | undefined): number | null {
  if (!value || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function convertToUsd(amount: number, currency: SupportedCurrency, rates: Record<SupportedCurrency, number>): number {
  const selectedRate = rates[currency];
  if (!selectedRate || selectedRate <= 0) return 0;
  return amount / selectedRate;
}

function convertUsdToCurrency(usdAmount: number, currency: SupportedCurrency, rates: Record<SupportedCurrency, number>): number {
  const selectedRate = rates[currency];
  if (!selectedRate || selectedRate <= 0) return 0;
  return usdAmount * selectedRate;
}

function formatMoney(amount: number, currency: SupportedCurrency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function fetchFxRates(): Promise<RatesState> {
  const symbols = SUPPORTED_CURRENCIES.join(",");
  const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${symbols}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`FX fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as { rates?: Record<string, number> };
  const rates = {} as Record<SupportedCurrency, number>;
  rates.USD = 1;

  for (const c of SUPPORTED_CURRENCIES) {
    if (c === "USD") continue;
    const rate = clampRate(data.rates?.[c]);
    if (!rate) {
      throw new Error(`Missing FX rate for ${c}`);
    }
    rates[c] = rate;
  }

  return {
    base: "USD",
    rates,
    fetchedAt: Date.now(),
    source: "Frankfurter (ECB reference rates)",
  };
}

/**
 * Optional bonus helper: tries to auto-load metals prices in USD/gram.
 * Uses exchangerate.host with XAU/XAG symbols if available.
 */
async function fetchMetalsUsdPerGram(): Promise<{ goldUsdPerGram: number; silverUsdPerGram: number } | null> {
  try {
    const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=XAU,XAG", {
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { rates?: { XAU?: number; XAG?: number } };
    const xau = data.rates?.XAU;
    const xag = data.rates?.XAG;
    if (!xau || !xag || xau <= 0 || xag <= 0) return null;

    // API returns amount of metal per 1 USD. Invert to get USD per troy ounce.
    const usdPerOunceGold = 1 / xau;
    const usdPerOunceSilver = 1 / xag;
    const gramsPerTroyOunce = 31.1034768;

    return {
      goldUsdPerGram: usdPerOunceGold / gramsPerTroyOunce,
      silverUsdPerGram: usdPerOunceSilver / gramsPerTroyOunce,
    };
  } catch {
    return null;
  }
}

export default function ZakatCalculator() {
  const [currency, setCurrency] = useState<SupportedCurrency>("PKR");
  const [fiqh, setFiqh] = useState<FiqhView>("hanafi");
  const [nisabMethod, setNisabMethod] = useState<NisabMethod>("silver");
  const [inputs, setInputs] = useState<WealthInputs>(EMPTY_INPUTS);

  const [goldPricePerGram, setGoldPricePerGram] = useState<string>("0");
  const [silverPricePerGram, setSilverPricePerGram] = useState<string>("0");

  const [autoMetalsEnabled, setAutoMetalsEnabled] = useState(false);
  const [autoMetalsLoading, setAutoMetalsLoading] = useState(false);
  const [autoMetalsError, setAutoMetalsError] = useState<string | null>(null);

  const [ratesState, setRatesState] = useState<RatesState>({
    base: "USD",
    rates: { USD: 1, EUR: 0, GBP: 0, PKR: 0, SAR: 0, AED: 0, INR: 0 },
    fetchedAt: null,
    source: "Not loaded",
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const selected = FIQH_OPTIONS.find((x) => x.value === fiqh);
    if (selected) setNisabMethod(selected.nisabDefault);
  }, [fiqh]);

  useEffect(() => {
    let cancelled = false;
    setRatesLoading(true);
    setRatesError(null);

    fetchFxRates()
      .then((data) => {
        if (cancelled) return;
        setRatesState(data);
      })
      .catch(() => {
        if (cancelled) return;
        setRatesError("Unable to load live exchange rates. You can still calculate in USD, or retry.");
        // USD-only fallback without hardcoding foreign rates
        setRatesState((prev) => ({
          ...prev,
          rates: { USD: 1, EUR: 0, GBP: 0, PKR: 0, SAR: 0, AED: 0, INR: 0 },
          fetchedAt: prev.fetchedAt,
          source: prev.source,
        }));
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currency, refreshKey]);

  useEffect(() => {
    if (!autoMetalsEnabled) return;
    let cancelled = false;

    setAutoMetalsLoading(true);
    setAutoMetalsError(null);
    fetchMetalsUsdPerGram()
      .then((metals) => {
        if (cancelled) return;
        if (!metals) {
          setAutoMetalsError("Auto metals price unavailable. You can enter prices manually.");
          return;
        }
        const goldInSelectedCurrency = convertUsdToCurrency(metals.goldUsdPerGram, currency, ratesState.rates);
        const silverInSelectedCurrency = convertUsdToCurrency(metals.silverUsdPerGram, currency, ratesState.rates);
        setGoldPricePerGram(goldInSelectedCurrency > 0 ? goldInSelectedCurrency.toFixed(2) : "0");
        setSilverPricePerGram(silverInSelectedCurrency > 0 ? silverInSelectedCurrency.toFixed(2) : "0");
      })
      .catch(() => {
        if (!cancelled) setAutoMetalsError("Auto metals price unavailable. You can enter prices manually.");
      })
      .finally(() => {
        if (!cancelled) setAutoMetalsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [autoMetalsEnabled, currency, ratesState.rates]);

  const canConvertSelectedCurrency = currency === "USD" || ratesState.rates[currency] > 0;

  const calculation = useMemo(() => {
    const cash = toNumber(inputs.cash);
    const bankBalance = toNumber(inputs.bankBalance);
    const businessAssets = toNumber(inputs.businessAssets);
    const otherAssets = toNumber(inputs.otherAssets);
    const debts = toNumber(inputs.debts);
    const goldGrams = toNumber(inputs.goldGrams);
    const silverGrams = toNumber(inputs.silverGrams);

    const goldPrice = toNumber(goldPricePerGram);
    const silverPrice = toNumber(silverPricePerGram);

    // Step 1: convert all selected-currency values into USD.
    const cashUsd = convertToUsd(cash, currency, ratesState.rates);
    const bankUsd = convertToUsd(bankBalance, currency, ratesState.rates);
    const businessUsd = convertToUsd(businessAssets, currency, ratesState.rates);
    const otherUsd = convertToUsd(otherAssets, currency, ratesState.rates);
    const debtsUsd = convertToUsd(debts, currency, ratesState.rates);

    const goldUnitUsd = convertToUsd(goldPrice, currency, ratesState.rates);
    const silverUnitUsd = convertToUsd(silverPrice, currency, ratesState.rates);

    const goldValueUsd = goldGrams * goldUnitUsd;
    const silverValueUsd = silverGrams * silverUnitUsd;

    // Step 2: zakat computation in USD.
    const totalWealthUsd = cashUsd + bankUsd + businessUsd + otherUsd + goldValueUsd + silverValueUsd - debtsUsd;
    const nisabUsd =
      nisabMethod === "gold" ? GOLD_NISAB_GRAMS * goldUnitUsd : SILVER_NISAB_GRAMS * silverUnitUsd;

    const zakatUsd = totalWealthUsd >= nisabUsd && totalWealthUsd > 0 ? totalWealthUsd * ZAKAT_RATE : 0;

    // Step 3: convert results back to selected currency.
    const totalWealthSelected = convertUsdToCurrency(totalWealthUsd, currency, ratesState.rates);
    const nisabSelected = convertUsdToCurrency(nisabUsd, currency, ratesState.rates);
    const zakatSelected = convertUsdToCurrency(zakatUsd, currency, ratesState.rates);

    return {
      totalWealthUsd,
      nisabUsd,
      zakatUsd,
      totalWealthSelected,
      nisabSelected,
      zakatSelected,
      qualifies: totalWealthUsd >= nisabUsd && totalWealthUsd > 0,
    };
  }, [inputs, goldPricePerGram, silverPricePerGram, currency, nisabMethod, ratesState.rates]);

  function setInputField(field: keyof WealthInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  function resetAll() {
    setInputs(EMPTY_INPUTS);
    setGoldPricePerGram("0");
    setSilverPricePerGram("0");
    setAutoMetalsEnabled(false);
    setAutoMetalsError(null);
  }

  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Zakat Calculator</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-currency, fiqh-aware, and computed entirely in your browser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
            Base currency: USD
          </span>
          <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
            Zakat rate: 2.5%
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fiqh view</span>
          <select
            value={fiqh}
            onChange={(e) => setFiqh(e.target.value as FiqhView)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {FIQH_OPTIONS.map((view) => (
              <option key={view.value} value={view.value}>
                {view.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nisab method</span>
          <select
            value={nisabMethod}
            onChange={(e) => setNisabMethod(e.target.value as NisabMethod)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <option value="gold">Gold-based</option>
            <option value="silver">Silver-based</option>
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-muted/25 p-3 text-xs">
        {ratesLoading ? (
          <p className="text-muted-foreground">Loading live exchange rates...</p>
        ) : ratesError ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-destructive">{ratesError}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((x) => x + 1)}
              className="rounded-md border border-border bg-background px-3 py-1.5 font-semibold text-foreground transition hover:bg-muted"
            >
              Retry rates
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-muted-foreground">
            <p>
              Live FX source: <span className="font-semibold text-foreground">{ratesState.source}</span>
            </p>
            <p>
              1 USD = {ratesState.rates[currency]?.toFixed(4) || "N/A"} {currency}
              {ratesState.fetchedAt ? `  •  Updated ${new Date(ratesState.fetchedAt).toLocaleTimeString()}` : ""}
            </p>
          </div>
        )}
      </div>

      {!canConvertSelectedCurrency && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Conversion unavailable for {currency} because live rates are missing. Switch to USD or refresh rates.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Zakatable wealth</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`Cash (${currency})`} value={inputs.cash} onChange={(v) => setInputField("cash", v)} />
            <Field
              label={`Bank balance (${currency})`}
              value={inputs.bankBalance}
              onChange={(v) => setInputField("bankBalance", v)}
            />
            <Field
              label={`Business assets (${currency})`}
              value={inputs.businessAssets}
              onChange={(v) => setInputField("businessAssets", v)}
            />
            <Field
              label={`Other assets (${currency})`}
              value={inputs.otherAssets}
              onChange={(v) => setInputField("otherAssets", v)}
            />
            <Field label="Gold (grams)" value={inputs.goldGrams} onChange={(v) => setInputField("goldGrams", v)} />
            <Field
              label="Silver (grams)"
              value={inputs.silverGrams}
              onChange={(v) => setInputField("silverGrams", v)}
            />
            <Field label={`Debts (${currency})`} value={inputs.debts} onChange={(v) => setInputField("debts", v)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Nisab prices</h3>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoMetalsEnabled}
                onChange={(e) => setAutoMetalsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Auto metals price (bonus)
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={`Gold price / gram (${currency})`}
              value={goldPricePerGram}
              onChange={setGoldPricePerGram}
              disabled={autoMetalsEnabled}
            />
            <Field
              label={`Silver price / gram (${currency})`}
              value={silverPricePerGram}
              onChange={setSilverPricePerGram}
              disabled={autoMetalsEnabled}
            />
          </div>

          {autoMetalsLoading && <p className="text-xs text-muted-foreground">Loading live gold/silver prices...</p>}
          {autoMetalsError && <p className="text-xs text-destructive">{autoMetalsError}</p>}

          <div className="mt-2 rounded-xl border border-border/60 bg-background p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Result</h4>
            <dl className="space-y-2 text-sm">
              <ResultRow
                label={`Total wealth (${currency})`}
                value={formatMoney(calculation.totalWealthSelected, currency)}
              />
              <ResultRow label={`Nisab (${currency})`} value={formatMoney(calculation.nisabSelected, currency)} />
              <ResultRow
                label={`Zakat due (${currency})`}
                value={formatMoney(calculation.zakatSelected, currency)}
                strong
              />
              <ResultRow
                label="Selected fiqh"
                value={FIQH_OPTIONS.find((v) => v.value === fiqh)?.label || fiqh}
              />
              <ResultRow
                label="Exchange rate used"
                value={`1 USD = ${ratesState.rates[currency]?.toFixed(4) || "N/A"} ${currency}`}
              />
              <ResultRow label="Status" value={calculation.qualifies ? "Nisab reached" : "Below nisab"} />
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRefreshKey((x) => x + 1)}
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
        >
          Refresh exchange rates
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.98]"
        >
          Reset
        </button>
      </div>

      <p className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        This calculator is for guidance only. Please consult a qualified scholar for detailed rulings.
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="0.00"
      />
    </label>
  );
}

function ResultRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-bold text-foreground" : "font-medium text-foreground"}>{value}</dd>
    </div>
  );
}

