#!/usr/bin/env python3
"""
Petra Vorfeld Taxi – Power Platform Solution ZIP Builder
Erzeugt out/PetraVorfeldTaxi.zip ohne pac-CLI.
Struktur basiert auf einem echten Power Platform Export (Petra_1_0_0_0.zip).
Import via: make.powerapps.com → Solutions → Import
"""

import json
import os
import zipfile

# ─── Feste GUIDs (stabil, reproduzierbar) ─────────────────────────────────────
GUID_DISPATCH  = "a1b2c3d4-e5f6-7890-abcd-ef1234567801"
GUID_ETA       = "a1b2c3d4-e5f6-7890-abcd-ef1234567802"
GUID_OS_ZONE   = "a1b2c3d4-e5f6-7890-abcd-ef1234567805"
GUID_OS_STATUS = "a1b2c3d4-e5f6-7890-abcd-ef1234567806"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR    = os.path.join(SCRIPT_DIR, "src")
OUT_DIR    = os.path.join(SCRIPT_DIR, "out")
OUT_ZIP    = os.path.join(OUT_DIR, "PetraVorfeldTaxi.zip")

os.makedirs(OUT_DIR, exist_ok=True)


# ─── 1. [Content_Types].xml ───────────────────────────────────────────────────
# Format exakt aus echtem Power Platform Export: ContentType = application/octet-stream
def content_types_xml() -> str:
    return (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="xml" ContentType="application/octet-stream" />'
        '<Default Extension="json" ContentType="application/octet-stream" />'
        '</Types>'
    )


# ─── 2. solution.xml ──────────────────────────────────────────────────────────
# Format exakt aus echtem Export: version 9.2, xmlns:xsi, xsi:nil für leere Felder,
# zwei Address-Einträge, languagecode="1033"
def solution_xml() -> str:
    def addr(num):
        return f"""
        <Address>
          <AddressNumber>{num}</AddressNumber>
          <AddressTypeCode>1</AddressTypeCode>
          <City xsi:nil="true"></City>
          <County xsi:nil="true"></County>
          <Country xsi:nil="true"></Country>
          <Fax xsi:nil="true"></Fax>
          <FreightTermsCode xsi:nil="true"></FreightTermsCode>
          <ImportSequenceNumber xsi:nil="true"></ImportSequenceNumber>
          <Latitude xsi:nil="true"></Latitude>
          <Line1 xsi:nil="true"></Line1>
          <Line2 xsi:nil="true"></Line2>
          <Line3 xsi:nil="true"></Line3>
          <Longitude xsi:nil="true"></Longitude>
          <Name xsi:nil="true"></Name>
          <PostalCode xsi:nil="true"></PostalCode>
          <PostOfficeBox xsi:nil="true"></PostOfficeBox>
          <PrimaryContactName xsi:nil="true"></PrimaryContactName>
          <ShippingMethodCode>1</ShippingMethodCode>
          <StateOrProvince xsi:nil="true"></StateOrProvince>
          <Telephone1 xsi:nil="true"></Telephone1>
          <Telephone2 xsi:nil="true"></Telephone2>
          <Telephone3 xsi:nil="true"></Telephone3>
          <TimeZoneRuleVersionNumber xsi:nil="true"></TimeZoneRuleVersionNumber>
          <UPSZone xsi:nil="true"></UPSZone>
          <UTCOffset xsi:nil="true"></UTCOffset>
          <UTCConversionTimeZoneCode xsi:nil="true"></UTCConversionTimeZoneCode>
        </Address>"""

    return f"""<ImportExportXml version="9.2.26031.175" SolutionPackageVersion="9.2" languagecode="1033" generatedBy="CrmLive" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <SolutionManifest>
    <UniqueName>PetraVorfeldTaxi</UniqueName>
    <LocalizedNames>
      <LocalizedName description="Petra Vorfeld Taxi" languagecode="1033" />
    </LocalizedNames>
    <Descriptions>
      <Description description="Digital dispatch system for apron taxis at Zurich Airport" languagecode="1033" />
    </Descriptions>
    <Version>1.0.0.0</Version>
    <Managed>0</Managed>
    <Publisher>
      <UniqueName>PetraPublisher</UniqueName>
      <LocalizedNames>
        <LocalizedName description="Petra Publisher" languagecode="1033" />
      </LocalizedNames>
      <Descriptions />
      <EMailAddress xsi:nil="true"></EMailAddress>
      <SupportingWebsiteUrl xsi:nil="true"></SupportingWebsiteUrl>
      <CustomizationPrefix>petra</CustomizationPrefix>
      <CustomizationOptionValuePrefix>10000</CustomizationOptionValuePrefix>
      <Addresses>{addr(1)}{addr(2)}
      </Addresses>
    </Publisher>
    <RootComponents>
      <RootComponent type="9" schemaName="petra_zone" behavior="0" />
      <RootComponent type="9" schemaName="petra_tripstatus" behavior="0" />
      <RootComponent type="29" id="{{{GUID_DISPATCH}}}" behavior="0" />
      <RootComponent type="29" id="{{{GUID_ETA}}}" behavior="0" />
    </RootComponents>
    <MissingDependencies />
  </SolutionManifest>
</ImportExportXml>"""


