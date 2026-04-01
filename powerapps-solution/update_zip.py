#!/usr/bin/env python3
"""
Petra Vorfeld Taxi – Solution UPDATE Builder
Nimmt den originalen Power Platform Export (Petra_1_0_0_0.zip) und fügt
die 2 Power Automate Flows hinzu → Petra_1_0_0_1.zip (Update-Import).

Verwendung:
  1. Lege Petra_1_0_0_0.zip in diesen Ordner (powerapps-solution/)
  2. python3 update_zip.py
  3. Importiere out/Petra_1_0_0_1.zip via make.powerapps.com → Update
"""

import json
import os
import re
import zipfile

GUID_DISPATCH = "a1b2c3d4-e5f6-7890-abcd-ef1234567801"
GUID_ETA      = "a1b2c3d4-e5f6-7890-abcd-ef1234567802"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR    = os.path.join(SCRIPT_DIR, "src")
OUT_DIR    = os.path.join(SCRIPT_DIR, "out")
BASE_ZIP   = os.path.join(SCRIPT_DIR, "Petra_1_0_0_0.zip")
OUT_ZIP    = os.path.join(OUT_DIR, "Petra_1_0_0_1.zip")

os.makedirs(OUT_DIR, exist_ok=True)

# ── Prüfe ob Basis-ZIP vorhanden ──────────────────────────────────────────────
if not os.path.exists(BASE_ZIP):
    print(f"❌ Basis-ZIP nicht gefunden: {BASE_ZIP}")
    print()
    print("Bitte:")
    print("  1. Öffne make.powerapps.com → Solutions → Petra")
    print("  2. Exportieren → Nicht verwaltet → Download")
    print(f"  3. Lege die heruntergeladene Datei hierher: {BASE_ZIP}")
    raise SystemExit(1)


# ── Flow-JSON laden und für Power Platform verpacken ─────────────────────────
def load_flow(filename: str) -> str:
    path = os.path.join(SRC_DIR, "Workflows", filename)
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    props = raw.get("properties", raw)
    wrapped = {
        "properties": {
            "connectionReferences": props.get("connectionReferences", {}),
            "definition": props.get("definition", raw.get("definition", {})),
            "displayName": props.get("displayName", raw.get("name", "")),
            "description": props.get("description", ""),
        }
    }
    return json.dumps(wrapped, ensure_ascii=False, indent=2)


# ── solution.xml: Version bumpen + Flow-RootComponents anfügen ────────────────
def patch_solution(xml: str) -> str:
    # Version 1.0.0.0 → 1.0.0.1
    xml = re.sub(r'<Version>1\.0\.0\.0</Version>', '<Version>1.0.0.1</Version>', xml)

    # Neue RootComponents vor </RootComponents> einfügen (falls noch nicht drin)
    flow_roots = (
        f'\n      <RootComponent type="29" id="{{{GUID_DISPATCH}}}" behavior="0" />'
        f'\n      <RootComponent type="29" id="{{{GUID_ETA}}}" behavior="0" />'
    )
    if GUID_DISPATCH not in xml:
        xml = xml.replace('</RootComponents>', flow_roots + '\n    </RootComponents>')

    return xml


