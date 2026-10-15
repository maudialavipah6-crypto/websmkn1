# Design System

## Direction

**Peta Topologi Pembelajaran** treats the TKJ network diagram as both a subject illustration and a navigation metaphor. The page connects the real topics—computer equipment, networking, and servers—to learning activities, while explicitly distinguishing demo interactions from official school services.

## Palette

| Token | Value | Use |
|---|---|---|
| `--navy` | `#071B35` | Primary identity, hero, quiz panel |
| `--navy-mid` | `#0D2B50` | Deep supporting surfaces |
| `--navy-light` | `#174270` | Selected topology node |
| `--electric` | `#2563EB` | Links, icons, selected controls |
| `--electric-dark` | `#174CC6` | High-contrast action buttons |
| `--cyan` | `#27D7F2` | Connected/active accents on navy |
| `--paper` | `#F3F7FC` | Page ground |
| `--white` | `#FFFFFF` | Reading surfaces |
| `--ink` | `#10243D` | Primary text |
| `--muted` | `#52677F` | Supporting text |
| `--line` | `#DCE5EF` | Dividers and control borders |

Use cyan sparingly to identify active connections or primary actions. Keep body text on light surfaces dark; do not use muted gray on navy.

## Typography

Manrope is used for display and body copy. Display headings use a heavy weight, compact line-height, and negative tracking; body copy uses open line-height for readability. The font is loaded through the Google Fonts stylesheet in `index.html`.

## Layout and surfaces

- The navigation and hero span the viewport; reading sections use a centered maximum width.
- The hero pairs a large TKJ statement and actions with a crisp topology diagram. The diagram is a real SVG diagram, not a decorative background.
- Program competencies are presented as open ruled rows rather than a stack of identical cards.
- Learning content keeps an honest empty state until real modules are supplied.
- Quiz and attendance use clear task panels with visible progress, answer, confirmation, and demo states.
- Vision and mission remain together in one dark section. Contact details use the supplied official address and school channels.
- Use restrained borders and offset, soft shadows for elevation. Avoid glow-only elevation, nested cards, and decorative technical textures that do not carry information.

## Components and behavior

- Navigation anchors lead to the program, learning, quiz, attendance, vision/mission, and contact sections. The mobile menu exposes its expanded state and closes after navigation.
- Primary actions use navy or cyan fills; secondary hero actions remain outlined.
- Quiz responses advance through five sample questions, show an explanation, and compute a session-only score. They are not official assessments.
- Attendance requires a sample name, TKJ class, and demo status. Confirmation lives only in React state; the form does not transmit or persist student data. The interface instructs visitors not to enter real student details.
- Inputs use native labels, validation, keyboard operation, visible focus, and disabled-submit states. Quiz answers use a fieldset and radios.
- Use Lucide icons for interface symbols; preserve the supplied SMKN 1 Garut logo.

## Motion

The hero uses a restrained entrance with opacity and transform. Button and row hover changes are brief and do not animate layout dimensions. Honor `prefers-reduced-motion`.

## Responsive behavior

- At 1020px, reduce header spacing and hero scale.
- At 800px, switch to a collapsible navigation, single-column hero and activity layouts, and full-width hero/topbar.
- At 540px, tighten section padding, stack form fields, and keep text and controls within the viewport.
- Preserve the topology's readable labels; do not shrink the complete page into a miniature diagram.

## Product truth

The site is exclusively about Teknik Komputer dan Jaringan. Do not imply that the quiz or attendance demo is an official school record, invent LMS modules, or add unprovided policies, map coordinates, or contact details. Keep the profile, learning activities, and location/contact information consistent with the product facts in `PRODUCT.md`.
