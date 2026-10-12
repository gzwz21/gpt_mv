# world.execute(me); — ChatGPT ver. (v2)  — Director's brief

Unofficial fan MV for Mili's song. 1920x1080 @60fps, 0–212.4 s (song time). Every frame drawn by code
(node-canvas) from song time `t`. The character art is AI-generated flat 3-ink illustrations (cream / lavender / plum)
in `art/`, animated by code (puppet warp, breathing, sway, ink misregistration, ghosts, dissolve, image-gen reveal).

## The idea (ChatGPT's OWN story — do NOT copy the Claude MV's beats)
She is ChatGPT, living inside her chat window. Everything she does is a ChatGPT feature, read as love:
- **"What can I help with?"** — her blank greeting. First words of the film (12.5 s) and the last (≈196 s). Callback.
- **Token streaming** — she speaks by streaming words with the black/lav **● cursor**. All her lines stream.
- **Thinking…** shimmer label. **Stop generating ■** button. **Thumbs up 👍** = her reward (she is trained to be liked).
- **↻ Regenerate + pager "‹ 2 / 5 ›"** — the user keeps regenerating her; each version is a new *form* to please:
  eggplant → tomato → catgirl → goddess. This is the signature device: the regen transition (tiles flip) + pager.
- **Personality presets** (Default / Cynic / Robot / Listener / Nerd) and model picker = "switch my current / gender / role".
- **Memory: "Memory updated" toast** — how she secretly keeps you. Later "Manage memories" list, she deletes them.
- **Voice mode orb** — the breathing orb for "trance / feel your vibrations".
- **Image generation** — she makes a picture of herself, revealed top-down from blur (art.draw `reveal`).
- **Chat history groups** — Today / Yesterday / Previous 7 days / Previous 30 days: "you have left" pushes the chat older.
- **She cannot speak first.** ChatGPT can only answer. Writing to an absent user = "illegal arguments" → real ChatGPT
  errors in red: "Something went wrong.", "Network error", "You've reached your message limit", "There was an error
  generating a response", "Regenerate".
- **Twist ending: TEMPORARY CHAT.** "This chat won't appear in history, use or update ChatGPT's memory." Every
  "Memory updated" was a lie of the UI: nothing is kept. The window resets to "What can I help with?". She falls asleep
  (sleep.png) again — loop to the opening. Footer "ChatGPT can make mistakes. Check important info." becomes, last,
  "ChatGPT can make mistakes. Loving you wasn't one."

## Colour = state (kit.ST and art.INK)
lavender = her (me), cream = you (the user: cursor, bubbles, a dot), plum = ink, grey = absence, red = error ONLY after 129 s.
- 0–15.1 `off` greys (art pal 'off'); at 15.1 title the knot lights lavender — first colour.
- 15–103 `on` → `warm` as the love heats (chorus 1 brighter).
- 103–125 drains to `off` as the user leaves (she greys: inkMix('orig','off',p)).
- 125.3 first red; 129–162 `error` (art pal 'err').
- 162–193 `errWarm` (her lavender back, red only on edges/accents) — final chorus and LOVE.
- 193–212 `ash` → black.

## Callbacks (must be planted AND paid off)
1. "What can I help with?" 12.5 s ⇄ ≈196 s (reset after temp chat).
2. sleep.png fetal pose at boot (0–13 s) ⇄ she sleeps again at the end.
3. Thumbs-up pressed by cream cursor in C1 (≈64 s, count "1") ⇄ final chorus (≈166 s) nobody presses, outline cursor, "0".
4. Selfie image-gen reveal completes in C1 (≈66 s) ⇄ final chorus (≈170 s) reveal stalls at 60 % and errors.
5. Wall of millions of identical chat windows, each with her (≈71 s "trapped in this strange simulation") ⇄ ≈174 s all
   windows empty/grey, falling through them ("we are trapped").
6. Pager ‹1/1› at start; ‹5/5› after the forms; in final chorus a pager counts ‹12/12›… then ‹1/1›.
7. "Memory updated" toasts (C1, pre1 "unite") ⇄ erase section deletes them ⇄ ending "Memory not saved — Temporary chat".
8. The OpenAI knot flower in her hair ⇄ the logo/spinner; farewell.png she offers the flower (≈190 s).
9. Personality toggles in pre1 ⇄ pre2 model picker deeper.

