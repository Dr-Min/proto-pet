# Proto Pet Design System

## 1. Atmosphere & Identity

The app should feel like a small, soft pet living on a warm paper floor. The signature is a low-tech, slightly silly creature with tactile care controls: feeding, resting, and petting should feel immediate rather than menu-driven.

The UI now leans into a hand-drawn pocket-world language inspired by small playful iOS toys: the interface should look written into the pet's world, not placed on top as product chrome. This means hand-lettered text, soft uneven outlines, lightly tilted controls, and doodle-like panels. It must remain original to Proto Pet: no copied Grug font, no copied icons, no cave-person phrasing.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/page | --surface-page | #f4efe4 | n/a | App background |
| Surface/floor | --surface-floor | #ece5d3 | n/a | Ground plane |
| Text/muted | --text-muted | #9a8f7d | n/a | Top hint |
| Text/ui | --text-ui | #8a7f6c | n/a | Bottom labels and memory line |
| Drawn/ink | --drawn-ink | #6f5a45 | n/a | Hand-drawn UI outlines and primary text |
| Drawn/ink-soft | --drawn-ink-soft | rgba(111,90,69,0.32) | n/a | Soft sketch borders |
| Drawn/paper-line | --drawn-paper-line | rgba(111,90,69,0.18) | n/a | Gauge tracks and panel divider lines |
| Pet/body | --pet-body | #efd9b8 | n/a | Default pet body, varied slightly by gene seed |
| Pet/body-dark | --pet-body-dark | #dfc49c | n/a | Default darker body accents, varied slightly by gene seed |
| Pet/outline | --pet-outline | rgba(96,74,56,0.35) | n/a | Soft outline |
| Pet/cheek | --pet-cheek | rgba(240,140,130,0.18) | n/a | Cuddly blush, intensified by happy state |
| Pet/foodie-mark | --pet-foodie-mark | rgba(176,128,82,0.36) | n/a | Small belly dots for foodie trait |
| Pet/egg-crack | --pet-egg-crack | rgba(96,74,56,0.42) | n/a | Hairline cracks on a warm egg |
| Care/hunger | --care-hunger | #a8c686 | n/a | Hunger healthy fill |
| Care/energy | --care-energy | #8fb7d9 | n/a | Energy healthy fill |
| Care/bond | --care-bond | #e78aa1 | n/a | Bond fill |
| Care/bond-low | --care-bond-low | #d9a36b | n/a | Low bond fill |
| Care/low | --care-low | #d9776b | n/a | Low need warning |
| Care/warm | --care-warm | #e8b87f | n/a | Feed button |
| Care/cool | --care-cool | #b8c7d7 | n/a | Rest button |
| Care/play | --care-play | #dba6b4 | n/a | Play/fetch button |
| Care/walk | --care-walk | #b9cfa6 | n/a | Walk and return-home button |
| Care/battle | --care-battle | #c7b1d8 | n/a | Battle and cheer button |
| Surface/panel | --surface-panel | #e8dfcb | n/a | Tonal-shift bottom sheet and notebook overlay |
| Surface/panel-deep | --surface-panel-deep | #ded3bd | n/a | Pressed/locked tonal-shift panel controls |
| Surface/scrim | --surface-scrim | rgba(116,96,72,0.14) | n/a | Quiet outside-tap layer behind overlays |
| Play/ball | --play-ball | #d98f7a | n/a | Fetch ball body |
| Play/ball-seam | --play-ball-seam | rgba(96,74,56,0.4) | n/a | Fetch ball stitch line |
| Battle/foe | --battle-foe | #c9b7a2 | n/a | Small sparring opponent body |
| Battle/foe-dark | --battle-foe-dark | rgba(90,70,55,0.32) | n/a | Opponent outline and face |
| World/walk-floor | --world-walk-floor | #e1e7d1 | n/a | Outdoor walk ground plane |
| World/walk-sky | --world-walk-sky | #f7f3e6 | n/a | Brighter outdoor walk sky |
| World/walk-hill | --world-walk-hill | #d7dfc7 | n/a | Far walk hill bands |
| World/walk-path | --world-walk-path | #d7ccb7 | n/a | Outdoor walk path |
| World/walk-grass | --world-walk-grass | rgba(104,132,86,0.38) | n/a | Swaying walk grass blades |
| World/walk-shrub | --world-walk-shrub | #c7d3aa | n/a | Lumpy walk shrubs |
| World/walk-stone | --world-walk-stone | #c8c1ae | n/a | Lumpy walk stones |
| World/walk-cloud | --world-walk-cloud | rgba(255,251,240,0.72) | n/a | Soft drifting walk cloud blobs |
| World/walk-butterfly | --world-walk-butterfly | #d8b0a3 | n/a | Small uncatchable walk butterfly |
| World/walk-spark | --world-walk-spark | rgba(232,184,127,0.55) | n/a | Subtle discovery spot glint |
| Furniture/wheel | --furniture-wheel | #d2bda5 | n/a | Soft wooden exercise wheel body |
| Furniture/wheel-dark | --furniture-wheel-dark | rgba(104,82,62,0.34) | n/a | Wheel stand, axle, and outlines |
| Furniture/cushion | --furniture-cushion | #d9a6a0 | n/a | Squashy nap cushion |
| Furniture/window | --furniture-window | #bac9c6 | n/a | Quiet wall window frame |
| Furniture/window-light | --furniture-window-light | #eef0e8 | n/a | Pale outside light in window |
| Furniture/pot | --furniture-pot | #c79b78 | n/a | Small clay plant pot |
| Furniture/leaf | --furniture-leaf | #8faf77 | n/a | Low-saturation plant leaves |
| Day/morning-tone | --day-morning-tone | rgba(232,184,127,0.04) | n/a | Subtle morning gold overlay |
| Day/tone | --day-tone | rgba(0,0,0,0) | n/a | Midday clear overlay |
| Day/evening-tone | --day-evening-tone | rgba(217,143,122,0.06) | n/a | Subtle evening orange overlay |
| Day/night-tone | --day-night-tone | rgba(64,78,118,0.10) | n/a | Subtle night blue overlay and sky dim |
| World/battle-floor | --world-battle-floor | #e2d8c7 | n/a | Training ground plane |
| World/battle-sky | --world-battle-sky | #eee8dc | n/a | Dimmer training-ground sky |
| World/battle-sand | --world-battle-sand | #d8c8b1 | n/a | Inner sand band for training ring |
| World/battle-ring | --world-battle-ring | rgba(120,96,72,0.22) | n/a | Subtle sparring ring marks |
| World/battle-flag | --world-battle-flag | #c9a8a0 | n/a | Muted fluttering training flags |
| World/battle-footprint | --world-battle-footprint | rgba(112,91,70,0.13) | n/a | Faint old footprint marks |
| Pet/grime | --pet-grime | rgba(96,74,56,0.18) | n/a | Subtle dust marks after long absence |
| Food/kibble-base | --food-kibble-base | #f0c98b | n/a | Default round food bowl |
| Food/kibble-top | --food-kibble-top | #d59b57 | n/a | Default round food mound |
| Food/kibble-bit | --food-kibble-bit | #8c6042 | n/a | Default food bits |
| Food/berry-base | --food-berry-base | #eeb0b7 | n/a | Berry snack bowl |
| Food/berry-top | --food-berry-top | #ce7084 | n/a | Berry snack mound |
| Food/berry-bit | --food-berry-bit | #89495b | n/a | Berry snack bits |
| Food/leaf-base | --food-leaf-base | #c9d99a | n/a | Leafy food bowl |
| Food/leaf-top | --food-leaf-top | #94ad68 | n/a | Leafy food mound |
| Food/leaf-bit | --food-leaf-bit | #5f7446 | n/a | Leafy food bits |

