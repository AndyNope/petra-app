#!/usr/bin/env python3
"""
Petra Vorfeld Taxi – Power Platform Solution ZIP Builder
Erzeugt out/PetraVorfeldTaxi.zip ohne pac-CLI.
Import via: make.powerapps.com → Solutions → Import
"""

import json
import os
import uuid
import zipfile
from datetime import datetime, timezone

# ─── Feste GUIDs (stabil, reproduzierbar) ─────────────────────────────────────
GUID_DISPATCH  = "a1b2c3d4-e5f6-7890-abcd-ef1234567801"
GUID_ETA       = "a1b2c3d4-e5f6-7890-abcd-ef1234567802"
GUID_TAXI_ENT  = "a1b2c3d4-e5f6-7890-abcd-ef1234567803"
GUID_TRIP_ENT  = "a1b2c3d4-e5f6-7890-abcd-ef1234567804"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR    = os.path.join(SCRIPT_DIR, "src")
OUT_DIR    = os.path.join(SCRIPT_DIR, "out")
OUT_ZIP    = os.path.join(OUT_DIR, "PetraVorfeldTaxi.zip")
NOW        = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

os.makedirs(OUT_DIR, exist_ok=True)


# ─── 1. solution.xml (unverändert aus src/Other/) ─────────────────────────────
def solution_xml() -> str:
    path = os.path.join(SRC_DIR, "Other", "Solution.xml")
    with open(path, encoding="utf-8") as f:
        return f.read()


# ─── 2. [Content_Types].xml ───────────────────────────────────────────────────
def content_types_xml() -> str:
    return """<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml"  ContentType="application/xml" />
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="msapp" ContentType="application/zip" />
  <Override PartName="/solution.xml"       ContentType="application/xml" />
  <Override PartName="/customizations.xml" ContentType="application/xml" />
</Types>"""


