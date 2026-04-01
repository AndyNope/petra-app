#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# pack.sh — Petra Vorfeld Taxi · Power Platform Solution bauen
# Voraussetzung: Power Platform CLI installiert (https://aka.ms/pp/cli)
#   brew install --cask power-platform-tools   # macOS
#   dotnet tool install --global Microsoft.PowerApps.CLI.Tool  # alternativ
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/src"
CANVAS_SRC="$SRC_DIR/CanvasApps/PetraVorfeldTaxi_src"
CANVAS_MSAPP="$SRC_DIR/CanvasApps/PetraVorfeldTaxi.msapp"
OUT_DIR="$SCRIPT_DIR/out"
ZIP_FILE="$OUT_DIR/PetraVorfeldTaxi.zip"

echo "═══════════════════════════════════════════════════════════"
echo "  Petra Vorfeld Taxi — Power Platform Solution Build"
echo "═══════════════════════════════════════════════════════════"

# Ausgabe-Ordner erstellen
mkdir -p "$OUT_DIR"

# 1. Canvas App aus YAML-Quellen kompilieren
echo ""
echo "▶ Schritt 1/2: Canvas App kompilieren (pac canvas pack) …"
pac canvas pack \
  --msapp "$CANVAS_MSAPP" \
  --sources "$CANVAS_SRC"
echo "  ✓ PetraVorfeldTaxi.msapp erstellt"

# 2. Solution-ZIP packen
echo ""
echo "▶ Schritt 2/2: Solution-ZIP erstellen (pac solution pack) …"
pac solution pack \
  --folder "$SRC_DIR" \
  --zipFile "$ZIP_FILE" \
  --packagetype Unmanaged
echo "  ✓ $ZIP_FILE erstellt"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Fertig! Importiere die Solution im Power Platform Admin:"
echo "  https://make.powerapps.com → Solutions → Importieren"
echo "  → Datei: out/PetraVorfeldTaxi.zip"
echo "═══════════════════════════════════════════════════════════"
