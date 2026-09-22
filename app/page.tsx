import type { Metadata } from "next";
import CatalogClient from "@/components/CatalogClient";
import { getAllDiamonds, getFilterOptions } from "@/lib/diamonds";

export const metadata: Metadata = {
  title: "Fine Diamonds | Aurelia Diamonds",
  description:
    "Browse our curated collection of GIA-certified diamonds. Filter by shape, carat and color to find the perfect stone.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const diamonds = getAllDiamonds();
  const options = getFilterOptions(diamonds);

  return (
    <CatalogClient
      diamonds={diamonds}
      options={options}
      initialSearchParams={resolvedSearchParams}
    />
  );
}
