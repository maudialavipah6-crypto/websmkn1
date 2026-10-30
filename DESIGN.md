# Portal TKJ — design system

## Direction

Preserve the school logo, navy identity, Manrope typography, and the network illustration on the public home page. Learning tasks should feel calm and legible: clear headings, restrained borders, and visible action labels. Avoid decorative labels above headings, unnecessary shadows, and boxes nested inside other boxes.

This document describes the current UI. `PRODUCT.md` contains historical demo assumptions; it does not replace the implemented Supabase account, lesson, quiz, and attendance flows. This design revision does not change those backend contracts.

## CSS ownership

`src/main.jsx` imports these files in order:

1. `design-tokens.css`: shared colors, type scale, spacing, and geometry.
2. `styles.css`: page-specific composition and illustration styling.
3. `design-system.css`: shared fields, action variants, type roles, resource lists, question forms, and reading surfaces.
4. `responsive.css`: viewport-dependent composition and the native-dialog navigation drawer.

Change a shared pattern in its owner file. Do not append another override to a page stylesheet to change every input or button. Use existing component classes when they express the same intent; a new React wrapper is not required just to share a CSS rule.

## Tokens

| Role | Token | Value |
| --- | --- | --- |
| Primary text / supporting text | `--ink` / `--muted` | `#10243d` / `#52677f` |
| School identity | `--navy` | `#071b35` |
| Page / panel / subtle surface | `--paper` / `--white` / `--surface-subtle` | `#f3f7fc` / `#fff` / `#f7f9fc` |
| Primary action / hover | `--action` / `--action-hover` | `#2059c8` / `#1647a9` |
| Divider / field boundary | `--line` / `--border-control` | `#dce5ef` / `#8293a6` |
| Keyboard focus | `--focus` | `#174cc6` |
| Error / success | `--danger` / `--success` | `#923232` / `#176344` |
| Metadata | `--text-xs` | 12px |
| Labels, helper copy, buttons | `--text-sm` | 14px |
| Fields and reading text | `--text-base` | 16px |
| Panel headings | `--text-lg` | 18px |
| Dashboard page heading | `--text-title` | 26–32px |
| Spacing scale | `--space-1` through `--space-6` | 4, 8, 12, 16, 24, 32px |
| Touch control height | `--control-height` | At least 44px |
| Control / panel radius | `--radius-control` / `--radius-panel` | 8px / 10px |

Use regular (400) text, medium (500) navigation, semibold (600) labels/actions, and bold (700) headings. Reading content uses 1.75 line height and a maximum measure of 70ch. Supporting copy uses 1.6. Use tabular numerals for counts and results. Keep cyan as an accent on navy; supporting text on white uses `--muted`.

## Reusable patterns

- **Primary action:** `.dashboard-primary` for publishing or saving. `.button.button-navy` retains the established public/admin action variant.
- **Secondary action:** `.refresh-button`, `.back-to-list`, `.lesson-cancel-button`, and `.add-question-button` share field-sized geometry and a visible border.
- **Inline action:** `.panel-action` uses a quiet surface with the same minimum touch height. Destructive actions use explicit wording or an accessible icon label and the danger color.
- **Fields:** `.workspace-form`, `.admin-account-form`, and `.account-filters` use the same input primitive. Inputs remain 16px on phones. The text-field selector uses `:where()` exclusions so checkboxes, radios, and file pickers keep their native geometry, and option rows can override the primitive without escalating specificity.
- **Quiz question:** `.question-editor` is a fieldset with an accessible, visually hidden legend. `.question-editor-heading` contains the visible number and remove action. Each answer is one bordered row, with a 44px label area around an 18px radio and a borderless text input. Keep one checked answer per radio group; never preselect a correct answer on the teacher's behalf.
- **Resources and accounts:** use separators between rows inside the task panel. Titles may wrap; status remains visible on mobile. Account role, status, and search filters compose together and expose a live result count.
- **Reader/editor:** use `.lesson-reader-content` and `.rich-text-content` for the shared type measure. Images scale to their container; code blocks can scroll independently. An empty reader does not reserve a blank rectangle.

```jsx
<label>
  Judul materi
  <input required value={title} onChange={onTitleChange} />
</label>
<button className="dashboard-primary" type="submit" disabled={saving}>
  {saving ? 'Menyimpan…' : 'Simpan materi'}
</button>
```

Place that label inside `.workspace-form` to consume the shared field primitive. Keep labels visible; placeholders supplement them.

## Responsive and interaction rules

- Up to 1200px, stack teacher authoring/list panels so the desktop sidebar cannot squeeze the form. Student resources use two columns, then one below 600px.
- Up to 800px, the menu trigger shares one 64px header row with the page label and account. The drawer is `min(268px, 82vw)` with a scrollable `100dvh` height, backdrop, Escape dismissal, focus return, and scroll locking supplied by `ResponsiveSidebar`.
- Below 600px, account status and action groups move to subsequent rows. Below 400px, tighten outer gutters while preserving field and button sizes.
- Do not force a 320px document minimum: a scrollbar or zoom may leave less usable space. Verify both the document and individual form/list containers for overflow.
- Preserve visible hover, focus, disabled, loading, error, empty, and selected states. Error/success messages must include text rather than rely on color.
- Preserve the existing `prefers-reduced-motion` behavior. Do not add scroll effects or layout animations as part of a typography change.

## Verification

Build with `npm run build`. Review public home, school profile, student reader, teacher authoring, and admin account views at narrow/mobile, tablet, and desktop widths. Check question add/remove, keyboard/radio selection, combined account filters, drawer close/focus return, reading/back navigation, long titles, and inactive-account status. Use isolated fixtures for UI inspection; browser checks with fixtures do not verify production Supabase policies or writes.
