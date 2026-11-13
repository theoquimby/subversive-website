# Icon audit (M1, spec §3.9)

Read from the /dev/kit icon sheet: 3× on the 24 px grid with the 18 px live area and the
20 px keyline circle, and at true size beside each label, in both skins.

The set's reference weight is the clock, the pin and the calendar: open shapes on the keyline,
one 2 px stroke, a small interior detail. Each icon below was judged against them.

| Icon | Finding | Why | Fix (applied) |
| --- | --- | --- | --- |
| dog | Reads as a cat or a devil, not a dog | Pointed ears and a narrowing muzzle are cat cues; the shape is spiky beside a calm set | Square head with two hanging ears cut like barley kernels, so it reads dog and belongs to the brand |
| stein | Heaviest icon in the set; reads as a barcode | Three inner verticals add 6 units of stroke inside an 10 × 17 body | Drop the inner lines; one foam line near the rim, handle kept |
| parking | Optically larger than the circles | A closed 16 × 18 box covers more area than an 18 px circle (squares need to sit inside the keyline) | Square brought to 16 × 16 (4–20), the P re-proportioned to it |
| glass | Generic pint, not their glass | The glyph and the photographs show a stemmed glass | Redrawn as the stemmed glass: bowl, stem, foot, head line |
| phone | Heavier than the set at true size | One large closed handset mass, edge to edge of the live area | Pulled in 1 unit on every side (4–20) |
| arrow, external | Look lighter than closed shapes | Open strokes always do; this is expected in a set | Kept; nudged 1 px toward their direction (CSS) |
| speaker on / off | Consistent with each other and the set | — | None |
| tent | Door lines slightly busy at 24 px | Two door strokes meet the frame near the ground line | Kept for now; revisit at 20 px if it is ever used that small |

Not verifiable without a person: how the dog and stein read to a stranger at 24 px on a phone.
