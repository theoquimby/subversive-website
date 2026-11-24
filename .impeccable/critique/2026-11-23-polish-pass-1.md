# Polish pass 1: critique of every page (2026-11-23)

Method: every page captured as scrolled screens at 390 and 1280 px from a production build,
then read screen by screen as a critic, a PM and an owner would. Each finding names the
principle it breaks. Sources leaned on: Bringhurst, *The Elements of Typographic Style*
(measure, rhythm, figures); Butterick, *Practical Typography* (line length, hierarchy by
few means); Wathan and Schoger, *Refactoring UI* (de-emphasise instead of over-emphasise,
don't label what the position already says, white space as the first tool); Nielsen
Norman Group (redundancy, recognition over recall, links that say where they go); Müller-
Brockmann, *Grid Systems* (one grid, held).

Status: **fixed** in this pass, **proposed** (needs Theo's or Max's call), or **next**.

## Whole site

1. **fixed** Footer: the address and phone were set in the display face. Its figures are
   heavy and uneven at 18 px; "(518) 303-1270" read as a blot, and Visit sets the same
   two facts in the condensed face. One fact, one dress (consistency; Bringhurst on
   choosing figures that suit the text). Now the condensed face in both places.
2. **next** Phone footer is two full screens tall after a short page (About, Events). The
   link list could run three across at 390 px, saving about 120 px.
3. **next** The Safari-engine test suite flakes under full parallel load. Not visible to a
   visitor, but it will hide a real failure one day.

## Home

4. **fixed** "On tap" showed four cans in a row and then the same four beers as a list
   directly underneath: the same content twice (NN/g on redundancy), and on a wide screen
   the cans left two thirds of the row empty. Now one list, each can beside its beer.
5. **proposed** First screen, wide: the beer's name is held to two lines of space even for
   a one-line name, leaving a hole between the name and its style line. The space is there
   so the page does not jump between beers. Option: bottom-align the name in its block.
6. **proposed** "Coming up" is three Knicks games. True to the feed, but it reads as a
   sports bar. If Max wants the brewery's own events to lead, the feed needs a "feature"
   flag (an Ops field).
7. **next** The kitchen photo's burger is cut by the frame's bottom edge on a phone.

## Menu

8. **next** Wide screens: a group with an odd count leaves one row alone beside an empty
   column (Hoppy American Lager, Mushroom & Swiss). Balance columns by height.
9. **next** Phone: item descriptions wrap at about 32 characters while 60 px of the row
   stays empty to their right, under the price. Let descriptions run to the price column's
   edge (Butterick: 45 to 90 characters).
10. **proposed** "Updated October 23" sits beside the title. A month-old date reads as a
    stale menu. It should come from the menu data automatically or go.

## Events and event pages

11. **next** Event page, wide: the ticket, text and buttons fill the left half and the right
    half is empty night. A photo of the place or the bulb string dropping into that space
    would finish it.
12. **next** Month lists with an odd count leave a lone ticket and a hole.
13. **proposed** Every game row carries the same basketball glyph. When every row has the
    same mark it tells nothing (Refactoring UI). Keep it for the featured ticket only.

## Visit

14. **proposed** The small squiggles between stops are meant as a trail but read as stray
    pen marks, most of all on a wide screen where they float between columns. Either draw
    one continuous dotted path down the page or remove them.
15. **next** Phone: the two top photos start level with nothing; the address block and the
    buttons could tighten by one step.
16. **proposed** The copy for Seating, The tent and Gift cards is Claude's wording and
    still needs Max's eye.

## Our beer

17. **fixed** The library put "On tap now" on eleven rows of thirteen. A mark on nearly
    every row marks nothing. Now two groups under plain heads, "On tap now" and "Not on
    tap now", as the menu groups its beers.
18. **fixed** Wide screens: one column left a short line of text at the left and its price
    a page-width away (proximity). Now two columns.
19. **proposed** House cans (no label yet) carry type too small to read at list size. Max
    has labels for four more beers to send; until then the plain can could drop the name
    and show only the band, since the name is beside it.
20. **next** Most labels are wider than the can's face, so they are cropped at rest
    ("heap Dills", "oppy"). Scale each label to show its name whole.
21. **proposed** Fourteen photographs in an even grid is tidy but flat. A curated six with
    "See all" in the large view would have more shape.

## About, Private events, 404

22. **fixed** Private events, wide: the row of photographs ran past the text column and was
    cut off mid-photograph by nothing. Now three across, inside the column.
23. **next** Private events form: the "Email or phone. One is enough." hint sits between
    Name and Email, so it reads as belonging to Name. Move it under the two fields.
24. **next** About: the founders line ends the page abruptly; the photo could carry their
    names as a caption.
25. The 404 is the best page on the site. Leave it.
