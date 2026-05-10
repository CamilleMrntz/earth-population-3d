import { fetchFaostatQclWorldStocksHeads } from "./faostat";
import { loadLivestockFallback } from "./loadLivestockFallback";
import type { LivestockFallbackFile } from "./loadLivestockFallback";
import type { SpeciesStatRow } from "./types";
import { SPECIES_ENDANGERED_IDS } from "../visualization/speciesIds";
import { fetchWorldBankLatest } from "./worldBank";

const IUCN_HUB = "https://www.iucnredlist.org/";

const ENDANGERED_ERR_LABEL: Record<(typeof SPECIES_ENDANGERED_IDS)[number], string> = {
  tiger: "Tigre",
  mountain_gorilla: "Gorille de montagne",
  black_rhino: "Rhinocéros noir",
  vaquita: "Vaquita",
};

/** World aggregate in World Bank API (ISO3 WLD). */
const WB_WORLD = "WLD";
/** Total population indicator. */
const WB_POP = "SP.POP.TOTL";

/** Try these FAOSTAT element codes for “stocks / live animals” if the API revision differs. */
const FAOSTAT_STOCK_ELEMENTS = [5112, 5110] as const;

async function tryFaostatHeads(itemCode: number, year = 2022): Promise<{ value: number; year: number; sourceUrl: string }> {
  let lastErr: unknown;
  for (const elementCode of FAOSTAT_STOCK_ELEMENTS) {
    try {
      return await fetchFaostatQclWorldStocksHeads({ itemCode, elementCode, year });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function faostatOrFallback(
  id: keyof LivestockFallbackFile["species"],
  itemCode: number,
  fallback: LivestockFallbackFile,
): Promise<Omit<SpeciesStatRow, "id" | "label" | "status" | "errorMessage">> {
  try {
    const r = await tryFaostatHeads(itemCode);
    return {
      value: r.value,
      year: r.year,
      unit: "individus (FAOSTAT, cheptel vivant)",
      sourceLabel: "FAO FAOSTAT (API QCL — agrégat Monde)",
      sourceUrl: r.sourceUrl,
    };
  } catch {
    const snap = fallback.species[id];
    if (!snap) throw new Error(`Pas d’entrée de secours pour ${String(id)}`);
    return {
      value: snap.value,
      year: snap.year,
      unit: "individus (chiffre indicatif, fichier local)",
      sourceLabel: "Secours: fichier public + lien FAOSTAT (à synchroniser)",
      sourceUrl: snap.sourceUrl,
    };
  }
}

/**
 * Chiffres indicatifs (sauvage), non issus des APIs Banque mondiale / FAOSTAT.
 * Mis à jour manuellement ou via Firestore ; « Actualiser » réécrit ces lignes avec les mêmes valeurs de base.
 */
function endangeredSpeciesStaticRows(): SpeciesStatRow[] {
  return [
    {
      id: "tiger",
      label: "Tigre (Panthera tigris) — individus sauvages estimés",
      value: 5_000,
      year: 2022,
      unit: "individus (estimation)",
      sourceLabel: "Ordre de grandeur type Liste rouge IUCN / synthèses récentes",
      sourceUrl: IUCN_HUB,
      status: "ok",
    },
    {
      id: "mountain_gorilla",
      label: "Gorille de montagne (Gorilla beringei beringei)",
      value: 1_100,
      year: 2020,
      unit: "individus (census régionaux)",
      sourceLabel: "Estimations publiées (Virunga, Bwindi, Mgahinga…)",
      sourceUrl: IUCN_HUB,
      status: "ok",
    },
    {
      id: "black_rhino",
      label: "Rhinocéros noir (Diceros bicornis)",
      value: 6_500,
      year: 2021,
      unit: "individus (estimation sauvage)",
      sourceLabel: "Agrégats Afrique de l’Est / Sud (IUCN / rapports de conservation)",
      sourceUrl: IUCN_HUB,
      status: "ok",
    },
    {
      id: "vaquita",
      label: "Marsouin du Golfe de Californie (Phocoena sinus)",
      value: 18,
      year: 2023,
      unit: "individus (effectif critique)",
      sourceLabel: "Estimations CIRVA / communiqués récents (très incertain)",
      sourceUrl: "https://www.iucnredlist.org/species/17028/50370293",
      status: "ok",
    },
  ];
}

function errRow(partial: Pick<SpeciesStatRow, "id" | "label">, message: string): SpeciesStatRow {
  return {
    ...partial,
    value: null,
    year: null,
    unit: "—",
    sourceLabel: "—",
    sourceUrl: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation",
    status: "error",
    errorMessage: message,
  };
}

/**
 * Loads all demo rows in parallel. Humans come from the World Bank; livestock from FAOSTAT
 * with a local JSON fallback if the FAO endpoint is unreachable.
 */
export async function fetchSpeciesStats(): Promise<SpeciesStatRow[]> {
  let fallback: LivestockFallbackFile;
  try {
    fallback = await loadLivestockFallback();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [
      errRow({ id: "humans", label: "Humains (population mondiale)" }, msg),
      errRow({ id: "cattle", label: "Vaches et bovins" }, msg),
      errRow({ id: "chickens", label: "Poules / volailles" }, msg),
      ...SPECIES_ENDANGERED_IDS.map((id) => errRow({ id, label: ENDANGERED_ERR_LABEL[id] }, msg)),
    ];
  }

  const humansPromise = fetchWorldBankLatest(WB_WORLD, WB_POP)
    .then(
      (r): SpeciesStatRow => ({
        id: "humans",
        label: "Humains (population mondiale)",
        value: r.value,
        year: r.year,
        unit: "personnes",
        sourceLabel: `Banque mondiale — ${r.indicatorName}`,
        sourceUrl: r.sourceUrl,
        status: "ok",
      }),
    )
    .catch(
      (e): SpeciesStatRow =>
        errRow(
          { id: "humans", label: "Humains (population mondiale)" },
          e instanceof Error ? e.message : String(e),
        ),
    );

  const cattlePromise = faostatOrFallback("cattle", 1808, fallback).then(
    (d): SpeciesStatRow => ({
      id: "cattle",
      label: "Vaches et bovins (cheptel vivant, monde)",
      ...d,
      status: "ok",
    }),
  );

  const chickensPromise = faostatOrFallback("chickens", 1058, fallback).then(
    (d): SpeciesStatRow => ({
      id: "chickens",
      label: "Poules / volailles (poulets vivants, monde)",
      ...d,
      status: "ok",
    }),
  );

  const base = await Promise.all([humansPromise, cattlePromise, chickensPromise]);
  return [...base, ...endangeredSpeciesStaticRows()];
}
