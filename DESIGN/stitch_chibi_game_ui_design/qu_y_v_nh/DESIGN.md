---
name: Quầy Vé Nhỏ
colors:
  surface: '#fff8f5'
  surface-dim: '#fad3b2'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e8'
  surface-container: '#ffeadb'
  surface-container-high: '#ffe3ce'
  surface-container-highest: '#ffdcc0'
  on-surface: '#2b1704'
  on-surface-variant: '#4f453e'
  inverse-surface: '#432b15'
  inverse-on-surface: '#ffeee1'
  outline: '#81746e'
  outline-variant: '#d3c3bb'
  surface-tint: '#765845'
  primary: '#523828'
  on-primary: '#ffffff'
  primary-container: '#6c4f3d'
  on-primary-container: '#eac3ac'
  inverse-primary: '#e6bfa8'
  secondary: '#97472e'
  on-secondary: '#ffffff'
  secondary-container: '#fe997a'
  on-secondary-container: '#772f18'
  tertiary: '#114547'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d5d5f'
  on-tertiary-container: '#a3d4d6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc7'
  primary-fixed-dim: '#e6bfa8'
  on-primary-fixed: '#2b1608'
  on-primary-fixed-variant: '#5c4130'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#793019'
  tertiary-fixed: '#baebed'
  tertiary-fixed-dim: '#9fcfd1'
  on-tertiary-fixed: '#002021'
  on-tertiary-fixed-variant: '#1c4e50'
  background: '#fff8f5'
  on-background: '#2b1704'
  surface-variant: '#ffdcc0'
typography:
  headline-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '800'
    lineHeight: 18px
  label-md:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

### Brand Personality & Emotional Atmosphere
The design system establishes a gentle, heartwarming, and nostalgic ambiance reminiscent of a quaint countryside railway kiosk or a cozy European-Asian heritage travel boutique. The personality is slow-paced, welcoming, deeply tactile, and endearing. It avoids flashy neon arcade tropes or sterile modern flatness, choosing instead the comforting physical sensation of pressed travel stamps, biscuit-toned kraft paper receipts, polished wooden counters, and hand-cut souvenir stickers. 

Players should feel an immediate sense of emotional safety and relaxing escapism—evoking the nostalgic scent of hot tea, toasted butter biscuits, and vintage train timetables.

### Design Movement & Visual Style
The aesthetic fuses **Chibi Tactile Skeuomorphism** with **Whimsical Retro Illustration**:
- **Tactile Toy-Like Dimensions:** Pushable pill buttons, extruded wooden plaques, and embossed paper cards featuring warm, deep chocolate-brown dropped borders rather than cold neutral dropshadows.
- **Storybook Comic Accents:** Rounded speech bubbles with organic curved tails, playful comic-strip outlines, and stamp-like ticket stubs.
- **Earthy Muted Palette:** Nostalgic warm browns, sepia timber grains, clotted cream surfaces, and vintage secondary travel accents (soft faded teal, terracotta clay, and spruce green).
- **Physical Paper & Wood Metaphors:** Container surfaces simulate creamy textured postcard cardstock, kraft gift boxes, and smooth pine/walnut railings.

## Colors

The palette draws strictly from natural wood, baked dough, vintage stamps, and warm ambient travel ephemera. Vivid neon and high-glare saturations are deliberately excluded.

### Core System Tokens
- **Primary (`#6C4F3D` - Walnut Timber):** Anchors primary brand elements, structural container headers, active state outlines, and primary action buttons. Supported by `#4A3525` (Deep Espresso Wood) for hard tactile borders, text headers, and bottom extruded button layers.
- **Secondary (`#C86D51` - Terracotta Clay):** Used for focal interactive highlights, special departure stamps, discount tags, and warm celebratory prompts.
- **Tertiary (`#5B8A8C` - Faded Vintage Teal):** Acts as a tranquil complementary accent for air/sea transit tickets, quest milestones, and relaxed navigation tabs.
- **Accent Soft Spruce (`#6E8B74` - Pine Forest):** Reserved for nature itineraries, completed checkmarks, inventory gains, and soft positive confirmations.
- **Neutral Palette (Kraft & Clotted Cream):**
  - Surface Background: `#FDF6EC` (Whipped Butter Cream) for canvas warmth.
  - Surface Container / Card: `#F5E8D3` (Toasted Biscuit) and `#E6D2B5` (Light Kraft Cardboard).
  - Neutral Tone: `#8D6E53` (Caramel Woodgrain) for subtle divider lines, inactive labels, and icon bodies.