# ── customizations.xml: Flows in <Workflows> einfügen ────────────────────────
def patch_customizations(xml: str) -> str:
    if GUID_DISPATCH in xml:
        return xml  # schon drin

    workflow_xml = f"""
    <Workflow WorkflowId="{{{GUID_DISPATCH}}}" Name="Petra_DispatchAlgorithmus"
              UniqueName="Petra_DispatchAlgorithmus"
              Category="5" Subprocess="0" Mode="0" Scope="4"
              OnDemand="1" TriggerOnCreate="0" TriggerOnDelete="0"
              AsyncAutoBulkDelete="0" StateCode="1" IsCustomizable="1">
      <LocalizedNames>
        <LocalizedName description="Petra - Dispatch Algorithm" languagecode="1033" />
      </LocalizedNames>
      <Descriptions />
      <JsonFileName>/Workflows/Petra_DispatchAlgorithmus-{GUID_DISPATCH}.json</JsonFileName>
    </Workflow>
    <Workflow WorkflowId="{{{GUID_ETA}}}" Name="Petra_ETABerechnung"
              UniqueName="Petra_ETABerechnung"
              Category="5" Subprocess="0" Mode="0" Scope="4"
              OnDemand="1" TriggerOnCreate="0" TriggerOnDelete="0"
              AsyncAutoBulkDelete="0" StateCode="1" IsCustomizable="1">
      <LocalizedNames>
        <LocalizedName description="Petra - ETA Calculation" languagecode="1033" />
      </LocalizedNames>
      <Descriptions />
      <JsonFileName>/Workflows/Petra_ETABerechnung-{GUID_ETA}.json</JsonFileName>
    </Workflow>"""

    # Leeres <Workflows></Workflows> → mit Inhalt
    if '<Workflows></Workflows>' in xml:
        xml = xml.replace('<Workflows></Workflows>', f'<Workflows>{workflow_xml}\n  </Workflows>')
    elif '</Workflows>' in xml:
        xml = xml.replace('</Workflows>', workflow_xml + '\n  </Workflows>')

    # Keine ConnectionReferences – beide Flows brauchen keinen Connector

    return xml


# ── [Content_Types].xml: json-Einträge sicherstellen ─────────────────────────
def patch_content_types(xml: str) -> str:
    # Falls json noch nicht als Default drin ist
    if 'Extension="json"' not in xml:
        xml = xml.replace(
            '</Types>',
            '<Default Extension="json" ContentType="application/octet-stream" /></Types>'
        )
    return xml


# ── ZIP zusammenbauen ─────────────────────────────────────────────────────────
def build():
    print(f"Basis-ZIP:  {BASE_ZIP}")
    print(f"Output-ZIP: {OUT_ZIP}")
    print()

    dispatch_json = load_flow("Petra_DispatchAlgorithmus.json")
    eta_json      = load_flow("Petra_ETABerechnung.json")

    with zipfile.ZipFile(BASE_ZIP, "r") as base, \
         zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as out:

        for item in base.infolist():
            data = base.read(item.filename)

            if item.filename == "solution.xml":
                data = patch_solution(data.decode("utf-8")).encode("utf-8")
                print("  ✓ solution.xml  (Version → 1.0.0.1, Flows hinzugefügt)")

            elif item.filename == "customizations.xml":
                data = patch_customizations(data.decode("utf-8")).encode("utf-8")
                print("  ✓ customizations.xml  (2 Flows eingefügt)")

            elif item.filename == "[Content_Types].xml":
                data = patch_content_types(data.decode("utf-8")).encode("utf-8")
                print("  ✓ [Content_Types].xml")

            else:
                print(f"  ✓ {item.filename}  (unverändert)")

            out.writestr(item.filename, data)

        # Neue Workflow-JSONs
        d_name = f"Workflows/Petra_DispatchAlgorithmus-{GUID_DISPATCH}.json"
        out.writestr(d_name, dispatch_json)
        print(f"  ✓ {d_name}  (NEU)")

        e_name = f"Workflows/Petra_ETABerechnung-{GUID_ETA}.json"
        out.writestr(e_name, eta_json)
        print(f"  ✓ {e_name}  (NEU)")

    size_kb = os.path.getsize(OUT_ZIP) // 1024
    print(f"\n✅ Fertig! {OUT_ZIP}  ({size_kb} KB)")
    print()
    print("Import als Update:")
    print("  make.powerapps.com → Solutions → Petra → ··· → Lösung importieren")
    print("  → Datei: out/Petra_1_0_0_1.zip  → Weiter → Importieren")
    print()
    print("Enthält zusätzlich zu den Canvas Apps:")
    print("  • Petra - Dispatch Algorithm  (Power Automate Flow)")
    print("  • Petra - ETA Calculation     (Power Automate Flow)")


if __name__ == "__main__":
    build()