# ─── 3. customizations.xml ────────────────────────────────────────────────────
#  Power Platform erwartet hier Entitäten und Optionssätze.
#  Flows werden nur referenziert (eigentliche Definition in Workflows/).
def customizations_xml() -> str:
    # Option-Set-Werte
    zones = [
        (100000000, "E"), (100000001, "F"), (100000002, "H"), (100000003, "I"),
        (100000004, "A"), (100000005, "B"), (100000006, "C"), (100000007, "D"),
        (100000008, "T"), (100000009, "G"), (100000010, "P"), (100000011, "W"),
    ]
    zone_options = "\n".join(
        f"""        <option value="{v}">
          <Labels><Label description="{z}" languagecode="1031" /></Labels>
        </option>"""
        for v, z in zones
    )

    status_options = """        <option value="100000000">
          <Labels><Label description="Ausstehend" languagecode="1031" /></Labels>
        </option>
        <option value="100000001">
          <Labels><Label description="Angenommen" languagecode="1031" /></Labels>
        </option>
        <option value="100000002">
          <Labels><Label description="Abgeschlossen" languagecode="1031" /></Labels>
        </option>
        <option value="100000003">
          <Labels><Label description="Storniert" languagecode="1031" /></Labels>
        </option>"""

    return f"""<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml version="9.0.0.0007" SolutionPackageVersion="9.1" languagecode="1031">

  <!-- ══ Globale Optionssätze ══════════════════════════════════════════════ -->
  <optionsets>

    <optionset Name="petra_zone" localizedName="Zone" IsCustomOptionSet="1" IsManaged="0" IsGlobal="1">
      <OptionSetType>picklist</OptionSetType>
      <IsCustomizable>1</IsCustomizable>
      <LocalizedNames>
        <LocalizedName description="Zone" languagecode="1031" />
      </LocalizedNames>
      <Descriptions>
        <Description description="Vorfeld-Zonen am Flughafen Zürich (Platzkette E–W)" languagecode="1031" />
      </Descriptions>
      <options>
{zone_options}
      </options>
    </optionset>

    <optionset Name="petra_tripstatus" localizedName="Fahrt-Status" IsCustomOptionSet="1" IsManaged="0" IsGlobal="1">
      <OptionSetType>picklist</OptionSetType>
      <IsCustomizable>1</IsCustomizable>
      <LocalizedNames>
        <LocalizedName description="Fahrt-Status" languagecode="1031" />
      </LocalizedNames>
      <options>
{status_options}
      </options>
    </optionset>

  </optionsets>

  <!-- ══ Entitäten ═════════════════════════════════════════════════════════ -->
  <Entities>

    <!-- petra_taxi -->
    <Entity>
      <EntityInfo>
        <entity Name="petra_taxi" CollectionSchemaName="petra_taxis"
                EntitySetName="petra_taxis"
                OwnershipType="UserOwned"
                IsActivity="0" IsCustomizable="1"
                IsEnabledForCharts="1" IsValidForAdvancedFind="1"
                IsVisibleInMobileClient="1" IsQuickCreateEnabled="1">
          <LocalizedNames>
            <LocalizedName description="Taxi" languagecode="1031" />
          </LocalizedNames>
          <LocalizedCollectionNames>
            <LocalizedCollectionName description="Taxis" languagecode="1031" />
          </LocalizedCollectionNames>
          <attributes>
            <attribute PhysicalName="petra_taxiid">
              <Type>Uniqueidentifier</Type><Name>petra_taxiid</Name>
              <IsCustomField>1</IsCustomField><IsPrimaryId>1</IsPrimaryId><IsPrimaryName>0</IsPrimaryName>
              <ValidForCreateApi>0</ValidForCreateApi><ValidForUpdateApi>0</ValidForUpdateApi>
              <RequiredLevel>SystemRequired</RequiredLevel>
              <LocalizedNames><LocalizedName description="Taxi-ID" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_name">
              <Type>String</Type><Name>petra_name</Name>
              <IsCustomField>1</IsCustomField><IsPrimaryId>0</IsPrimaryId><IsPrimaryName>1</IsPrimaryName>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>ApplicationRequired</RequiredLevel>
              <MaxLength>100</MaxLength><Format>Text</Format>
              <LocalizedNames><LocalizedName description="Funk-ID" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_position">
              <Type>Picklist</Type><Name>petra_position</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>ApplicationRequired</RequiredLevel>
              <OptionSetName>petra_zone</OptionSetName>
              <LocalizedNames><LocalizedName description="Position (Zone)" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_capacity">
              <Type>Integer</Type><Name>petra_capacity</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel>
              <DefaultValue>8</DefaultValue><MinValue>1</MinValue><MaxValue>20</MaxValue>
              <LocalizedNames><LocalizedName description="Kapazität (Personen)" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_occupied">
              <Type>Integer</Type><Name>petra_occupied</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel>
              <DefaultValue>0</DefaultValue><MinValue>0</MinValue><MaxValue>20</MaxValue>
              <LocalizedNames><LocalizedName description="Belegte Plätze" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_active">
              <Type>Boolean</Type><Name>petra_active</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel><DefaultValue>1</DefaultValue>
              <LocalizedNames><LocalizedName description="Aktiv" languagecode="1031" /></LocalizedNames>
              <FalseOption><LocalizedLabels><LocalizedLabel description="Inaktiv" languagecode="1031" /></LocalizedLabels></FalseOption>
              <TrueOption><LocalizedLabels><LocalizedLabel description="Aktiv" languagecode="1031" /></LocalizedLabels></TrueOption>
            </attribute>
            <attribute PhysicalName="petra_lastseen">
              <Type>DateTime</Type><Name>petra_lastseen</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel><Format>DateAndTime</Format>
              <LocalizedNames><LocalizedName description="Zuletzt gesehen" languagecode="1031" /></LocalizedNames>
            </attribute>
          </attributes>
        </entity>
      </EntityInfo>
      <EntityRelationships />
      <RibbonDiffXml />
      <EntitySetName>petra_taxis</EntitySetName>
    </Entity>

    <!-- petra_trip -->
    <Entity>
      <EntityInfo>
        <entity Name="petra_trip" CollectionSchemaName="petra_trips"
                EntitySetName="petra_trips"
                OwnershipType="UserOwned"
                IsActivity="0" IsCustomizable="1"
                IsEnabledForCharts="1" IsValidForAdvancedFind="1"
                IsVisibleInMobileClient="1" IsQuickCreateEnabled="1">
          <LocalizedNames>
            <LocalizedName description="Fahrt" languagecode="1031" />
          </LocalizedNames>
          <LocalizedCollectionNames>
            <LocalizedCollectionName description="Fahrten" languagecode="1031" />
          </LocalizedCollectionNames>
          <attributes>
            <attribute PhysicalName="petra_tripid">
              <Type>Uniqueidentifier</Type><Name>petra_tripid</Name>
              <IsCustomField>1</IsCustomField><IsPrimaryId>1</IsPrimaryId><IsPrimaryName>0</IsPrimaryName>
              <ValidForCreateApi>0</ValidForCreateApi><ValidForUpdateApi>0</ValidForUpdateApi>
              <RequiredLevel>SystemRequired</RequiredLevel>
              <LocalizedNames><LocalizedName description="Fahrt-ID" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_name">
              <Type>String</Type><Name>petra_name</Name>
              <IsCustomField>1</IsCustomField><IsPrimaryId>0</IsPrimaryId><IsPrimaryName>1</IsPrimaryName>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>ApplicationRequired</RequiredLevel>
              <MaxLength>100</MaxLength><Format>Text</Format>
              <LocalizedNames><LocalizedName description="Auftragsnummer" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_taxi">
              <Type>Lookup</Type><Name>petra_taxi</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel>
              <LookupStyle>single</LookupStyle><Targets>petra_taxi</Targets>
              <LocalizedNames><LocalizedName description="Taxi" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_pickupzone">
              <Type>Picklist</Type><Name>petra_pickupzone</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>ApplicationRequired</RequiredLevel>
              <OptionSetName>petra_zone</OptionSetName>
              <LocalizedNames><LocalizedName description="Abholzone" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_dropoffzone">
              <Type>Picklist</Type><Name>petra_dropoffzone</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>ApplicationRequired</RequiredLevel>
              <OptionSetName>petra_zone</OptionSetName>
              <LocalizedNames><LocalizedName description="Zielzone" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_passengers">
              <Type>Integer</Type><Name>petra_passengers</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>ApplicationRequired</RequiredLevel>
              <DefaultValue>1</DefaultValue><MinValue>1</MinValue><MaxValue>20</MaxValue>
              <LocalizedNames><LocalizedName description="Personenanzahl" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_status">
              <Type>Picklist</Type><Name>petra_status</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>ApplicationRequired</RequiredLevel>
              <OptionSetName>petra_tripstatus</OptionSetName>
              <DefaultValue>100000000</DefaultValue>
              <LocalizedNames><LocalizedName description="Status" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_overflowwarning">
              <Type>Boolean</Type><Name>petra_overflowwarning</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel><DefaultValue>0</DefaultValue>
              <LocalizedNames><LocalizedName description="Überlastungswarnung" languagecode="1031" /></LocalizedNames>
              <FalseOption><LocalizedLabels><LocalizedLabel description="Nein" languagecode="1031" /></LocalizedLabels></FalseOption>
              <TrueOption><LocalizedLabels><LocalizedLabel description="Ja (Überlastet)" languagecode="1031" /></LocalizedLabels></TrueOption>
            </attribute>
            <attribute PhysicalName="petra_acceptedat">
              <Type>DateTime</Type><Name>petra_acceptedat</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel><Format>DateAndTime</Format>
              <LocalizedNames><LocalizedName description="Angenommen um" languagecode="1031" /></LocalizedNames>
            </attribute>
            <attribute PhysicalName="petra_completedat">
              <Type>DateTime</Type><Name>petra_completedat</Name>
              <IsCustomField>1</IsCustomField>
              <ValidForCreateApi>1</ValidForCreateApi><ValidForUpdateApi>1</ValidForUpdateApi>
              <RequiredLevel>None</RequiredLevel><Format>DateAndTime</Format>
              <LocalizedNames><LocalizedName description="Abgeschlossen um" languagecode="1031" /></LocalizedNames>
            </attribute>
          </attributes>
        </entity>
      </EntityInfo>
      <EntityRelationships />
      <RibbonDiffXml />
      <EntitySetName>petra_trips</EntitySetName>
    </Entity>

  </Entities>

  <!-- ══ Workflow-Referenzen (Definitionen in Workflows/*.json) ════════════ -->
  <Workflows>
    <Workflow WorkflowId="{{{GUID_DISPATCH}}}" Name="Petra_DispatchAlgorithmus"
              UniqueName="Petra_DispatchAlgorithmus"
              Category="5" Subprocess="0" Mode="0" Scope="4"
              OnDemand="1" TriggerOnCreate="0" TriggerOnDelete="0"
              AsyncAutoBulkDelete="0" StateCode="1">
      <LocalizedNames>
        <LocalizedName description="Petra - Dispatch-Algorithmus" languagecode="1031" />
      </LocalizedNames>
      <Descriptions>
        <Description description="Berechnet das optimale Taxi anhand der Platzkette E-W." languagecode="1031" />
      </Descriptions>
      <JsonFileName>/Workflows/Petra_DispatchAlgorithmus-{GUID_DISPATCH}.json</JsonFileName>
    </Workflow>
    <Workflow WorkflowId="{{{GUID_ETA}}}" Name="Petra_ETABerechnung"
              UniqueName="Petra_ETABerechnung"
              Category="5" Subprocess="0" Mode="0" Scope="4"
              OnDemand="1" TriggerOnCreate="0" TriggerOnDelete="0"
              AsyncAutoBulkDelete="0" StateCode="1">
      <LocalizedNames>
        <LocalizedName description="Petra - ETA-Berechnung" languagecode="1031" />
      </LocalizedNames>
      <Descriptions>
        <Description description="Berechnet die Ankunftszeit in Minuten." languagecode="1031" />
      </Descriptions>
      <JsonFileName>/Workflows/Petra_ETABerechnung-{GUID_ETA}.json</JsonFileName>
    </Workflow>
  </Workflows>

  <Roles />
  <FieldSecurityProfiles />
  <Templates />
  <EntityMaps />
  <EntityRelationships />
  <OrganizationSettings />
  <CustomControls />
  <EntityDataProviders />
  <canvasApps />
  <systemforms />
  <dashboards />
  <savedqueries />

</ImportExportXml>
"""