### Semantic & Interaction Roles
- **Surface Level 0 (App Canvas):** `#FDF6EC` with faint ambient paper grain.
- **Surface Level 1 (Panels & Trays):** `#F5E8D3` framed with a 2px `#6C4F3D` border.
- **Surface Level 2 (Ticket Cards & Dialogue Stubs):** `#FFFFFF` muted down to `#FFFDF9` with `#E6D2B5` embossed shading.
- **Outlines & Shadows:** Never pure black (`#000000`). All stroke boundaries, comic outlines, and 3D extruded lips use `#4A3525` or `#352317`.

## Typography

The typography system pairs **Be Vietnam Pro** for bold, characterful, rounded-feel display headlines with **Nunito Sans** for soft, highly legible, organic body and micro-copy. Both typefaces excel in rendering Vietnamese diacritics without clipping or unbalanced glyph accents.

### Hierarchy & Editorial Styling
- **Expressive Warm Display:** Headlines use heavy weights (`800` or `700`) in `#4A3525`. For prominent kiosk titles, an optional 1.5px light butter highlight stroke (`#FDF6EC`) or a solid 2px outline is supported to sustain the chibi graphic novel feel.
- **Dialogue & Quest Logs:** Story sequences, passenger requests, and NPC banter prioritize `body-lg` and `body-md` in `Nunito Sans` with increased line-height to ensure reading comfort on compact handheld screens.
- **Travel Numeric Data & Timers:** Coin counters, departure hours, and stamp tallies use `label-lg` with tabular numbers enabled (`font-variant-numeric: tabular-nums`) to prevent jittering during real-time game updates.

## Layout & Spacing

### Philosophy & Form Factors
The design system operates primarily on a handheld, portrait-first mobile layout (aspect ratios 9:16 to 9:20), reflowing predictably into centered, kiosk-framed wrappers on tablets and landscape modes.

- **Safe Zones & Playable Canvas:** UI panels anchor to top status bars (resources, currencies, kiosk level) and bottom action docks (stamp inventory, ticket dispatch tray, customer order queue). The vertical safe margin preserves at least `1.5rem` from phone home indicators.
- **Grid Architecture:** 
  - Mobile (Viewport `< 600px`): Single-column flex/stack canvas with a 4-column internal item grid for sticker albums and inventory pouches. Margin is strictly `1rem`, gutter is `0.75rem`.
  - Tablet / Widescreen (`>= 600px`): Fixed 480px simulated wooden mobile frame centered with decorative vintage wallpaper surrounding the kiosk frame.
- **Rhythm & Padding:** All internal card padding and stack margins follow the 4px baseline derived scale. Component groups (e.g., ticket stamp combos) maintain a strict `0.5rem` (`space-sm`) cadence to maintain a snug, tactile layout.

## Elevation & Depth

This system avoids blurry, modern, grayscale SaaS drop shadows. Instead, it relies on **Chibi Clay & Wood Extrusion**—solid, flat, warm-tinted step offsets combined with crisp espresso borders.

### Depth Archetypes
1. **Flat Paper / Inset (Level 0):** Used for input fields, ticket slots, and empty stamp sockets. Rendered with an inner bottom border: `inset 0 3px 0 #E6D2B5`, surrounded by a 1.5px border of `#C4AE91`.
2. **Elevated Biscuit Card (Level 1):** Postcards, order notes, and passenger dialogues. Defined by a crisp 2px solid border of `#6C4F3D` and a solid downward shadow: `box-shadow: 0 4px 0 #4A3525`.
3. **Interactive 3D Pill Button (Level 2):** Primary pushable widgets. Built with an internal top-edge highlight (`inset 0 2px 0 rgba(255,255,255,0.4)`) and an extruded structural base (`box-shadow: 0 5px 0 #4A3525`).
4. **Active Pressed State:** On touch down, the element translates down `3px` vertically (`transform: translateY(3px)`), collapsing the extruded bottom shadow to `0 2px 0 #4A3525` to provide immediate physical click satisfaction.
5. **Modal & Floating Dialogues (Level 3):** Dimmed background overlay uses warm espresso sepia at 55% opacity (`rgba(74, 53, 37, 0.55)`), accompanied by floating kiosk popups carrying a `0 8px 0 #4A3525` base.

