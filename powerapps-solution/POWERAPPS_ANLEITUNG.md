# Petra – Canvas App Anleitung (ohne Power Automate)

## Schritt 1: SharePoint-Liste anlegen

Gehe zu deiner SharePoint-Site und erstelle eine Liste namens **PetraTaxis** mit diesen Spalten:

| Spaltenname | Typ | Optionen |
|---|---|---|
| Title | Text | (Standard, umbenannt zu "FunkID") |
| Position | Auswahl | E, F, H, I, A, B, C, D, T, G, P, W |
| Capacity | Zahl | |
| Occupied | Zahl | |
| Active | Ja/Nein | |

Testdaten eintragen:
- Taxi 1 | Position: E | Capacity: 8 | Occupied: 0 | Active: Ja
- Taxi 2 | Position: H | Capacity: 8 | Occupied: 0 | Active: Ja

---

## Schritt 2: Canvas App mit SharePoint verbinden

1. make.powerapps.com → Lösungen → Petra → + Neu → App → Canvas-App
2. Leer-App (Tablet oder Phone)
3. Ansicht → Datenquellen → Hinzufügen → SharePoint → Site-URL → PetraTaxis auswählen

---

## Schritt 3: App.OnStart – globale Variablen setzen

PowerFx für App.OnStart:

```
// Platzkette: Index pro Zone
Set(gZoneMap, [
    {zone: "E", idx: 0},
    {zone: "F", idx: 1},
    {zone: "H", idx: 2},
    {zone: "I", idx: 3},
    {zone: "A", idx: 4},
    {zone: "B", idx: 5},
    {zone: "C", idx: 6},
    {zone: "D", idx: 7},
    {zone: "T", idx: 8},
    {zone: "G", idx: 9},
    {zone: "P", idx: 10},
    {zone: "W", idx: 11}
]);

// Taxis aus SharePoint laden
ClearCollect(gTaxis, Filter(PetraTaxis, Active = true));

Set(gSelectedZone, "E");
Set(gPassengers, 1);
Set(gBestTaxi, Blank());
Set(gETA, 0);
```

---

## Schritt 4: Dispatch-Algorithmus (Button OnSelect)

PowerFx für den "Bestes Taxi finden" Button:

```
// Pickup-Zone Index holen
Set(
    pickupIdx,
    LookUp(gZoneMap, zone = gSelectedZone, idx)
);

// Alle Taxis mit Score berechnen
ClearCollect(
    colTaxisScored,
    AddColumns(
        Filter(gTaxis,
            (Capacity - Occupied) >= gPassengers
        ),
        "Score",
        Abs(
            LookUp(gZoneMap, zone = Position, idx) - pickupIdx
        ),
        "FreiePlaetze",
        Capacity - Occupied
    )
);

// Bestes Taxi = niedrigster Score
Set(
    gBestTaxi,
    First(Sort(colTaxisScored, Score, SortOrder.Ascending))
);

// ETA berechnen
If(
    !IsBlank(gBestTaxi),
    Set(taxiIdx, LookUp(gZoneMap, zone = gBestTaxi.Position, idx));
    Set(schritte, Abs(taxiIdx - pickupIdx));
    Set(distanzKm, schritte * 0.8);
    Set(
        geschwindigkeit,
        If(
            (gBestTaxi.Position = "F" && gSelectedZone = "E") ||
            (gBestTaxi.Position = "E" && gSelectedZone = "F"),
            50,
            30
        )
    );
    Set(gETA, Round(distanzKm / geschwindigkeit * 60, 0))
)
```

---

## Schritt 5: ETA-Berechnung (separate Funktion)

PowerFx-Formel für ETA zwischen zwei Zonen (z.B. in einem Button):

```
Set(vonIdx, LookUp(gZoneMap, zone = vonZone, idx));
Set(nachIdx, LookUp(gZoneMap, zone = nachZone, idx));
Set(schritte, Abs(vonIdx - nachIdx));
Set(distanzKm, schritte * 0.8);
Set(
    speed,
    If(
        (vonZone = "E" && nachZone = "F") || (vonZone = "F" && nachZone = "E"),
        50, 30
    )
);
Set(etaMinutes, Round(distanzKm / speed * 60, 0))
```

---

## Schritt 6: Anzeigeelemente

### Ergebnis-Label (Text-Eigenschaft):

**Bestes Taxi:**
```
If(
    IsBlank(gBestTaxi),
    "Kein verfügbares Taxi",
    "Taxi: " & gBestTaxi.Title &
    " | Zone: " & gBestTaxi.Position &
    " | Frei: " & gBestTaxi.FreiePlaetze & " Plätze" &
    " | ETA: " & gETA & " Min"
)
```

**Alle verfügbaren Taxis (Gallery):**
- Items: `Sort(colTaxisScored, Score, SortOrder.Ascending)`
- Label1: `ThisItem.Title & " (" & ThisItem.Position & ")"`
- Label2: `"Score: " & ThisItem.Score & " | ETA: " & Round(Abs(LookUp(gZoneMap, zone=ThisItem.Position, idx) - pickupIdx) * 0.8 / 30 * 60, 0) & " Min"`

---

## Taxi-Status aktualisieren (nach Zuweisung)

```
Patch(
    PetraTaxis,
    gBestTaxi,
    {Occupied: gBestTaxi.Occupied + gPassengers}
);
ClearCollect(gTaxis, Filter(PetraTaxis, Active = true))
```