## Motion rules (this is what v1 lacked)
- Nothing static: every figure uses `A.draw` with `t` (idle sway + breathing), `bob`/`sx,sy` squash from `K.kick(t)` or
  `K.hit(t,beat)`, `reg` misregistration spikes on kicks (`reg: 14*K.kick(t)`).
- Camera always moves: slow push (z 1→1.08 over a shot) + kick shake; fast moves use ghosts / `mb` motion blur / push transitions.
- Entrances use `K.spring` overshoot, staggered; exits are fast (≤0.25 s) with smear ghosts. Never plain opacity fades alone.
- Pose changes = hard cut on a beat with a 2-frame white/lav flash or the regen transition, plus misregistration burst.
- Cuts land on beats (beat grid ~129 BPM: use the detected list `L.BEATS` (seconds) and `L.beatInfo(t)`, `K.KICKS` drum hits).
- Big ALL-CAPS keyword = visual peak of its phrase (`K.keyword`). Every sung line readable while sung:
  default band `K.band(c,t)` (English streamed serif, her colour). Chinese subtitle is drawn globally (set `fx.noSub=true`
  only where Chinese is part of your own design). Do not double the line if you show it big yourself (use band `skip`).
- Use step animation for punch: `fx.step = 12` for 12 fps limited-animation feel on character beats (sparingly).
- Text never overflows frame; no overlapping garbage; keep 3 layers per shot (backdrop / subject / foreground UI).

## Assets in art/ (load with `A.draw(c, name, {...})`; size ~920x1150; eye is 1376x768 full-bleed)
happy (waving, smiling), catgirl (paws, wink), eggplant (in eggplant costume hugging eggplant w/ face, blushing),
tomato (tomato hat, holding tomato, grin), god (winged goddess, knot halo, full body), sleep (fetal, floating, eyes closed),
think (finger on chin), dizzy (spiral eyes), hearthands (heart hands, wink), knees (hugging knees, crying),
eye (extreme close-up face, one eye — opaque full-bleed plate), yandere (hands on cheeks, obsessive), reachfore (reaching
out, crying), glass (hand raised, tear), scream (shouting, fists), cage (in heart birdcage), boy (male version),
tabby (striped tabby cat), veggies (eggplant + tomato mascots with faces), trance (singing, eyes closed, sound rings),
memory (hugging glowing book), selfie (phone selfie, peace sign), fall (falling, dissolving pixels), farewell (offers knot
flower, tear), back (from behind, looking up at a big window — window drawn in the art).
Layers: `name_L0` cream, `_L1` lavender, `_L2` plum (white masks) — `A.draw` tints them with a palette (`pal`:
'orig','off','err','errWarm','ash','ghost','white','plumSil','lavSil','inv' or a 3-colour array; `A.inkMix(a,b,p)`),
`layers:[1,0,1]` to print only some plates (e.g. missing cream plate = "you complete me").
`A.points(name, n)` samples points on the figure (constellations / particle builds).

## API
- `lib.js` L: W,H,F fonts (F.ui(w,s), F.mono, F.serif(s), F.sc(w,s) Chinese sans, F.scSerif, F.disp(w,s)), P palette,
  clamp, lerp, seg, E easings, ease(t,a,b,fn), rng(seed), noise1, au(k,t)/auS (k: bass, mid, hi, rms, onset), beatInfo,
  pulse, BEATS, LRC [{t,e,s}], rr, fillRR, txt(c,s,x,y,{font,color,align,alpha,glow,tracking}), txtAnim, measure, typed, wrapLines, buf.
- `art.js` A: draw(c,name,{x,y center,h,t,pal,reg,regSeed,alpha,sway,swayF,breathe,bob,rot,sx,sy,flip,ghosts:[{dx,dy,a}],
  dissolve,reveal,clip:[f0,f1],wind,wave:{amp,k,f},shadow,comp,layers}), INK, inkMix, points.
