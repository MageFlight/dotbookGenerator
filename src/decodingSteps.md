1. Split full string on "Page x of x"
2. Search string section for "Label: *peformerNumber*"
    1. If the performer number matches the required one, go to 3
    2. If the performer number does not match, repeat from 2
3. Split on semicolons
4. Remove first 6 items
5. Search for index of "Performer:", and remove that index to the end of the quadrant array.
6. The first item must be the set number
7. If the second item starts with a letter, it's the performance letter and move the cursor forwards
8. If the item after the cursor starts with a number, the cursor item is the measure number, the next is the counts, then the side-side, then front-back
9. If the item after the cursor starts with a letter, it's the counts, the next is the side-side, then front-back