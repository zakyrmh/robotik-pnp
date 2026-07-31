# UKM Robotik PNP — Design System Reference

> Precision blueprint dashboard on a crisp canvas

**Theme:** Clean Technical (Light & High-Contrast)
**Codename:** Precision Blueprint

Sistem Informasi Manajemen UKM Robotik PNP renders technical data and dashboard interfaces with engineering precision. The visual system merges editorial cleanliness with SaaS density. It treats the page canvas as a technical blueprint: generous negative space, hairline borders holding the structure together, and typography doing the heavy lifting.

Following professional DKV (Desain Komunikasi Visual) color theory, the system relies on a **60-30-10 rule**:

- **60% (Canvas & Structure):** Crisp whites and mist grays for spacious, breathable interfaces.
- **30% (Anchor & Typography):** Biru Dongker (Deep Navy) for text, primary filled surfaces, and structural dominance.
- **10% (Accent):** Oranye PNP (Vibrant Orange) strictly rationed for active states, vital CTAs, and status highlights.

## Tokens — Colors

| Name             | Value     | Token                      | Role                                                                                                  |
| ---------------- | --------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| Canvas White     | `#ffffff` | `--color-canvas-white`     | Base page background and default card surfaces.                                                       |
| Mist Gray        | `#f1f5f9` | `--color-mist-gray`        | Subtle secondary backgrounds, nested panels, and table row zebra-striping.                            |
| Blueprint Border | `#e2e8f0` | `--color-blueprint-border` | Hairline borders (1px) used universally to define containers instead of heavy shadows.                |
| Steel Gray       | `#64748b` | `--color-steel-gray`       | Muted secondary text, disabled states, and placeholder text.                                          |
| Slate Blue       | `#334155` | `--color-slate-blue`       | Subheadings and secondary interactive text.                                                           |
| Dongker Ink      | `#0a192f` | `--color-dongker-ink`      | Primary text, heading color, and near-black contrast elements. The anchor of readability.             |
| Dongker Surface  | `#1e3a8a` | `--color-dongker-surface`  | Primary action button backgrounds and solid header bars. Represents the UKM's core identity.          |
| PNP Orange       | `#f97316` | `--color-pnp-orange`       | The vibrant accent. Used for text links, 'active' indicators, pill tags, and key data visualizations. |
| Orange Wash      | `#ffedd5` | `--color-orange-wash`      | Soft tinted background for orange feature tags or pending status badges.                              |

## Tokens — Typography

### Satoshi (or Clash Display) — Display and Headings

Used exclusively for H1/H2 (24px to 48px). Weight stays at 500 (Medium) to communicate modern, confident engineering without shouting in bold.

- **Role:** Hero headlines, module titles, and primary metric numbers.

### Inter — Body, UI, and Navigation

The workhorse sans-serif for everything from 11px micro-labels to 20px subheadings. Weight 400 for body text, 500 for button labels, and 600 for table headers.

- **Role:** High-density data tables, form inputs, and descriptive text.

### JetBrains Mono (or Geist Mono) — Technical & Code

Used at 12–14px for technical metadata, ID numbers, API keys, and code snippets.

- **Role:** Adds a developer/robotics tool aesthetic to specific technical outputs.

## Tokens — Spacing, Radii & Structure

**Density:** Compact & Structured (Base unit: 4px)

### Border Radius

- **Cards & Panels (12px):** Smooth but structured containers.
- **Buttons & Inputs (8px):** Standard interactive elements.
- **Pills & Tags (9999px):** Status badges, feature tags, and floating UI controls.

### Elevation & Structure (Border-First Philosophy)

- **Flat Containers:** Use 1px `--color-blueprint-border` for all standard cards and dashboard panels. No shadows.
- **Floating Artifacts:** For hover states or elevated modal cards, use a subtle shadow: `rgba(10, 25, 47, 0.08) 0px 8px 24px`.
- **Section Dividers:** Use a 1px dashed line (`dashed #cbd5e1`) for dividing major sections, inspired by engineering schematics.

## Core Components

### 1. Pill Button (Primary Action)

- **Style:** Background `#1e3a8a` (Dongker), Text `#ffffff`, Radius 8px, padding 8px 16px.
- **Usage:** The committed action (e.g., "Simpan Data", "Daftar Turnamen").