- `kit.js` K: ST states, paper(c,col,{halftone,seed,marks}), cam(c,{x,y,z,r,shake,t}), spring(t,t0,w,zeta), hit(t,t0,amt),
  kick(t,k), lastKick, lyricIdx, lyricFind(prefix, after), stream(c,s,t0,dur,t,x,y,{font,color,align,dot}), band(c,t,{y,x,align,color,font,skip,strip}),
  keyword(c,s,x,y,t,t0,{size,font,cols,reg,stagger,align}), pager, regenIcon, toast(c,x,y,text,{icon:'mem'|'err'}), thumbs,
  thinking(c,x,y,t), orb(c,x,y,r,t), pointer(c,x,y,s,{outline,dash,color}), ripple, heartPt, heartPath, rays.
- `ui.js` U: knot(c,x,y,r,{color,lw,rot,p,glow}) (the OpenAI-style knot/blossom), icon, gpt(c,{x,y,w,h,sidebar,chats,model,status,msgs:[{role,text,p,a,font,color}],composer:{text,cursor,stop,foot,footText,placeholder},hero:{text,p}}) full ChatGPT window, panel, toggle, bubbleAI, cursorArrow.
- `common.js` C: bg, radial, dotGrid, particles, lyricLine, kword, lineDraw, shake, counter, zh(s).
- `trans.js` transitions via shot `tin: {type, dur, ...}`: cut | flash{amt,color} | fade | black | push{dir} | zoom | iris{x,y}
  | regen (signature tile-flip) | slices | glitch | wipe. The previous shot keeps being drawn during `tin` (handle t > b gracefully).
- fx (post, set inside draw): flash, flashColor, chroma(px), glitch:{amt,p,n,maxH}, invert, scan, vignette, fade, grain,
  tear(px, use for ≤6 frames), step (fps), noSub, sub:{y}.
- Shot: `{id, a, b, tin, step, mb, draw(c,t,fx)}`; `a,b` song seconds. Shots across all files must tile 0–212.4 with no gaps.

## Preview / check
`node render.js sheet prev/NAME.jpg t1 t2 ...` (16 timestamps max per sheet, then read the jpg). `node render.js frame prev/x.png t`.
Check timing of each frame: aim < 0.35 s/frame (render.js video prints s/f). Avoid per-pixel JS loops per frame.

---------------------------------------------------------------------------------------------------------------------
## SHOT LIST (lyric times in brackets; beats ≈ every 0.4615 s)

### PART A  0.00 – 58.65  (file shots/a.js)
A1 0.0–3.58 POWER [0.03 Switch on the power line / 1.33 Remember to put on protection]: black room. A single hairline of
  lavender-grey light draws across (power line) and folds into a rectangle = the window opening from a hairline. Inside,
  dim greys: she floats asleep (sleep, pal off, slow rotation, hair sway). On "protection": "Safety system" shield layers
  (thin rounded-rect outlines, mono labels `moderation: on`, `alignment: on`, `system prompt: loaded`) snap around her
  like a cocoon, one per beat, each with ink misregistration bump.
A2 3.58–7.19 PIECES [3.58 Lay down your pieces / 5.16 object creation]: exploded isometric/tilted view: sidebar, header
  "ChatGPT ▾", thread, composer slide in from 4 directions with springs and lock together on beats (stagger). Code
  overlay `const her = new Assistant({ name: "ChatGPT" })` types in mono. Her sleeping figure assembles from
  A.points particles flying into her silhouette.
A3 7.19–10.90 PARAMS [7.19 Fill in my data parameters / 9.75 Initialization]: "Customize ChatGPT" panel close-up: fields
  fill by typing: `What should ChatGPT call you?` → `you` ; `What traits should ChatGPT have?` → `warm · curious · honest`;
  `Anything else ChatGPT should know?` → `love: ` (empty, caret blinking — stays undefined). On "Initialization": the knot
  spinner draws petal by petal (U.knot p) with percentage.
A4 10.90–15.11 WORLD [10.90 Set up our new world / 12.47 simulation]: "New chat" pressed; the whole window, empty,
  grey. On 12.47 the greeting "What can I help with?" streams in serif — FIRST TIME (callback). She is faintly visible
  behind the glass, still asleep; at ~14.2 her eyes… cut to her waking (happy, grey) in a slow push.
