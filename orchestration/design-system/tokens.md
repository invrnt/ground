# Design tokens

Assumption: these are the baseline tokens. The interface-foundation agent owns their implementation and checks text contrast once.

| Token | Value or rule |
| --- | --- |
| Background | `#F4F5F1` |
| Card | `#FFFFFF` |
| Main text | `#17211B` |
| Secondary text | `#536057` |
| Border | `#D5DCD4` |
| Primary/action | `#245C3B`, white text |
| Warning | `#7A4B00`, pale amber background |
| Error | `#A12727`, pale red background |
| Focus | 3 px visible outline with 2 px offset |
| Font | System sans-serif; tabular numerals for balances and money |
| Type sizes | 14 px metadata, 16 px body, 20 px card title, 28 px section, 40 px key metric |
| Spacing | 4, 8, 12, 16, 24, 32 and 48 px |
| Corners | 8 px inputs; 12 px cards and panels |
| Content width | 1440 px maximum; comfortable outer gutter |
| Target size | At least 44 by 44 px for primary interactive controls |

These are visual choices, not a requirement to add a theme engine. Demo framing enlarges the active card so final recorded text is at least 24 px. Color always accompanies a status label or icon with an accessible name.
