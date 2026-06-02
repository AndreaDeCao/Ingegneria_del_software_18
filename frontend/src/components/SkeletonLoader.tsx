/**
 * SkeletonLoader.tsx
 * 
 * Componenti riutilizzabili per loading states.
 * 
 * USO:
 *   import { PageLoader, SkeletonCard, SkeletonStat, SkeletonText } from "./SkeletonLoader";
 * 
 *   // Pagina intera in caricamento:
 *   if (loading) return <PageLoader />;
 * 
 *   // Sezione in caricamento (es. statistiche):
 *   {statsLoading ? <SkeletonStatRow /> : <LeStatistiche />}
 * 
 *   // Card trek in caricamento:
 *   {trekLoading ? <SkeletonCardRow count={5} /> : <TrekCards />}
 */

import React from "react";

// ─── CSS IN JS (iniettato una volta sola) ────────────────────────────────────

const STYLES = `
  @keyframes dolomate-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }

  .dlm-skeleton {
    background: linear-gradient(
      90deg,
      var(--skeleton-base, #e8e4dc) 25%,
      var(--skeleton-shine, #f0ece4) 50%,
      var(--skeleton-base, #e8e4dc) 75%
    );
    background-size: 600px 100%;
    animation: dolomate-shimmer 1.4s ease-in-out infinite;
    border-radius: 6px;
  }

  /* Dark mode */
  [data-theme="dark"] .dlm-skeleton,
  .dark .dlm-skeleton {
    --skeleton-base: #2a2a2a;
    --skeleton-shine: #333333;
  }

  /* ── Page Loader ── */
  .dlm-page-loader {
    position: fixed;
    inset: 0;
    background: var(--bg, #f0ece4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 9999;
  }

  [data-theme="dark"] .dlm-page-loader,
  .dark .dlm-page-loader {
    --bg: #1a1a1a;
  }

  .dlm-page-loader-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    animation: dlm-fade-in 0.4s ease;
  }

  .dlm-page-loader-logo-svg { 
    width: 60px;
    height: 60px;
  }


  .dlm-page-loader-name {
    fontFamily: "var(--font-display)",
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: "-0.3px",
    color: "var(--text-primary)",
  }

  .dlm-progress-track {
    width: 180px;
    height: 3px;
    background: var(--track, #d4cfc6);
    border-radius: 99px;
    overflow: hidden;
  }

  [data-theme="dark"] .dlm-progress-track,
  .dark .dlm-progress-track {
    --track: #333;
  }

  .dlm-progress-bar {
    height: 100%;
    background: #1a4a2e;
    border-radius: 99px;
    animation: dlm-progress 1.6s ease-in-out infinite;
    transform-origin: left;
  }

  [data-theme="dark"] .dlm-progress-bar,
  .dark .dlm-progress-bar {
    background: #5dba7a;
  }

  @keyframes dlm-progress {
    0%   { width: 0%;   margin-left: 0%; }
    50%  { width: 60%;  margin-left: 20%; }
    100% { width: 0%;   margin-left: 100%; }
  }

  @keyframes dlm-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Card Skeleton ── */
  .dlm-skeleton-card {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    flex-shrink: 0;
    width: 210px;
  }

  [data-theme="dark"] .dlm-skeleton-card,
  .dark .dlm-skeleton-card {
    --card-bg: #242424;
  }

  .dlm-skeleton-card-img {
    width: 100%;
    height: 130px;
  }

  .dlm-skeleton-card-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dlm-skeleton-card-row {
    display: flex;
    gap: 8px;
  }

  /* ── Stat Skeleton ── */
  .dlm-skeleton-stat {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  [data-theme="dark"] .dlm-skeleton-stat,
  .dark .dlm-skeleton-stat {
    --card-bg: #242424;
  }

  /* ── Activity Skeleton ── */
  .dlm-skeleton-activity {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }

  [data-theme="dark"] .dlm-skeleton-activity,
  .dark .dlm-skeleton-activity {
    --card-bg: #242424;
  }

  .dlm-skeleton-activity-tags {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  /* ── Row layout ── */
  .dlm-skeleton-card-row-scroll {
    display: flex;
    gap: 16px;
    overflow: hidden;
  }

  .dlm-skeleton-stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
`;

