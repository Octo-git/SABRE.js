/*
 |   global-constants.js
 |----------------
 |  global-constants.js is copyright Patrick Rhodes Martin 2020.
 |
 |-
 */
/**
 * Defines karaoke modes.
 * @enum {number}
 */
sabre["KaraokeModes"] = Object.freeze({
    "OFF": 0,
    "COLOR_SWAP": 1,
    "COLOR_SWEEP": 2,
    "OUTLINE_TOGGLE": 3
});
/**
 * Defines passes.
 * @enum {number}
 */
sabre["RenderPasses"] = Object.freeze({
    "BACKGROUND": 0,
    "OUTLINE": 1,
    "FILL": 2
});
