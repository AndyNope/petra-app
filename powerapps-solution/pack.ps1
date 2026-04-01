# pack.ps1 — Petra Vorfeld Taxi · Power Platform Solution bauen (Windows/PowerShell)
# Voraussetzung: Power Platform CLI installiert (https://aka.ms/pp/cli)
#   winget install Microsoft.PowerPlatformCLI

$ScriptDir   = $PSScriptRoot
$SrcDir      = Join-Path $ScriptDir "src"
$CanvasSrc   = Join-Path $SrcDir "CanvasApps\PetraVorfeldTaxi_src"
$CanvasMsapp = Join-Path $SrcDir "CanvasApps\PetraVorfeldTaxi.msapp"
$OutDir      = Join-Path $ScriptDir "out"
$ZipFile     = Join-Path $OutDir "PetraVorfeldTaxi.zip"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Petra Vorfeld Taxi — Power Platform Solution Build" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# 1. Canvas App aus YAML-Quellen kompilieren
Write-Host "`n▶ Schritt 1/2: Canvas App kompilieren (pac canvas pack) …" -ForegroundColor Yellow
pac canvas pack --msapp $CanvasMsapp --sources $CanvasSrc
Write-Host "  ✓ PetraVorfeldTaxi.msapp erstellt" -ForegroundColor Green

# 2. Solution-ZIP packen
Write-Host "`n▶ Schritt 2/2: Solution-ZIP erstellen (pac solution pack) …" -ForegroundColor Yellow
pac solution pack --folder $SrcDir --zipFile $ZipFile --packagetype Unmanaged
Write-Host "  ✓ $ZipFile erstellt" -ForegroundColor Green

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Fertig! Importiere die Solution im Power Platform Admin:" -ForegroundColor Cyan
Write-Host "  https://make.powerapps.com → Solutions → Importieren" -ForegroundColor Cyan
Write-Host "  → Datei: out\PetraVorfeldTaxi.zip" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
