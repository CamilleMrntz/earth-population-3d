import { useMemo } from "react";

import type { SpeciesStatRow } from "../../lib/population/types";
import { isSpeciesId, type SpeciesId } from "../../lib/visualization/speciesIds";
import {
  SPECIES_CHECKBOX_GROUPS,
  SPECIES_CHECKBOX_LABEL,
  SPECIES_SHORT_NAME,
} from "../../lib/visualization/speciesUiMeta";

import "./SpeciesStatsPanel.css";

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

type SpeciesStatsPanelProps = {
  rows: SpeciesStatRow[];
  loading: boolean;
  onRefresh: () => void;
  selected: SpeciesId[];
  onToggleSpecies: (id: SpeciesId) => void;
};

export function SpeciesStatsPanel({
  rows,
  loading,
  onRefresh,
  selected,
  onToggleSpecies,
}: SpeciesStatsPanelProps) {
  const rowById = useMemo(() => {
    const m = new Map<SpeciesId, SpeciesStatRow>();
    for (const r of rows) {
      if (isSpeciesId(r.id)) m.set(r.id, r);
    }
    return m;
  }, [rows]);

  return (
    <aside className="species-stats" aria-label="Statistiques et visualisation par espèce">
      <header className="species-stats__header">
        <h2 className="species-stats__title">Données et affichage</h2>
        <button type="button" className="species-stats__refresh" onClick={onRefresh} disabled={loading}>
          Actualiser
        </button>
      </header>
      <p className="species-stats__hint">
        Les <strong>points sur le globe</strong> sont une <strong>représentation proportionnelle</strong> (nombre
        d’instances plafonné) : ce n’est <strong>pas</strong> le nombre réel d’individus. Au plus{" "}
        <strong>deux espèces</strong> à la fois pour limiter la charge GPU. Les chiffres viennent d’abord de la
        collection Firestore <code>species</code> ; « Actualiser » refait les APIs (espèces courantes) puis met la
        base à jour — les espèces menacées affichées ici ont des <strong>estimations statiques</strong> côté app.
      </p>

      {loading && <p className="species-stats__loading">Chargement des sources…</p>}

      <div className="species-stats__primary">
        {SPECIES_CHECKBOX_GROUPS.map((group, gi) => (
          <section key={group.legend} className="species-stats__group" aria-labelledby={`species-g-${gi}`}>
            <h3 className="species-stats__group-title" id={`species-g-${gi}`}>
              {group.legend}
            </h3>
            <ul className="species-stats__primary-list">
              {group.ids.map((id) => {
                const r = rowById.get(id);
                const title = SPECIES_CHECKBOX_LABEL[id];
                const count =
                  r?.status === "ok" && r.value != null
                    ? nf.format(r.value)
                    : r?.status === "error"
                      ? "—"
                      : loading
                        ? "…"
                        : "—";
                return (
                  <li key={id} className="species-stats__primary-item">
                    <label className="species-stats__primary-row" title={title}>
                      <input
                        className="species-stats__primary-cb"
                        type="checkbox"
                        checked={selected.includes(id)}
                        onChange={() => onToggleSpecies(id)}
                        disabled={loading}
                      />
                      <span className="species-stats__primary-name">{SPECIES_SHORT_NAME[id]}</span>
                      <span className="species-stats__primary-count">{count}</span>
                    </label>
                    {r?.status === "error" ? (
                      <div className="species-stats__primary-meta species-stats__primary-meta--error">
                        {r.errorMessage}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="species-stats__secondary" aria-labelledby="species-secondary-heading">
        <h3 className="species-stats__secondary-title" id="species-secondary-heading">
          Sources et détails
        </h3>
        <ul className="species-stats__list">
          {rows.map((r) => (
            <li key={r.id} className="species-stats__item">
              <div className="species-stats__label">{r.label}</div>
              {r.status === "error" ? (
                <div className="species-stats__error">{r.errorMessage}</div>
              ) : (
                <>
                  <div className="species-stats__value">
                    {r.value != null ? nf.format(r.value) : "—"}{" "}
                    {r.value != null ? <span className="species-stats__unit">{r.unit}</span> : null}
                    {r.year != null ? <span className="species-stats__year"> ({r.year})</span> : null}
                  </div>
                  <div className="species-stats__source">
                    {r.sourceLabel}
                    <br />
                    <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                      {r.sourceUrl}
                    </a>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