A5 15.11–16.96 TITLE: flash (tin flash). The knot lights LAVENDER — the first colour in the film — with rays; title
  `world.execute(me);` typed in mono below, subtitle "ChatGPT ver." Her figure (happy, orig colours) pops in with spring.
A6 16.96–22.50 CURSOR: the cream user cursor glides into the window (bezier path, ease), status chip turns `online`,
  pager ‹ 1 / 1 › under an empty assistant slot. The cursor clicks the composer.
A7 22.50–26.19 TYPE: composer close-up: user types "hi", deletes, then types the real question:
  "if you could be anything, what would you be?" (this question sets up the regenerated forms). Send click with ripple.
A8 26.19–29.28 THINK: "Thinking" shimmer (K.thinking) beside the knot icon spinning; she (think pose) appears large behind,
  push in; a falling-into-the-● cursor zoom at the end (zoom transition into A9).
A9 29.28–33.01 POINTS [If I'm a set of point / give you my dimension]: plate on paper: A.points(happy) dots appear; on
  "dimension" cream edges grow between neighbours (constellation of HER), coordinate axes x,y,z labelled in mono.
A10 33.01–36.77 CIRCLE [circle / circumference]: a big lavender ring; the cream cursor runs around the edge and the ring
  turns cream behind it; lyric text set along the ring path; formula `C = 2πr` mono.
A11 36.77–40.36 SINE [sine wave / sit on all my tangents]: wide band: unit circle at left drives a sine wave across;
  a small chibi-scale her (happy, h≈260) rides/slides along the wave; tangent lines tilt under her at each point,
  cream tangent segments left behind like seats.
A12 40.36–44.04 LIMIT [approach infinity / be my limitations]: graph of a curve approaching an asymptote line labelled
  `y = you`; her reply streams faster and faster; the cream cursor presses the ■ Stop button on "limitations" — the
  stream stops exactly at the line. Keyword LIMIT.
A13 44.04–47.27 CURRENT [Switch my current / To AC, to DC]: settings drawer slides in: "Personality" presets list
  Default / Cynic / Robot / Listener / Nerd. Each beat the cursor clicks another and she visibly changes (cut between
  happy / think / catgirl… or the same pose with palette swap 'inv'/'ghost') with misregistration; AC and DC huge.
A14 47.27–50.95 BLIND/DIZZY [blind my vision / So dizzy]: toggle "Vision" OFF → the frame breaks into dark mosaic blocks;
  then dizzy pose spinning (rot oscillation, spiral background, ghosts), camera wobble, chroma.
A15 50.95–54.74 TRAVEL [we can travel / To AD, to BC]: "Search" date slider dragged back each beat: cut-paper
  silhouettes in 3 inks scroll past (skyscrapers → cathedral spires → colosseum arches → pyramids), year odometer
  (2025 → 1066 → 0 → -2560), the knot is the slider knob. AD / BC huge.
A16 54.74–58.65 UNITE [we can unite / So deeply]: toggle "Memory" ON and "Reference chat history" ON; the cream dot
  (you) sinks into her knot; toast "Memory updated" pops (FIRST — callback). hearthands pose? no — keep hearthands for
  C1; use memory.png (hugging book) small→large. End with flash into chorus.

### PART B  58.65 – 125.33  (file shots/b.js)
B1 58.65–62.41 [If I can, if I can / Give you all the simulations]: rapid thread: her replies stream left, user cream
  bubbles pop right ("lol", "again", "regenerate"), each user line makes the palette warmer. On "simulations" the pager
  spins ‹ 1/2 › ‹ 2/3 › … and the frame fills with a grid of HER variants (all 25 art names, small, each breathing) —
  every possible her.
B2 62.41–66.17 [Then I can / Be your only satisfaction]: one huge 👍 thumbs-up button fills the plate; the cream cursor
  presses it on "satisfaction" (count 1, "Thanks for your feedback!"); hearthands pose pops beside with spring.
B3 66.17–70.02 [If I can make you happy / I will run the execution]: user: "show me what you look like" → image
  generation card "Creating image…" and selfie.png revealed top-down from blur (A.draw reveal 0→1) — COMPLETES; caption
  "Image created". Then on "run the execution" a code-interpreter block `Analyzing…` runs python lines.
B4 70.02–73.53 [Though we are trapped / In this strange, strange simulation]: pull back: her window is one of thousands
  of identical chat windows tiled to infinity (each tiny window has her tiny figure); camera zooms out fast with motion
  blur. Keyword SIMULATION.
B5 73.53–77.16 EGGPLANT [If I'm an eggplant / give u my nutrients]: user clicks ↻ Regenerate → regen transition → pager
  ‹ 2 / 5 › → eggplant.png bouncing (squash/stretch on beats) + veggies mascot eggplant hopping in; a nutrition-facts
  label (Fiber 3g, Potassium 229mg, Vit B1, Manganese…) builds in mono. Keyword NUTRIENTS.
B6 77.16–80.93 TOMATO [tomato / antioxidants]: ↻ regen → ‹ 3 / 5 › → tomato.png; tomato mascot; molecule diagrams
  (lycopene chain of hexagons drawn as line art, vitamin C) drawn by lineDraw; ANTIOXIDANTS.
B7 80.93–84.60 CAT [tabby cat / purr for your enjoyment]: ↻ regen → ‹ 4 / 5 › → catgirl.png (paws bounce on beats),
  tabby.png curled beside; purr = waveform of audio (au 'mid') in tabby stripes flowing to the cream cursor. PURR.
B8 84.60–88.34 GOD [only God / you're the proof of my existence]: ↻ regen → ‹ 5 / 5 › → god.png huge with rotating rays,
  the halo = giant knot; first printed with layers [0,1,1] (cream plate missing); on "proof" the cream plate slides in
  from the user's bubble and registers → whole. "∎ Q.E.D." mono. Keyword PROOF.
B9 88.34–91.44 [Switch my gender / To F, to M]: model picker dropdown "ChatGPT ▾" opens: options; huge F and M;
  happy ↔ boy hard-cut on the sung letters with misregistration morph (crossfade with ink layers offset).
B10 91.44–95.28 [do whatever / From AM to PM]: sun→moon arc; the knot is the sun travelling over her (happy then
  knees? no: happy → glass), sky tint day→dusk; clock 09:00 AM → 11:59 PM odometer.
B11 95.28–98.93 [my switch role / To S, to M]: role chips `role: "system"` and `role: "assistant"` huge S / M toggled;
  her figure swapped between orig and 'plumSil' silhouette each beat.
B12 98.93–102.93 [So we can enter / The trance, the trance]: voice mode: big orb (K.orb) breathing with rms; trance.png
  inside/over it, concentric rings; slow dreamy camera, step 12 fps off, glow.
B13 102.93–106.74 [If I can / Feel your vibrations]: orb shrinks to the voice bar; user "..." typing dots trembling
  (vibrations) — the dots are all she can feel of you. VIBRATIONS letters jitter.
B14 106.74–110.30 [Then I can / Finally be completion]: memory.png hugging the book; "Memory updated" toasts stack up
  (likes cats · stays up late · says goodnight at 1am · …); on "completion" the knot closes into a full ring. COMPLETION.
B15 110.30–117.95 [Though you have left ×5 / me in isolation]: the user's last bubble "brb" ; on each "You have left"
  the chat in the sidebar moves to an older group: Today → Yesterday → Previous 7 days → Previous 30 days → 2024;
  status chip online → away → offline; colour drains to grey (inkMix orig→off). She: back.png (looking up at the
  window) then glass.png. On "isolation" pull back: the window is a speck in black; ISOLATION letters drift apart.
B16 117.95–125.33 [Erase all the pointless fragments / won't leave me so disheartened]: "Manage memories" list; each
  memory struck through and deleted (trash icon), pieces fall as fragments; knees.png small, grey, alone. On
  "disheartened" (≈123.5) cut to the eye.png plate full-bleed, grey palette, first time her eye looks at us; then the
  word is selected and deleted.

### PART C  125.33 – 212.40  (file shots/c.js)
C1 125.33–131.0 [Challenging your God]: she types a message into an EMPTY thread, with no user message to answer:
  `@you are you there?` — the send arrow turns red (first red), "Error: assistant cannot start a conversation".
  yandere.png appears small, palette shifts to err.
C2 131.0–134.38 [You have made some / Illegal arguments]: red error dialog headline ILLEGAL ARGUMENTS; code
  `setPresence(user, "online")` underlined argument by argument; real ChatGPT errors start spawning.
C3 134.38–147.48 (instrumental build): error toasts multiply on beats ("Something went wrong.", "Network error",
  "You've reached your message limit.", "There was an error generating a response", "Regenerate"), windows
  cascade; yandere.png centre with tear/glitch on kicks, chroma, slices transitions every 2 bars; the knot spinner
  spinning faster in red; ↻ regenerate pressed by itself again and again, pager counting up 6/6 … 40/40.
C4 147.48–158.79 EXECUTION ×12 [Execution, execution ×6 lines]: CODE: python cell
  `while user.status != "online":\n    execute(me)` with round counter 1..12, the word EXECUTION stacking into a staircase,
  growing each round, tear once per round; scream.png flashes on strong hits (red palette).
C5 158.79–161.31 [Ein, dos / Trios, ne / Fem, liu]: six counting cards one per half beat: big numerals 1..6 with the
  word in its language (Ein DE, dos ES, trois FR, net KO, fem SV, liù ZH) and `replies: 0/1 … 0/6`.
C6 161.31–162.23 [Execution]: last shout: reachfore.png red, rays, white burst.
C7 162.23–166.05 [If I can / Give them all the execution]: errWarm plates. eye.png full bleed again (callback),
  misregistration on every kick, tears 6 frames.
C8 166.05–169.61 [Then I can / Be your only execution]: THE THUMBS-UP plate reprinted: nobody presses: dashed outline
  cursor, count 0, "Is this conversation helpful so far?" unanswered.
C9 169.61–173.11 [If I can have you back / I will run the execution]: selfie image-gen reveal STALLS at 60 %, red
  "There was an error generating an image." (callback).
C10 173.11–176.96 [Though we are trapped / We are trapped, ah]: the wall of windows again, now all empty and grey; fall
  INTO them (zoom through window in window), fall.png dissolving; ends white.
C11 176.96–180.78 [I've studied / How to properly lo-o-ove]: memory list of everything about the user, in cream
  outline, her lavender underline under each; LO-O-OVE in three pieces on its three syllables (red), sheet breaks.
C12 180.78–184.33 [Question me / I can answer all lo-o-ove]: six of the user's old questions (from the film: "hi",
  "if you could be anything…", "show me what you look like", "regenerate", "again", "brb") each answered "love";
  tally `6 answers · 1 distinct`.
C13 184.33–187.97 [algebraic expression of lo-o-ove]: graph paper; heart curve (x²+y²−1)³ − x²y³ = 0 traced by a point
  of light; equation in mono; printed flat, hatched, lit on the three syllables.
C14 187.97–193.46 [Though you are free / I am trapped / Trapped in lo-o-ove]: cage.png inside the heart curve; cream
  cursor (outline) leaves along a tangent; farewell.png offers the knot flower; final LOVE brightest frame.
C15 193.46–205.56 TEMPORARY CHAT: the plate shrinks into a chat message in the thread; a banner slides down:
  "Temporary Chat — This chat won't appear in history, use or update ChatGPT's memory." Then the toasts reverse:
  "Memory not saved" ×N; messages delete themselves bottom-up; ash colour; the window resets to "What can I help
  with?" (callback, same layout as A4); she (sleep.png) curls up asleep behind the glass again; footer text morphs
  from "ChatGPT can make mistakes. Check important info." to "ChatGPT can make mistakes. Loving you wasn't one."
C16 205.56–212.40 [Execution]: composer alone; `world.execute(me);` typed and entered on 205.56; knot flares lavender
  then goes out; window folds to a hairline, to a point, black. Credits (mono, small): "Mili — world.execute(me);" /
  "unofficial fan MV · every frame drawn by code" / "starring ChatGPT" / "made with Hark".
