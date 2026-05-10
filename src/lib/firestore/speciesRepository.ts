import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";

import { getFirestoreDb } from "../firebase/firebaseApp";
import type { SpeciesStatRow } from "../population/types";
import { SPECIES_IDS, isSpeciesId } from "../visualization/speciesIds";
import { SPECIES_REMOTE_META } from "./speciesRemoteMeta";
import { SPECIES_COLLECTION, type SpeciesFirestoreDoc } from "./speciesSchema";

function rowToDoc(row: SpeciesStatRow): Omit<SpeciesFirestoreDoc, "updatedAt"> {
  const id = row.id;
  if (!isSpeciesId(id)) {
    throw new Error(`Invalid species id for Firestore: ${row.id}`);
  }
  const meta = SPECIES_REMOTE_META[id];
  return {
    speciesId: id,
    label: row.label,
    population: row.value,
    referenceYear: row.year,
    unit: row.unit,
    sourceLabel: row.sourceLabel,
    sourceUrl: row.sourceUrl,
    status: row.status === "error" ? "error" : "ok",
    errorMessage: row.errorMessage ?? null,
    worldBankIndicatorId: meta.worldBankIndicatorId ?? null,
    faostatQclItemCode: meta.faostatQclItemCode ?? null,
    notes: meta.notes ?? null,
  };
}

function docToRow(id: string, data: DocumentData): SpeciesStatRow {
  const label = typeof data.label === "string" ? data.label : id;
  const population = typeof data.population === "number" ? data.population : null;
  const year = typeof data.referenceYear === "number" ? data.referenceYear : null;
  const unit = typeof data.unit === "string" ? data.unit : "—";
  const sourceLabel = typeof data.sourceLabel === "string" ? data.sourceLabel : "—";
  const sourceUrl = typeof data.sourceUrl === "string" ? data.sourceUrl : "";
  const status = data.status === "error" ? "error" : "ok";
  const errorMessage = typeof data.errorMessage === "string" ? data.errorMessage : undefined;
  return {
    id,
    label,
    value: population,
    year,
    unit,
    sourceLabel,
    sourceUrl,
    status,
    errorMessage,
  };
}

/** Retourne les lignes ordonnées si tous les `SPECIES_IDS` ont un document ; sinon `null`. */
export async function readCachedSpeciesRows(): Promise<SpeciesStatRow[] | null> {
  const db = getFirestoreDb();
  const snap = await getDocs(collection(db, SPECIES_COLLECTION));
  if (snap.empty) return null;

  const map = new Map<string, SpeciesStatRow>();
  snap.forEach((d) => {
    map.set(d.id, docToRow(d.id, d.data()));
  });

  for (const id of SPECIES_IDS) {
    if (!map.has(id)) return null;
  }

  return SPECIES_IDS.map((id) => map.get(id)!);
}

/** Upserts all species rows (batch). */
export async function writeSpeciesRows(rows: SpeciesStatRow[]): Promise<void> {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  for (const row of rows) {
    if (!isSpeciesId(row.id)) continue;
    const ref = doc(db, SPECIES_COLLECTION, row.id);
    const payload = {
      ...rowToDoc(row),
      updatedAt: serverTimestamp(),
    };
    batch.set(ref, payload, { merge: true });
  }
  await batch.commit();
}