### 2. Outlined Ghost Button (Secondary Action)

- **Style:** Transparent background, 1px solid `#1e3a8a`, Text `#1e3a8a`, Radius 8px.
- **Usage:** Secondary actions like "Batal" or "Lihat Detail".

### 3. Feature / Status Badge

- **Style:** Background `#ffedd5` (Orange Wash), Text `#c2410c` (Darker Orange), Radius 9999px. Uppercase, weight 600, 11px font.
- **Usage:** Small markers for status (e.g., "AKTIF", "PROSES") or categories.

### 4. Input Fields

- **Style:** Background `#ffffff`, border 1px solid `#e2e8f0`, radius 8px. On focus, border changes to `#f97316` (PNP Orange) with a subtle shadow ring.

### 5. Floating Data Card

- **Style:** Background `#ffffff`, radius 12px, 1px border. Left edge features a 4px thick vertical accent line in `#1e3a8a` or `#f97316` to denote status or category.

## Specific Layout Rules

### Authentication / Login Page

The login layout utilizes a split-panel design for optimal UX and context delivery.

- **Left Panel:** Contains the core authentication form (clean white background, Dongker inputs).
- **Right Panel:** Specifically reserved for welcoming returning users. Do not use this space for generic marketing or attracting new sign-ups. Instead, display dynamic greetings, recent system activity, or personalized dashboards tailored to existing members.

### Tournament & Live Broadcast Views

For views managing KRSBI-B or other division fixtures (e.g., round-robin brackets, OBS overlay data syncing):

- Prioritize tabular density and high-contrast monospaced numerals (`JetBrains Mono`).
- Use alternating `#f1f5f9` (Mist Gray) background rows for scannability.

## Do's and Don'ts

### Do

- **Do** anchor the UI in Biru Dongker. It is the core identity.
- **Do** use Oranye PNP sparingly. Think of it as a laser pointer — it draws the eye to what's important (active tabs, primary links, warnings).
- **Do** use uppercase text (Weight 600, 11px-12px) for table headers and micro-labels to create an editorial, blueprint feel.
- **Do** rely on generous padding (16px, 24px) inside cards to let data breathe.

### Don't

- **Don't** use large blocks or full backgrounds of Oranye PNP. It will overpower the interface and look unrefined.
- **Don't** use heavy drop shadows on every card. Rely on the 1px border for structure.
- **Don't** use center alignment for long body copy. Keep descriptions and forms strictly left-aligned for technical precision.

---

## Tailwind CSS v4 Base Configuration

_(Copy this into the global CSS or agent theme context)_

```css
@theme {
  /* Colors - UKM Robotik PNP Identity */
  --color-canvas-white: #ffffff;
  --color-mist-gray: #f1f5f9;
  --color-blueprint-border: #e2e8f0;

  /* Grays */
  --color-steel-gray: #64748b;
  --color-slate-blue: #334155;

  /* Biru Dongker */
  --color-dongker-ink: #0a192f;
  --color-dongker-surface: #1e3a8a;
  --color-dongker-hover: #1e40af;

  /* Oranye PNP */
  --color-pnp-orange: #f97316;
  --color-orange-wash: #ffedd5;
  --color-orange-deep: #c2410c;

  /* Typography */
  --font-display:
    "Satoshi", "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", ui-monospace, monospace;

  /* Typography Scale */
  --text-micro: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-md: 18px;
  --text-lg: 24px;
  --text-xl: 32px;
  --text-2xl: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-blueprint: rgba(10, 25, 47, 0.08) 0px 8px 24px;
  --shadow-ring-orange: 0 0 0 3px rgba(249, 115, 22, 0.2);
}

/* Base Layout Injections */
@layer base {
  body {
    @apply bg-[var(--color-canvas-white)] text-[var(--color-dongker-ink)] font-body antialiased;
  }
  h1,
  h2,
  h3,
  h4 {
    @apply font-display tracking-tight text-[var(--color-dongker-ink)];
  }
  .dashed-divider {
    @apply border-t border-dashed border-[var(--color-blueprint-border)] w-full;
  }
}
```