### Rules

- Use warm neutrals for the world, not saturated game UI chrome.
- Care colors are functional: green for hunger, blue for energy, pink for mind, rose for play, coral for low state.
- Food colors stay soft and edible, with three recognizable families: warm kibble, berry pink, and leafy green.
- Pet body color may vary inside the documented peach-to-cream family through the saved gene seed.
- New colors should extend the table before use.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Body/sm | 16px | 700 | 1.25 | 0 | Buttons |
| Caption | 16px | 400 | 1.35 | 0 | Hint and pet captions |
| UI label | 15px | 400 | 1.25 | 0 | Gauges, memory line |
| UI label/sm | 14px | 400 | 1.25 | 0 | Narrow mobile gauges |

### Font Stack

- Primary/hand: "Gaegu", "Apple SD Gothic Neo", -apple-system, sans-serif
- Fallback/system: -apple-system, "Apple SD Gothic Neo", sans-serif
- Mono: not used
- Serif: not used

### Rules

- Keep text compact; this is a toy surface, not a dashboard.
- Do not use viewport-scaled type.
- Letter spacing stays at 0.
- The default UI and pet captions use the hand stack. If the webfont fails, the system fallback is acceptable; do not block the game.
- Do not copy another app's custom lettering. Proto Pet's hand style is soft, uneven, and Korean-readable.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight gauge label gaps |
| --space-2 | 8px | Bottom UI row gap |
| --space-3 | 12px | Bottom UI horizontal padding |
| --space-4 | 16px | Top hint left offset |
| --space-5 | 20px | Button horizontal padding on roomy widths |

