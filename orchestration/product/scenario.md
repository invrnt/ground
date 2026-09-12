# Canonical scenario

Source: PRD sections 2 and 6. Owner of configured seed and manifest: `runtime`. Domain rules belong to the agents listed in [requirements-map.md](requirements-map.md).

| Field | Baseline |
| --- | --- |
| Project | La Arboleda; bathroom 2 and hallway |
| Time and currency | Scenario `2026-09-12`; timezone `America/Bogota`; COP |
| People | Luis reports; Ana supervises/approves; Juan reviews; separate authorized demo recipient |
| Bathroom plan | Completed weight 62; tiling weight 19 in progress; finishing and inspection total weight 19 pending |
| Tile | `POR-GRIS-60`; 8 boxes; 1.26 m² per box; no committed inbound stock |
| Hallway | 22.5 m²; 10% waste allowance; starts the next day |
| Dependency | North-wall closure waits for leak review |
| Cement | `CEM-50`; 4 bags; invoice `F-DEMO-001` not registered |
| Drawing | P-03, revision 3, north wall W2, demo reference only |
| Remote state | Linked workspace and users; no objects belonging to this new run |

Real tile brand, commercial reference, finish and public reference URL are required manifest values. Do not invent a product or internet price. Demo media, address, recipient and drawing are explicitly labeled. Media files have path, hash, type, duration/page count and intended message relationship.

Luis's 12 to 15 second audio is exactly:

> Terminamos el enchape del baño dos y usamos las últimas ocho cajas de porcelanato gris. Hay una fuga en la pared norte. Juan debe revisarla mañana a las nueve.

The photo replies to that audio. It becomes evidence for the same report, issue and task without repeating the consumption.

Expected calculations:

```text
Progress = 62 + 19 = 81% reported
Tile stock = 8 - 8 = 0 boxes
Hallway area with allowance = 22.5 × 1.10 = 24.75 m²
Gross boxes = ceil(24.75 / 1.26) = 20
Net boxes = max(0, 20 - 0 usable - 0 committed in time) = 20
Juan due = 2026-09-13T14:00:00Z = 13 Sep 2026, 09:00 Bogota
Cement invoice = 6 × 38,000 = 228,000 COP
Cement stock after invoice = 4; after one confirmed receipt = 10
Correction to seven consumed = +1 compensating box; stock 1; need 19
```

A main run leaves one completed tiling milestone, one consumption, one issue with photo, one Juan assignment, one 20-box need, research, one approved request, one send record and a conditional follow-up. Ambiguous has one photo file, one assigned task and one updated report document. Tile stock stays zero until an actual receipt.

## Synthetic comparison fixtures

| Candidate | Source facts | Expected 20-box total | Classification |
| --- | --- | --- | --- |
| A | Same reference; 55,000 COP/box; transport 30,000; requested-date delivery | 1,130,000 COP | First among these fixtures |
| B | Same reference; 53,000 COP/box; transport 20,000; delivery in three days | 1,080,000 COP | Required-date conflict |
| C | Different shade; 52,000 COP/box; transport 25,000; requested-date delivery | 1,065,000 COP | Needs supervisor compatibility review |

Fixture totals contain only the stated components. Unknown tax is not silently treated as included or zero. These sources live under `demo/fixtures/sourcing/`, separate from live results. The video uses that session's real Exa sources, with no fixed winning provider or price.
