import { formatCarat, formatPrice } from "@/lib/format";
import type { Diamond } from "@/lib/types";

export default function SpecTable({ diamond }: { diamond: Diamond }) {
  const rows: Array<[string, string]> = [
    ["Shape", diamond.shape],
    ["Carat", formatCarat(diamond.carat)],
    ["Color", diamond.color],
    ["Clarity", diamond.clarity],
    ["Cut", diamond.cut],
    ["Certificate", diamond.certificate],
    ["SKU", diamond.sku],
    ["Price", formatPrice(diamond.price_usd)],
  ];

  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-line last:border-0">
            <th
              scope="row"
              className="w-36 py-3 pr-4 text-left text-xs font-normal uppercase tracking-[0.14em] text-charcoal-soft"
            >
              {label}
            </th>
            <td className="py-3 font-medium text-charcoal">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