# ─── 3. customizations.xml ────────────────────────────────────────────────────
# Format exakt aus echtem Export: kein version-Attribut auf Root-Element,
# OrganizationVersion + OrganizationSchemaType, xmlns:xsi, Languages am Ende.
# Entitäten (petra_taxi, petra_trip) sind NICHT enthalten — müssen manuell in
# Dataverse erstellt werden (komplexes XML erfordert pac CLI).
def customizations_xml() -> str:
    zones = [
        (100000000, "E"), (100000001, "F"), (100000002, "H"), (100000003, "I"),
        (100000004, "A"), (100000005, "B"), (100000006, "C"), (100000007, "D"),
        (100000008, "T"), (100000009, "G"), (100000010, "P"), (100000011, "W"),
    ]
    zone_options = "\n".join(
        f"""        <option value="{v}">
          <Labels><Label description="{z}" languagecode="1033" /></Labels>
        </option>"""
        for v, z in zones
    )

    status_options = """        <option value="100000000">
          <Labels><Label description="Pending" languagecode="1033" /></Labels>
        </option>
        <option value="100000001">
          <Labels><Label description="Accepted" languagecode="1033" /></Labels>
        </option>
        <option value="100000002">
          <Labels><Label description="Completed" languagecode="1033" /></Labels>
        </option>
        <option value="100000003">
          <Labels><Label description="Cancelled" languagecode="1033" /></Labels>
        </option>"""

    return f"""<ImportExportXml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" OrganizationVersion="9.2.26031.175" OrganizationSchemaType="Standard">
  <Entities></Entities>
  <Roles></Roles>
  <Workflows>
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
    </Workflow>
  </Workflows>
  <FieldSecurityProfiles></FieldSecurityProfiles>
  <Templates />
  <EntityMaps />
  <EntityRelationships />
  <OrganizationSettings />
  <optionsets>

    <optionset Name="petra_zone" localizedName="Zone" IsCustomOptionSet="1"
               IsManaged="0" IsGlobal="1">
      <OptionSetType>picklist</OptionSetType>
      <IsCustomizable>1</IsCustomizable>
      <LocalizedNames>
        <LocalizedName description="Zone" languagecode="1033" />
      </LocalizedNames>
      <Descriptions />
      <options>
{zone_options}
      </options>
    </optionset>

    <optionset Name="petra_tripstatus" localizedName="Trip Status" IsCustomOptionSet="1"
               IsManaged="0" IsGlobal="1">
      <OptionSetType>picklist</OptionSetType>
      <IsCustomizable>1</IsCustomizable>
      <LocalizedNames>
        <LocalizedName description="Trip Status" languagecode="1033" />
      </LocalizedNames>
      <Descriptions />
      <options>
{status_options}
      </options>
    </optionset>

  </optionsets>
  <CustomControls />
  <EntityDataProviders />
  <CanvasApps></CanvasApps>
  <Languages>
    <Language>1033</Language>
  </Languages>
</ImportExportXml>"""


# ─── 4. Flow-JSONs ────────────────────────────────────────────────────────────
def load_flow_json(filename: str) -> dict:
    path = os.path.join(SRC_DIR, "Workflows", filename)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def wrap_flow_for_solution(raw: dict) -> str:
    props = raw.get("properties", raw)
    wrapped = {
        "properties": {
            "connectionReferences": props.get("connectionReferences", {}),
            "definition": props.get("definition", raw.get("definition", {})),
            "displayName": props.get("displayName", raw.get("name", "Petra Flow")),
            "description": props.get("description", ""),
            "environment": {},
            "isAuthenticationRequired": False,
            "enabledState": "enabled",
        }
    }
    return json.dumps(wrapped, ensure_ascii=False, indent=2)


# ─── 5. ZIP zusammenbauen ─────────────────────────────────────────────────────
def build_zip():
    print(f"Baue Solution-ZIP: {OUT_ZIP}")

    dispatch_raw = load_flow_json("Petra_DispatchAlgorithmus.json")
    eta_raw      = load_flow_json("Petra_ETABerechnung.json")

    with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:

        zf.writestr("[Content_Types].xml", content_types_xml())
        print("  ✓ [Content_Types].xml")

        zf.writestr("solution.xml", solution_xml())
        print("  ✓ solution.xml")

        zf.writestr("customizations.xml", customizations_xml())
        print("  ✓ customizations.xml  (2 Optionssätze + 2 Flow-Refs)")

        dispatch_name = f"Petra_DispatchAlgorithmus-{GUID_DISPATCH}.json"
        zf.writestr(f"Workflows/{dispatch_name}", wrap_flow_for_solution(dispatch_raw))
        print(f"  ✓ Workflows/{dispatch_name}")

        eta_name = f"Petra_ETABerechnung-{GUID_ETA}.json"
        zf.writestr(f"Workflows/{eta_name}", wrap_flow_for_solution(eta_raw))
        print(f"  ✓ Workflows/{eta_name}")

    size_kb = os.path.getsize(OUT_ZIP) // 1024
    print(f"\n✅ Fertig! ZIP: {OUT_ZIP}  ({size_kb} KB)")
    print()
    print("Import:")
    print("  https://make.powerapps.com → Solutions → Importieren → Datei hochladen")
    print()
    print("Enthält:")
    print("  • 2 Globale Optionssätze  (petra_zone, petra_tripstatus)")
    print("  • 2 Power Automate Flows  (Dispatch-Algorithmus, ETA-Berechnung)")
    print()
    print("WICHTIG – Dataverse-Tabellen manuell erstellen:")
    print("  make.powerapps.com → Dataverse → Tabellen → Neue Tabelle")
    print("  petra_taxi : Funk-ID (Text), Position (petra_zone), Kapazitaet (Zahl), Belegte Plaetze (Zahl), Aktiv (Ja/Nein)")
    print("  petra_trip : Auftragsnummer (Text), Taxi (Lookup→petra_taxi), Abholzone (petra_zone),")
    print("               Zielzone (petra_zone), Passagiere (Zahl), Status (petra_tripstatus)")


if __name__ == "__main__":
    build_zip()