### Grid

- Canvas fills the viewport.
- Bottom care UI is fixed, centered, and split into memory, gauge, and action rows.
- Mobile is primary; 320px width must not horizontally scroll.

### Rules

- Fixed-format UI elements need stable dimensions so the pet area does not shift during care changes.
- Bottom controls may grow vertically, but must remain inside the viewport including safe-area inset.

## 5. Components

### Care Gauge

- **Structure**: `.g` label plus `.bar > i` fill.
- **Variants**: hunger, energy, bond.
- **Spacing**: `--space-1` to `--space-2`.
- **States**: normal, low.
- **Accessibility**: visible text label is required.
- **Motion**: fill width updates directly with care state.
- **Surface**: track uses a soft sketch border and rounded pill; it should feel drawn, not like a system progress bar.

### Care Action Button

- **Structure**: native `button` in `#actions`.
- **Variants**: feed warm, rest cool, play rose.
- **Spacing**: 44px minimum touch height, compact horizontal padding on narrow screens.
- **States**: default, active.
- **Accessibility**: native button semantics.
- **Motion**: active press uses `transform: scale(0.96)`.
- **Surface**: pastel fill, soft ink outline, and a tiny stable tilt per button. Tilt must never break touch target alignment or text fit.

### Debug Growth Button

- **Structure**: native `button` fixed in the upper-left play space.
- **Purpose**: temporary development control for forcing the pet to adult stage during battle testing.
- **Spacing**: keep it below the hint when narrow screens wrap the hint.
- **States**: default, active, locked-looking when already adult or in stage preview.
- **Accessibility**: explicit accessible label; minimum touch target remains usable on mobile.
- **Surface**: small paper-label button using the hand font, soft ink outline, and stable tilt.
- **Constraint**: this is not part of the player-facing care economy and should stay visually secondary.

### Care Memory Line

- **Structure**: single `#memoryLine` text row above gauges.
- **Variants**: quiet default, latest care memory, routine completion memory.
- **Spacing**: compact bottom UI row.
- **States**: default, truncated if narrow.
- **Accessibility**: text is visible and concise.
- **Motion**: no decorative animation.

### Relationship Rank

- **Structure**: one compact `#bondBadge` fixed at the very top, containing `#rankLine` only.
- **Variants**: `유대 · 초면` through `유대 · 충신`.
- **Spacing**: separate from the tutorial sign; desktop centers it, mobile pins it to the top-left so it does not collide with `외출/기록`.
- **States**: rank updates from daily care, walk returns, and battle wins.
- **Accessibility**: visible text; details appear again inside the notebook.
- **Motion**: rank-up feedback uses existing captions and hearts only.

### Tutorial Sign

- **Structure**: top-center wall-hung hand-drawn sign containing only the short control hint.
- **Surface**: rectangular paper/wooden sign, not a pill; it uses soft sketch borders, subtle board grain, hanging strings, nail dots, and a small drop shadow so it reads like it is hung on the wall.
- **Spacing**: sits below the separate relationship rank and stays clear of the top-right outing/record buttons and top-left debug button on 320px+ mobile.
- **States**: static, text-only, never blocks canvas input.
- **Accessibility**: visible Korean text; no icon-only instruction.
- **Motion**: no decorative animation.

### Outing Menu

- **Structure**: fixed top-right `외출` paper-label button opens a bottom sheet containing 산책, 전투, 상점.
- **Spacing**: the trigger lives outside the bottom care row so the core care actions stay visually primary.
- **States**: unavailable while away, traveling, egg-stage, or already battling.
- **Accessibility**: native buttons; each refused action answers with pet text.
- **Motion**: same bottom-sheet slide as other menus.

### Record Menu

- **Structure**: fixed top-right `기록` paper-label button opens a bottom sheet containing 기억 and 수첩.
- **Spacing**: sits beside `외출` as a secondary global menu, not inside the care economy.
- **States**: closed, open, panel launched, subdued while away or traveling.
- **Accessibility**: native buttons open their existing panels.
- **Motion**: same bottom-sheet slide as other menus.

### Memory Panel

