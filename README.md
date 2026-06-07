# PHITHAN GREEN — ระบบติดตามงานติดตั้งโซล่าเซลล์

Dashboard สำหรับติดตาม Flow งานติดตั้งโซล่าเซลล์ของ PHITHAN GREEN
(Solar installation workload tracking dashboard).

Implemented from the Claude Design handoff bundle (`design_bundle/`).

## Running

The app is a self-contained React app (React 18 + in-browser Babel via CDN).
It needs to be served over HTTP (opening `index.html` from `file://` will not
work, because the JSX modules are fetched over the network).

```powershell
# from this folder
python -m http.server 8765
```

Then open <http://localhost:8765/>.

> Requires an internet connection on first load to pull React, Babel, Leaflet
> and the web fonts from their CDNs.

## What's included

Six views (left sidebar):

| View | ไทย | Notes |
|------|-----|-------|
| Overview | ภาพรวม | Clickable KPI cards → filter table, 6-stage pipeline, alerts, appointments, brand mix |
| Board | บอร์ดงาน | Kanban across the 6 workflow stages, drag cards between stages |
| Table | ฐานข้อมูลงาน | Editable material-status chips, edit/delete |
| Calendar | ปฏิทินนัด | Appointments with per-stage colour + flow legend |
| Map | แผนที่งาน | Real Leaflet/OpenStreetMap map, markers per province, accordion list |
| Stock | คลังสินค้า | Inventory with receive/issue ledger, low-stock badges |

Key features:

- **6-stage flow**: ออกแบบ → ถอดของ → สั่งของ → รอของ → ดำเนินงานติดตั้ง → เสร็จสิ้น
- **Job drawer** with timeline, editable material checklist, and "แก้ไขข้อมูล" form
- **Editable master data**: technicians (จัดการช่าง) and inverter brands/models
  (จัดการแบรนด์ — each brand flags whether it supports battery/Backup)
- **Persistence**: all changes are saved to `localStorage` (survives refresh).
  Each view has a "รีเซ็ตข้อมูล" button to restore the seed data.
- **Tweaks panel**: light / dark / flat themes and density toggles.

## Project structure

```
index.html              entry point (the "PHITHAN GREEN Dashboard.html" design)
dashboard/
  data.js               jobs, stages, materials, techs, brands, province lat/lng
  data-stock.js         inventory seed data
  store.jsx             localStorage-backed stores (jobs, techs, brands, stock)
  components.jsx        shared UI (badges, KPI cards, etc.)
  tweaks-panel.jsx      theme / density controls
  drawer.jsx            job detail drawer (flow timeline + materials)
  form.jsx              add/edit job form, TechManager, BrandManager
  views-overview.jsx    Overview
  views-board.jsx       Kanban board
  views-table.jsx       Table / database
  views-calendar.jsx    Calendar
  views-stock.jsx       Inventory
  app.jsx               app shell, sidebar, routing
  assets/               PHITHAN GREEN logo + mark
design_bundle/          original Claude Design export (chats, screenshots, source)
```

## Notes on technology choice

The design medium runs React through in-browser Babel (no build step). With no
Node toolchain on this machine, that same approach is kept as-is — it is a
faithful, runnable reproduction of the design. To harden for production later,
port the `dashboard/*.jsx` modules into a Vite + React project (replacing the
`window`-global wiring with ES module imports) and precompile instead of using
Babel standalone.
