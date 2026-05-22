# Petra Taxi Dispatch - Power Platform Solution

**Complete multi-tenant, no-premium Taxi Dispatch System built on Power Platform**

[![Status](https://img.shields.io/badge/status-Production%20Ready-green?style=flat-square)](EXPORT_LOCATION.md)
[![Version](https://img.shields.io/badge/version-1.1.0.0-blue?style=flat-square)](EXPORT_LOCATION.md)
[![License](https://img.shields.io/badge/license-No%20Premium%20Required-brightgreen?style=flat-square)](docs/PETRA_MULTI_TENANT_IMPORT_GUIDE.md)

---

## 🎯 What is Petra?

Petra is a taxi dispatch and management system that replicates the functionality of petra.andynope.com as a native Power Platform application.

**Key Features:**
- 3 user roles: Dispatch, Taxi Driver, Employee
- Real-time trip tracking and assignment
- Zone-based taxi management (12 zones: A-P, E-W)
- SharePoint-based data storage
- Power Automate flow automation
- 100% no-premium (standard connectors only)

---

## 🚀 Quick Start

### 1. Import Solution
```bash
pac solution import --path artifacts/PetraFlowPlatform_solution.zip
```

### 2. Read Quick Start Guide
👉 **[artifacts/QUICK_START.md](artifacts/QUICK_START.md)**

### 3. Deploy in Any Tenant
See full deployment guide: **[docs/PETRA_MULTI_TENANT_IMPORT_GUIDE.md](docs/PETRA_MULTI_TENANT_IMPORT_GUIDE.md)**

---

## 📦 What's Included

```
artifacts/
├── PetraFlowPlatform_solution.zip  ← ⭐ MAIN FILE TO IMPORT
├── Petra_no_premium.msapp          (Canvas app backup)
├── QUICK_START.md                   (5-minute setup)
└── README.md                        (Overview)

docs/
└── PETRA_MULTI_TENANT_IMPORT_GUIDE.md  (Full documentation)

EXPORT_LOCATION.md                   (This file)
```

---

## ✅ Solution Features

| Feature | Included | Premium? |
|---------|----------|----------|
| Canvas App | ✅ | ❌ |
| Dispatch Role | ✅ | ❌ |
| Taxi Role | ✅ | ❌ |
| Employee Role | ✅ | ❌ |
| SharePoint Data | ✅ | ❌ |
| Power Automate Flows | ✅ | ❌ |
| Zone Management | ✅ | ❌ |
| Trip Tracking | ✅ | ❌ |
| Real-time Updates | ✅ (5-10 min) | ❌ |

---

## 🔄 Multi-Tenant Deployment

This solution is designed for easy deployment across multiple tenants:

✅ No hard-coded environment variables  
✅ No custom connectors  
✅ No premium licenses required  
✅ Unmanaged solution = fully customizable  
✅ Works with standard Power Platform features only  

**Tested in:** Default environment + DEV environment

---

## 📚 Documentation

- **[EXPORT_LOCATION.md](EXPORT_LOCATION.md)** - Where to find the solution
- **[artifacts/QUICK_START.md](artifacts/QUICK_START.md)** - 5-minute setup guide
- **[artifacts/README.md](artifacts/README.md)** - Solution overview
- **[docs/PETRA_MULTI_TENANT_IMPORT_GUIDE.md](docs/PETRA_MULTI_TENANT_IMPORT_GUIDE.md)** - Complete deployment guide

---

## 🏗️ Project Structure

```
petra-app-powerapps/
├── artifacts/                           # Deployment files
│   ├── PetraFlowPlatform_solution.zip   # ⭐ Main solution
│   ├── Petra_no_premium.msapp           # Canvas app backup
│   ├── QUICK_START.md                   # Quick setup
│   └── README.md                        # Overview
│
├── docs/                                # Documentation
│   ├── PETRA_MULTI_TENANT_IMPORT_GUIDE.md
│   └── powerapps-playbook.md
│
├── PetraPlatformSolution/               # MSBuild solution source
│   ├── PetraPlatformSolution.cdsproj
│   ├── src/
│   │   ├── CanvasApps/                  # Canvas app definition
│   │   ├── Other/                       # Solution metadata
│   │   └── Connectors/                  # (empty - no premium)
│   └── bin/Debug/
│       └── PetraPlatformSolution.zip    # Built solution
│
├── PetraLiveSource/                     # Canvas app source (YAML)
│   └── Src/
│       ├── App.pa.yaml
│       ├── DispatchScreen.pa.yaml
│       ├── TaxiScreen.pa.yaml
│       └── EmployeeScreen.pa.yaml
│
├── frontend/                            # Original React webapp
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/                             # PHP backend (legacy)
│   ├── api/
│   ├── middleware/
│   └── ...
│
├── EXPORT_LOCATION.md                   # ← Start here
└── README.md                            # This file
```

---

## 🛠️ Building from Source

If you want to build the solution yourself:

```bash
cd PetraPlatformSolution
dotnet build PetraPlatformSolution.cdsproj -c Debug
# Output: bin/Debug/PetraPlatformSolution.zip
```

---

## 🔐 Security & Compliance

- ✅ No premium connectors (no special permissions required)
- ✅ Unmanaged solution (full audit trail)
- ✅ Standard SharePoint data storage
- ✅ Power Automate flow logs available
- ✅ Multi-tenant isolation via SharePoint sites

---

## 📊 Architecture

```
Power Apps (Canvas)
    ↓
SharePoint Lists (PetraTaxis, PetraTrips)
    ↓
Power Automate Flows (PetraAcceptTrip, PetraCompleteTrip)
    ↓
Data persisted in SharePoint Online
```

**No:** Premium connectors, Dataverse, custom APIs, or custom code required

---

## ✨ Tested Scenarios

- ✅ Import in default environment
- ✅ Import in DEV sandbox
- ✅ App opens in Studio without errors
- ✅ Flows trigger correctly
- ✅ Data persists to SharePoint
- ✅ All 3 roles functional
- ✅ Multi-tenant deployment

---

## 🚨 Known Limitations (No Premium)

| Limitation | Reason | Workaround |
|-----------|--------|-----------|
| 5-10 min data lag | SharePoint polling | Increase refresh frequency |
| Max 2000 items | SharePoint delegation | Implement pagination |
| No offline sync | Standard connectors | N/A |
| No advanced analytics | No Power BI Embedded | Export to Excel |

---

## 📞 Support

For detailed setup help:
1. Check **[QUICK_START.md](artifacts/QUICK_START.md)**
2. See **[PETRA_MULTI_TENANT_IMPORT_GUIDE.md](docs/PETRA_MULTI_TENANT_IMPORT_GUIDE.md)**
3. Review solution metadata in **[artifacts/README.md](artifacts/README.md)**

---

## 📝 Version History

### v1.1.0.0 (2026-05-22)
- ✅ Removed premium Petra API connector
- ✅ Rebuilt with SharePoint backend
- ✅ Created Power Automate flows
- ✅ Tested multi-tenant import
- ✅ Published production-ready solution

### v1.0.0.0 (earlier)
- Initial development with premium connector

---

## 📄 License

This solution uses only standard Power Platform connectors and requires no special licenses beyond standard Power Apps/Power Automate plans.

---

**🎯 Ready to deploy. See [EXPORT_LOCATION.md](EXPORT_LOCATION.md) for next steps.**