## Shapes

The design system embraces an ultra-soft, organic, pillow-like silhouette language (`roundedness: 3`). Sharp 90-degree corners are strictly prohibited across all customer-facing surfaces to maintain a warm, friendly storybook world.

### Shape Formulas
- **Pill Shapes (`rounded-full` / `9999px`):** Reserved for primary interactive controls, currency indicators, status meters, and ticket tab headers.
- **Plump Containers (`rounded-3xl` / `1.5rem` - `2rem`):** Main dialogue speech bubbles, kiosk storefront order windows, and luggage popups.
- **Cards & Ticket Stubs (`rounded-2xl` / `1rem` - `1.25rem`):** Passenger request cards and destination postcards, often featuring scalloped circular punch-outs along the left or right edges to emulate vintage perforated train tickets.
- **Speech Bubble Arrow:** Bubble pointers have smoothed, rounded anchor apexes with radius values no sharper than `6px`, preserving the cuddly, hand-drawn comic look.

## Components

### 1. Buttons
- **Primary Wood / Butter Button:** Pill-shaped, base color `#6C4F3D` with cream text (`#FDF6EC`), 2px stroke of `#4A3525`, and a 5px extruded base of `#4A3525`. Includes a soft inner radial shine at the top half.
- **Secondary Action (Warm Terracotta):** Base color `#C86D51` with 4px extruded bottom `#8F4631`. Used for "Khám Phá" (Explore) or "Đóng Dấu" (Stamp).
- **Special Transit Action (Vintage Teal):** Base color `#5B8A8C` with 4px extruded base `#3B5E60`. Used for departures and train dispatching.
- **Small Circular Utility Buttons:** 44px x 44px circular pills for settings, sound toggles, and kiosk inventory, maintaining identical 3D press physics.

### 2. Speech & Comic Dialogue Bubbles
- Built over `#FFFFFF` or `#FDF6EC` backgrounds with a continuous 2.5px outline in `#4A3525`.
- Features a bottom-left or bottom-right curved chibi tail directing focus toward passenger avatars.
- Passenger nameplates appear as mini biscuit tabs overlapping the top-left boundary of the bubble.

### 3. Cards & Ticket Stubs (Quầy Vé Cards)
- **Ticket Stub:** Background `#F5E8D3` framed by a dashed interior guide line (`#8D6E53`) simulating perforation. Semicircular cutouts (`12px` radius) on vertical seam dividers.
- **Souvenir Stamp Badge:** Circular or postage-stamp scalloped perimeter with 2px stroke `#C86D51` tilted slightly at -3° or +4° for a casual, hand-applied aesthetic.

### 4. Input Fields & Search Bars
- Recessed pill shapes with `#E6D2B5` background and inner top shadow.
- Placeholder text styled in `#8D6E53` (500 weight).
- Left-side accessory features a tiny chibi magnifying glass or vintage stamp icon with warm brown stroke.

### 5. Checkboxes, Toggles & Radios
- **Checkbox:** Rounded square (`rounded-lg`) filled with `#FDF6EC`, bordered by 2px `#6C4F3D`. Active state features a plump, animated leaf checkmark in `#6E8B74`.
- **Switch Toggle:** Track resembles a carved wooden slot (`#E6D2B5`), while the thumb is a creamy rounded butter sphere that slides with an extruded drop edge.

### 6. Chips & Travel Tags
- Compact pill tags with subtle pastel tints: Teal tint (`#E8F2F2`) for "Chuyến Bay", Terracotta tint (`#F9ECE8`) for "Tàu Hỏa", and Kraft tint (`#EFE5D8`) for "Xe Buýt".
- Outlined with 1.5px solid warm brown borders; typography set in `label-sm`.

### 7. Custom Travel Kiosk Additions
- **Resource HUD Bar:** Pill capsule at top-center containing acorns/coins and ticket rolls, framed in dark caramel with a golden brass pin effect.
- **Order Queue Tray:** Bottom horizontal scroll rack displaying customer avatar circles, each with an urgent or relaxed timer bar rendered as a melting butter candle or ticking vintage clock face.