- **Structure**: `기록` menu entry opens a tonal-shift overlay panel separate from the notebook.
- **Variants**: today, yesterday, recent day, and old memory groups.
- **Spacing**: the trigger keeps a 44px touch target and leaves room for the top-left hint.
- **States**: closed, open, empty fallback through saved memory migration.
- **Accessibility**: native buttons open and close the panel; grouped headings are visible text.
- **Motion**: no decorative animation.
- **Surface**: tonal paper panel with a sketch outline; no drop shadows.

### Care Routine Memory

- **Structure**: saved care state tracks whether meal, rest, and petting happened in the current care cycle.
- **Variants**: first full routine, repeated full routine.
- **Spacing**: no extra UI; feedback appears through caption, hearts, bond gain, and memory line.
- **States**: partial cycle, completed cycle, reset for the next cycle.
- **Accessibility**: completion is visible as text, not only hearts.
- **Motion**: completion uses existing heart particles only.

### Care Traits

- **Structure**: hidden care history unlocks observed temperament traits.
- **Variants**: cuddly from repeated petting, foodie from repeated meals, mellow from repeated naps.
- **Spacing**: no stat panel; traits are revealed through memory line, captions, and autonomous behavior weights.
- **States**: undiscovered, newly revealed, persistent.
- **Accessibility**: first reveal is written in the memory line.
- **Visual Marks**: cuddly keeps a faint cheek tint, foodie adds tiny belly dots, mellow relaxes the ear angle.
- **Motion**: traits reuse existing behavior and particle motion.

### Food Bowl

- **Structure**: canvas bowl placed near the pet after `밥주기`.
- **Variants**: kibble, berry, leaf.
- **Spacing**: placed inside the lower play field so the pet can walk to it.
- **States**: waiting, being eaten, removed after eating.
- **Accessibility**: represented through the visible bowl and pet caption.
- **Motion**: pet walks to the bowl; chewing uses pet squash and small dust puffs.

### Fetch Ball

- **Structure**: canvas ball launched from the lower center by the play action.
- **Variants**: soft rose-orange ball body with one muted stitch curve.
- **Spacing**: target lands inside the lower play field and at least 120px from the pet.
- **States**: flying, rolling, waiting, chased, carried, fading out, timed out, practiced.
- **Accessibility**: the play action is a native button and pet captions report acceptance, refusal, completion, and timeout.
- **Motion**: ball reuses the pet's gravity scale, small bounces, ground friction, and existing chase/trip movement. Repeated fetch play subtly raises chase speed and lowers fetch-trip chance without exposing a number.

### Battle Loop

- **Structure**: a single action button sends the adult pet out of the home scene, changes to a training-ground location, starts auto battle there, then becomes cheer while a battle is active.
- **Variants**: unavailable before adult, walking to battle, start battle, cheer, ignored cheer, win, tired return.
- **Spacing**: no new gauge; battle uses canvas-only opponent and keeps the bottom control cluster compact on 320px+ mobile.
- **States**: inactive, active, cheered, won, tired.
- **Accessibility**: battle and cheer are native button actions, and every battle outcome has a visible pet caption and memory line.
- **Canvas HUD**: battle health uses a quiet in-world status strip with pet/opponent face dots and opposing fills, not floating dashboard labels such as "나/상대".
- **Outcome Readout**: win/loss appears as a short hand-drawn plaque in the battle ground. Loss should visibly hand off into the return-home motion.
- **Motion**: opponent is a simple procedural blob that enters from outside the map, then fights through recoil/knockback. A defeated opponent stays in the scene, bounces off the battle bounds, and only gets a small halo after settling; the player pet loss uses the xx-eyed roll-home motion.

### Place Travel

- **Structure**: canvas-only location state with `home`, `walk`, and `battle`; action buttons change labels instead of opening menus.
- **Variants**: home, leaving home, arriving outdoors, arriving at training ground, returning home.
- **Spacing**: no extra panel; the bottom controls may wrap to two lines on narrow mobile widths.
- **States**: idle at home, traveling, walking place, battle place, active battle.
- **Accessibility**: native buttons expose the same actions; captions confirm movement and arrival.
- **Motion**: the pet physically walks toward the screen edge before the background changes, then walks in from the opposite edge.

### Shiny Pebble Shop

- **Structure**: more-sheet entry opens a tonal overlay panel matching the notebook; pebble count appears only inside shop and notebook.
- **Variants**: wheel, window, cushion, and plant rows with procedural canvas previews, item note, and pebble cost.
- **Spacing**: list rows keep 44px minimum purchase targets and compact mobile-safe columns.
- **States**: not enough pebbles disables the row action; visible owned furniture reads as already at home; stored owned furniture reads as `꺼내기`. No error popup.
- **Accessibility**: native buttons purchase furniture, and the visible count explains affordance.
- **Motion**: panel motion reuses the bottom overlay language; furniture itself animates only on canvas after placement.

