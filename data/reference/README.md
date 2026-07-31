# Project G-Code Reference Split Package

This folder splits `cnc_3d_reference.json` into smaller data files for Project G-Code.

Suggested repo path:

```text
data/reference/
```

Use `index.json` to discover the files and counts. Each file uses this shape:

```json
{
  "category": "cnc_turning",
  "type": "g_codes",
  "items": []
}
```

Files included:

- `metadata.json` — package title, version, brands, notes
- `mill-g-codes.json`
- `mill-m-codes.json`
- `lathe-g-codes.json`
- `lathe-m-codes.json`
- `programming-symbols.json`
- `blueprint-gdt-symbols.json`
- `operation-sheet-symbols.json`
- `marlin-3d-printer-g-codes.json`
- `marlin-3d-printer-m-codes.json`
- `index.json` — lookup file for the app

Each G-code and M-code card includes a direct official Haas or Marlin documentation link. Symbol cards are summarized separately because shop notation and drawing requirements may use different governing standards.

This remains a learning reference, not a machine-ready programming authority. Verify every command against the exact machine, controller, or firmware version, as well as its options, postprocessor, tooling procedure, and shop documentation.

Last source audit: 2026-07-14.
