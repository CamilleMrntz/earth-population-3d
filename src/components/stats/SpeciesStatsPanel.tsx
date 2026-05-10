import type { SpeciesStatRow } from "../../lib/population/types";
import type { SpeciesId } from "../../lib/visualization/speciesIds";
import { SPECIES_IDS } from "../../lib/visualization/speciesIds";

import "./SpeciesStatsPanel.css";

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

type SpeciesStatsPanelProps = {
  rows: SpeciesStatRow[];
  loading: boolean;
  onRefresh: () => void;
  selected: SpeciesId[];
  onToggleSpecies: (id: SpeciesId) => void;
  speciesCheckboxLabels: Record<SpeciesId, string>;
};

export function SpeciesStatsPanel({
  rows,
  loading,
  onRefresh,
  selected,
  onToggleSpecies,
  speciesCheckboxLabels,
}: SpeciesStatsPanelProps) {
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
        collection Firestore <code>species</code> ; « Actualiser » refait les APIs puis met la base à jour.
      </p>

      <fieldset className="species-stats__checks">
        <legend className="species-stats__legend">Afficher sur la Terre</legend>
        {SPECIES_IDS.map((id) => (
          <label key={id} className="species-stats__checkrow">
            <input
              type="checkbox"
              checked={selected.includes(id)}
              onChange={() => onToggleSpecies(id)}
              disabled={loading}
            />
            <span>{speciesCheckboxLabels[id]}</span>
          </label>
        ))}
      </fieldset>

      {loading && <p className="species-stats__loading">Chargement des sources…</p>}
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
                  {r.year != null ? (
                    <span className="species-stats__year"> ({r.year})</span>
                  ) : null}
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
    </aside>
  );
}
