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

Note: This is still a summarized reference. Machine-specific behavior can vary between Fanuc, Haas, and Marlin-based systems.