# ─── 4. Workflow-JSONs für Solution (Properties-Format) ───────────────────────
def load_flow_json(filename: str) -> dict:
    path = os.path.join(SRC_DIR, "Workflows", filename)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def wrap_flow_for_solution(raw: dict) -> str:
    """
    Power Platform erwartet in Workflows/*.json das 'properties'-Objekt
    mit 'definition' und 'connectionReferences'.
    """
    props = raw.get("properties", raw)
    wrapped = {
        "properties": {
            "connectionReferences": props.get("connectionReferences",
                raw.get("definition", {}).get("connectionReferences", {})),
            "definition": props.get("definition",
                raw.get("definition", {})),
            "displayName": props.get("displayName",
                raw.get("name", "Petra Flow")),
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
        print("  ✓ customizations.xml  (2 Tabellen + 2 Optionssätze + 2 Flow-Refs)")

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
    print("  • 2 Dataverse-Tabellen  (petra_taxi, petra_trip)")
    print("  • 2 Optionssätze        (petra_zone, petra_tripstatus)")
    print("  • 2 Power Automate Flows (Dispatch-Algorithmus, ETA-Berechnung)")
    print()
    print("Hinweis: Canvas App (.msapp) erfordert 'pac canvas pack'.")
    print("  Installiere pac: https://aka.ms/pp/cli")
    print("  Dann: cd powerapps-solution && ./pack.sh")


if __name__ == "__main__":
    build_zip()