// Inject styles once
if (typeof document !== "undefined" && !document.getElementById("dlm-skeleton-styles")) {
  const tag = document.createElement("style");
  tag.id = "dlm-skeleton-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

// ─── PAGE LOADER ─────────────────────────────────────────────────────────────

/**
 * Loader a pagina intera con logo DoloMate animato.
 * Sostituisce il "Caricamento ...", "Caricamento profilo..." e simili.
 */
export function PageLoader() {
  return (
    <div className="dlm-page-loader">
      <div className="dlm-page-loader-logo">
        <img src="/logo_ing_sw.svg" alt="DoloMate_logo" className="dlm-page-loader-logo dlm-page-loader-logo-svg"/>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text-primary)", }}>
          Dolo<em style={{ fontStyle: "normal", color: "var(--accent)" }}>Mate</em>
        </span>
      </div>
      <div className="dlm-progress-track">
        <div className="dlm-progress-bar" />
      </div>
    </div>
  );
}

// ─── SKELETON CARD (Trek) ────────────────────────────────────────────────────

/**
 * Skeleton di una singola TrekCard.
 */
export function SkeletonCard() {
  return (
    <div className="dlm-skeleton-card">
      <div className="dlm-skeleton dlm-skeleton-card-img" />
      <div className="dlm-skeleton-card-body">
        <div className="dlm-skeleton" style={{ height: 14, width: "80%" }} />
        <div className="dlm-skeleton" style={{ height: 12, width: "55%" }} />
        <div className="dlm-skeleton-card-row">
          <div className="dlm-skeleton" style={{ height: 22, width: 60, borderRadius: 99 }} />
          <div className="dlm-skeleton" style={{ height: 22, width: 80, borderRadius: 99 }} />
        </div>
        <div className="dlm-skeleton-card-row">
          <div className="dlm-skeleton" style={{ height: 18, width: 50, borderRadius: 99 }} />
          <div className="dlm-skeleton" style={{ height: 18, width: 50, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Riga di N SkeletonCard (per la sezione "Di tendenza").
 */
export function SkeletonCardRow({ count = 5 }: { count?: number }) {
  return (
    <div className="dlm-skeleton-card-row-scroll">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── SKELETON STAT ───────────────────────────────────────────────────────────

/**
 * Skeleton di una singola stat box.
 */
export function SkeletonStat() {
  return (
    <div className="dlm-skeleton-stat">
      <div className="dlm-skeleton" style={{ height: 12, width: "60%" }} />
      <div className="dlm-skeleton" style={{ height: 28, width: "45%" }} />
    </div>
  );
}

/**
 * Riga delle 4 statistiche.
 */
export function SkeletonStatRow() {
  return (
    <div className="dlm-skeleton-stat-row">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}

// ─── SKELETON ACTIVITY (sidebar destra) ─────────────────────────────────────

/**
 * Skeleton di una activity card nella sidebar.
 */
export function SkeletonActivity() {
  return (
    <div className="dlm-skeleton-activity">
      <div className="dlm-skeleton" style={{ height: 16, width: "75%" }} />
      <div className="dlm-skeleton" style={{ height: 12, width: "90%" }} />
      <div className="dlm-skeleton" style={{ height: 12, width: "65%" }} />
      <div className="dlm-skeleton-activity-tags">
        <div className="dlm-skeleton" style={{ height: 22, width: 90, borderRadius: 99 }} />
        <div className="dlm-skeleton" style={{ height: 22, width: 110, borderRadius: 99 }} />
      </div>
      <div className="dlm-skeleton" style={{ height: 12, width: 120, borderRadius: 99 }} />
    </div>
  );
}

/**
 * Lista di N skeleton activity (sidebar "Attività in programma").
 */
export function SkeletonActivityList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonActivity key={i} />
      ))}
    </>
  );
}

// ─── SKELETON TEXT (generico) ────────────────────────────────────────────────

/**
 * Linee di testo skeleton generiche.
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ["100%", "85%", "70%", "90%", "60%"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="dlm-skeleton"
          style={{ height: 13, width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}