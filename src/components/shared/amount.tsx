import { moneyParts, type Decimalish } from "@/lib/format";
import { TONE_TEXT, type Tone } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Monto de dinero. La cifra es la protagonista: cifras tabulares, peso
 * semibold y el símbolo de moneda atenuado y un paso más chico. Hereda el
 * tamaño de su contenedor, así sirve igual en una tabla que en un KPI.
 */
export function Amount({
  value,
  compact,
  tone,
  className,
}: {
  value: Decimalish;
  /** Sin centavos: para KPIs, donde los centavos son ruido. */
  compact?: boolean;
  /** Color de estado; nunca se usa solo, siempre junto a un texto. */
  tone?: Tone;
  className?: string;
}) {
  const { sign, symbol, number } = moneyParts(value, { compact });
  return (
    <span
      className={cn(
        "font-semibold whitespace-nowrap tabular-nums",
        tone && TONE_TEXT[tone],
        className,
      )}
    >
      {sign}
      <span className="mr-px align-baseline text-[0.8em] font-normal opacity-60">
        {symbol}
      </span>
      {number}
    </span>
  );
}