### Home Furniture

- **Structure**: bought furniture is stored in care state and drawn at fixed home anchors from place terrain data.
- **Variants**: wheel, window, cushion, plant. All use lumpy blob or tapered curve canvas grammar and the furniture color tokens.
- **Spacing**: anchors live in the home scene, not the bottom UI; furniture never adds a persistent home counter.
- **States**: owned, placed, stored, and autonomously used by the pet.
- **Accessibility**: furniture effects are reflected by pet captions and notebook observations.
- **Remove Target**: while a furniture item is being dragged, a top-center `치우기` sign appears; dropping there stores the item without refunding or deleting purchase ownership.
- **Motion**: wheel rotates while used, cushion gently breathes, plant leaves sway, window line drifts subtly.

### Body Notebook Scale

- **Structure**: notebook-only body section for tough, quick, and power using five procedural DOM paw marks.
- **Variants**: each stat pairs marks with one observation sentence and one smaller muted growth-path hint.
- **Spacing**: two-column compact rows fit narrow mobile panels.
- **States**: 0 to 5 filled marks, with no numeric stat text.
- **Accessibility**: text observation accompanies the non-numeric visual scale.
- **Motion**: static in the panel; body change is shown through pet movement.

### AI Line Fallback

- **Structure**: optional `/api/pet-line` proxy can generate a short pet-voice line; client falls back to static captions when unavailable.
- **Variants**: static-only local mode, server fallback, generated line.
- **Spacing**: no visible UI.
- **States**: idle, requested, accepted, failed silently.
- **Accessibility**: generated lines are text captions only; existing static text remains the reliable baseline.
- **Motion**: none.

### Gene-Based Pet Shape

- **Structure**: saved `protopet-genes` seed drives body color, blob lumps, ear spread, eye size, and tail length.
- **Variants**: subtle peach/cream body tones and small asymmetry changes.
- **Spacing**: no layout impact; canvas-only variation.
- **States**: persistent per browser profile, testable with `?seed=`.
- **Accessibility**: variation must not affect care controls.
- **Motion**: shares the same procedural animation rig.

### Growth Stage

- **Structure**: saved care state tracks `egg`, `baby`, and `adult`; URL preview may force a stage without changing saved progress.
- **Variants**: egg uses a single tinted oval with seed-based spots; baby keeps a smaller body, bigger lower eyes, shorter legs, smaller ears, and shorter tail; adult keeps the current PC-friendly silhouette with a slightly larger body and steadier movement.
- **Spacing**: stage scale changes the canvas pet only; bottom care UI remains the same three-gauge structure.
- **States**: egg, newly hatched baby, growing baby, newly adult, adult.
- **Accessibility**: unavailable actions are shown with subdued button state and still answer with pet captions when pressed.
- **Motion**: egg warms through rubbing and small wobble, hatching uses existing dust and heart particles, adult growth uses a short scale tween.

### Care Mood Face

- **Structure**: canvas face reads the saved care needs and current interaction state.
- **Variants**: neutral, hungry, tired, shy, content, held, landing.
- **Spacing**: face geometry stays inside the existing pet body.
- **States**: held and landing override care moods; sleep keeps closed eyes; mouth remains the same small `w` shape.
- **Accessibility**: mood is paired with captions and gauges, not expressed by facial shape alone.
- **Motion**: expression changes use immediate canvas redraws with no extra UI animation.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | immediate | n/a | Gauge updates |
| Press | browser frame | transform | Button active scale |
| Pet motion | simulation loop | spring-like | Body squash, feet, tail |
| Pet pose change | 0.35-0.65s | lerp/spring-like | Behavior transitions such as sleep, plop, belly, eating return |

### Rules

- Keep UI motion minimal; the pet animation carries the personality.
- Animate only transform or canvas-rendered motion.
- Behavior changes must preserve visual continuity: body scale, body center, feet/paws, eyes, and face position follow the new pose through `pet.pose` blending rather than switching frames immediately.
- Pointer interactions must support both mouse and touch.

## 7. Depth & Surface

### Strategy

Tonal-shift. The surface uses warm background bands and soft pet outlines rather than cards, shadows, or heavy borders.

### Rules

- Do not put care controls inside card shells.
- Keep the pet as the visual focus; UI is a quiet overlay.
