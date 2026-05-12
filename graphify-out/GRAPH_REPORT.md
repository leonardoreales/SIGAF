# Graph Report - SIGAF  (2026-05-12)

## Corpus Check
- 155 files · ~982,319 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 733 nodes · 1212 edges · 37 communities (35 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b475cec5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 33 edges
2. `useAuth()` - 17 edges
3. `useRole()` - 12 edges
4. `process_row()` - 10 edges
5. `Architecture` - 10 edges
6. `Architecture` - 10 edges
7. `pool` - 9 edges
8. `SseManager` - 9 edges
9. `useTheme()` - 9 edges
10. `db` - 8 edges

## Surprising Connections (you probably didn't know these)
- `StatusBadge()` --calls--> `cn()`  [EXTRACTED]
  Frontend/web/src/pages/transfers/RequestsTable.tsx → Frontend/web/src/lib/utils.ts
- `TransferFormModal()` --calls--> `cn()`  [EXTRACTED]
  Frontend/web/src/pages/transfers/TransferFormModal.tsx → Frontend/web/src/lib/utils.ts
- `MiniKpi()` --calls--> `cn()`  [EXTRACTED]
  Frontend/web/src/pages/transfers/TransfersPage.tsx → Frontend/web/src/lib/utils.ts
- `sign()` --calls--> `signTransferRequest()`  [EXTRACTED]
  Backend/api/src/interfaces/http/transferRequests.controller.ts → Backend/api/src/application/transferRequests/signTransferRequest.ts
- `Layout()` --calls--> `useAuth()`  [EXTRACTED]
  Frontend/web/src/components/Layout.tsx → Frontend/web/src/context/AuthContext.tsx

## Communities (37 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (36): db, pool, assets, catalogCities, maintenanceExecutions, maintenanceSchedules, maintenanceSupports, systemUsers (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (44): BatchFields, BatchHeader(), Props, ExpansionMode, Props, CellId, COL_ORDER, ColKey (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (34): createSyncEvent(), getLastSyncEvent(), listSyncEvents(), SyncRow, toSyncEvent(), router, router, router (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (41): ActiveChip(), AssetsFilters(), FilterFields, FilterSelect(), Props, SelectProps, STATUS_OPTIONS, YEAR_OPTIONS (+33 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (55): ASSET_TYPE_SERIAL_RULES, AssetFilter, AssetFilterSchema, AssetStatus, AssetStatusSchema, AssetTypeCode, AssetTypeCodeSchema, CreateAsset (+47 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (30): AssetsPage(), DEFAULT_FILTERS, FiltersState, Props, YEAR_OPTIONS, Props, ActivityMeta, EntryRow() (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (26): createAsset(), deleteAsset(), getAdvancedStats(), getAsset(), getStats(), listAssets(), updateAsset(), BASE_FIELDS (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (29): transferRequestItems, transferRequests, buildWhere(), create(), findById(), findMany(), generateRequestNumber(), getInitialStatus() (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (19): listAreas(), listAreasByBuilding(), listAssetTypes(), listBuildings(), listPeople(), findAreas(), findAreasByBuilding(), findAssetTypes() (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (14): writeoffActs, create(), findById(), update(), create(), getOne(), list(), stats() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (12): CRITICALITY_OPTIONS, Draft, fmtCOP(), MAINTENANCE_OPTIONS, Mode, Props, STATUS_LABELS, STATUS_OPTIONS (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (17): ImportsDrawerProps, apiSyncs, AssetListResponse, AssetStats, CreateTransferPayload, TransferListResponse, TransferRequestItem, TransferRequestItemStatus (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.1
Nodes (19): Architecture, Authentication flow, Backend: Clean Architecture layers, code:bash (# From monorepo root), code:bash (# Run SQL migrations manually via psql or Supabase dashboard), code:bash (npm install          # Root installs all workspaces (shared,), code:block4 (shared/                  → Zod schemas shared between backen), Commands (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.1
Nodes (19): Architecture, Authentication flow, Backend: Clean Architecture layers, code:bash (# From monorepo root), code:bash (# Run SQL migrations manually via psql or Supabase dashboard), code:bash (npm install          # Root installs all workspaces (shared,), code:block4 (shared/                  → Zod schemas shared between backen), Commands (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (10): INP, Props, INP, Props, AssetFormValues, ChangeField, EMPTY, Options (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.23
Nodes (15): clean_account(), clean_plate(), clean_plate_status(), clean_responsable(), clean_serial(), clean_str(), clean_value(), get_area_id() (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (10): ConfirmDialogProps, apiTransferRequests, RequestDetailDrawerProps, DEFAULT_REQUEST_FILTERS, DEFAULT_TRANSFER_FILTERS, KpiProps, MiniKpi(), RequestFilters (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (11): TypeIconDark(), AssetTypeIcon(), COLS, getSmartIcon(), Meta, Props, SKEL, STATUS_LABELS (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.21
Nodes (8): apiUsers, SystemUser, inputCls, Props, ROLES, UserEditModal(), ROLE_META, UserManagementTable()

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (7): client, GooglePayload, verifyGoogleToken(), loginWithGoogle(), upsertLogin(), router, ValidationError

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (8): apiWriteoffs, WriteoffAct, WriteoffActDetail, WriteoffStats, CHART_COLORS, REASON_LABELS, RECON_CONFIG, STATUS_CONFIG

### Community 21 - "Community 21"
Cohesion: 0.2
Nodes (7): Transfer, COL_WIDTHS, Meta, Props, REASON_LABELS, STATUS_LABELS, STATUS_STYLES

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (7): CRITICALITY_BADGE, CRITICALITY_OPTIONS, INP, MAINTENANCE_AREA_OPTIONS, Props, STATUS_OPTIONS, Person

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (5): TransferRequest, TransferRequestStatus, Props, STATUS_CONFIG, StatusBadge()

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (6): apiTransfers, TransferReason, Props, REASONS, STATUSES, TransferFormModal()

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (4): AssetFormModal(), Props, useAssetForm(), apiCatalogs

### Community 28 - "Community 28"
Cohesion: 0.83
Nodes (3): main(), normalize_serial(), strip_accents()

## Knowledge Gaps
- **244 isolated node(s):** `app`, `PORT`, `SignRequester`, `SIGNABLE_STATUSES`, `IN_PROGRESS_STATUSES` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 1` to `Community 3`, `Community 5`, `Community 16`, `Community 17`, `Community 20`, `Community 21`, `Community 24`, `Community 25`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `pool` connect `Community 0` to `Community 9`, `Community 2`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `db` connect `Community 0` to `Community 8`, `Community 9`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `app`, `PORT`, `SignRequester` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._