/*
 |   canvas-2d-text-renderer.js
 |----------------
 |  canvas-2d-text-renderer.js is copyright Patrick Rhodes Martin 2019.
 |
 |-
 */
/**
 * @fileoverview advanced stubstation alpha subtitles text renderer.
 */
//@include [util.js]
//@include [global-constants.js]
//@include [color.js]
//@include [style.js]
//@include [style-override.js]
//@include [subtitle-event.js]
sabre.import("util.min.js");
sabre.import("global-constants.min.js");
sabre.import("color.min.js");
sabre.import("style.min.js");
sabre.import("style-override.min.js");
sabre.import("subtitle-event.min.js");

const text_renderer_prototype = global.Object.create(Object, {
    _initialized: {
        /**
         * Is the text renderer initialized.
         * @type {boolean}
         */
        value: false,
        writable: true
    },

    _dpi: {
        /**
         * Dpt to pixel Ratio
         * @type {number}
         */
        value: 1,
        writable: false
    },

    _canvas: {
        /**
         * The canvas for the text renderer.
         * @type {?HTMLCanvasElement|?OffscreenCanvas}
         */
        value: null,
        writable: true
    },

    _ctx: {
        /**
         * The canvas context for the text renderer.
         * @type {CanvasRenderingContext2D}
         */
        value: null,
        writable: true
    },

    _offsetX: {
        /**
         * The offset in the x coordinate.
         * @type {number}
         */
        value: 0,
        writable: true
    },

    _offsetY: {
        /**
         * The offset in the y coordinate.
         * @type {number}
         */
        value: 0,
        writable: true
    },

    _width: {
        /**
         * The width of the canvas.
         * @type {number}
         */
        value: NaN,
        writable: true
    },

    _height: {
        /**
         * The height of the canvas.
         * @type {number}
         */
        value: NaN,
        writable: true
    },

    _init: {
        /**
         * Initializes the rendering canvas.
         */
        value: function () {
            const options = Object.freeze({
                "alpha": true,
                "desynchronized": true
            });
            if (typeof global.OffscreenCanvas === "undefined") {
                this._canvas = global.document.createElement("canvas");
                this._canvas.height = this._canvas.width = 64;
            } else {
                this._canvas = new global.OffscreenCanvas(64, 64);
            }
            this._height = this._width = 1;
            this._ctx = this._canvas.getContext("2d", options);
            this._initialized = true;
        },
        writable: false
    },

    _calcScale: {
        /**
         * Calc scale, handing transitions.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         */
        value: function (time, style, overrides) {
            let transitionOverrides = overrides.getTransitions();
            let scaleX = overrides.getScaleX() ?? style.getScaleX();
            let scaleY = overrides.getScaleY() ?? style.getScaleY();
            for (let i = 0; i < transitionOverrides.length; i++) {
                scaleX = sabre.performTransition(
                    time,
                    scaleX,
                    transitionOverrides[i].getScaleX(),
                    transitionOverrides[i].getTransitionStart(),
                    transitionOverrides[i].getTransitionEnd(),
                    transitionOverrides[i].getTransitionAcceleration()
                );
                scaleY = sabre.performTransition(
                    time,
                    scaleY,
                    transitionOverrides[i].getScaleY(),
                    transitionOverrides[i].getTransitionStart(),
                    transitionOverrides[i].getTransitionEnd(),
                    transitionOverrides[i].getTransitionAcceleration()
                );
            }
            return { x: scaleX / 100, y: scaleY / 100 };
        },
        writable: false
    },

    _setScale: {
        /**
         * Sets up the canvas to render to the correct scale.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         * @param {SSALineStyleOverride} lineOverrides
         * @param {SSALineTransitionTargetOverride} lineTransitionTargetOverrides
         * @param {number} pass
         */
        value: function (
            time,
            style,
            overrides,
            lineOverrides,
            lineTransitionTargetOverrides,
            pass
        ) {
            let scale = this._calcScale(time, style, overrides);
            this._ctx.scale(scale.x * this._dpi, scale.y * this._dpi);
        },
        writable: false
    },

    _calcOutline: {
        /**
         * Calc outline width, handing transitions.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         */
        value: function (time, style, overrides) {
            let transitionOverrides = overrides.getTransitions();
            let outlineX = overrides.getOutlineX() ?? style.getOutlineX();
            let outlineY = overrides.getOutlineY() ?? style.getOutlineY();
            for (let i = 0; i < transitionOverrides.length; i++) {
                outlineX = sabre.performTransition(
                    time,
                    outlineX,
                    transitionOverrides[i].getOutlineX(),
                    transitionOverrides[i].getTransitionStart(),
                    transitionOverrides[i].getTransitionEnd(),
                    transitionOverrides[i].getTransitionAcceleration()
                );
                outlineY = sabre.performTransition(
                    time,
                    outlineY,
                    transitionOverrides[i].getOutlineY(),
                    transitionOverrides[i].getTransitionStart(),
                    transitionOverrides[i].getTransitionEnd(),
                    transitionOverrides[i].getTransitionAcceleration()
                );
            }
            return { x: outlineX, y: outlineY };
        },
        writable: false
    },

    _setOutline: {
        /**
         * Set outline width to the correct size.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         * @param {SSALineStyleOverride} lineOverrides
         * @param {SSALineTransitionTargetOverride} lineTransitionTargetOverrides
         * @param {number} pass
         */
        value: function (
            time,
            style,
            overrides,
            lineOverrides,
            lineTransitionTargetOverrides,
            pass
        ) {
            let outline = this._calcOutline(time, style, overrides);

            this._ctx.lineWidth = Math.min(outline.x, outline.y) * 2;
        },
        writable: false
    },

    _calcFontSize: {
        /**
         * Calc font size, handing transitions.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         */
        value: function (time, style, overrides) {
            let transitionOverrides = overrides.getTransitions();
            let fontSize =
                (overrides.getFontSize() ?? style.getFontSize()) +
                overrides.getFontSizeMod();
            for (let i = 0; i < transitionOverrides.length; i++) {
                fontSize = sabre.performTransition(
                    time,
                    fontSize,
                    transitionOverrides[i].getFontSize(),
                    transitionOverrides[i].getTransitionStart(),
                    transitionOverrides[i].getTransitionEnd(),
                    transitionOverrides[i].getTransitionAcceleration()
                );
            }
            return fontSize;
        },
        writable: false
    },

    _setFont: {
        /**
         * Set font settings for drawing.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         * @param {SSALineStyleOverride} lineOverrides
         * @param {SSALineTransitionTargetOverride} lineTransitionTargetOverrides
         * @param {number} pass
         */
        value: function (
            time,
            style,
            overrides,
            lineOverrides,
            lineTransitionTargetOverrides,
            pass
        ) {
            let fontSize = this._calcFontSize(time, style, overrides);
            let fontName = overrides.getFontName() ?? style.getFontName();
            let fontWeight = overrides.getWeight() ?? style.getWeight();
            let fontItalicized = overrides.getItalic() ?? style.getItalic();
            let font = "100px '" + fontName + "', 'Arial', 'Open Sans'";
            font = fontWeight + " " + font;
            if (fontItalicized) font = "italic " + font;
            this._ctx.font = font;
            let fontSizeRatio =
                100 / this._ctx.measureText("jI").actualBoundingBoxDescent;
            font =
                fontSize * fontSizeRatio +
                "px '" +
                fontName +
                "', 'Arial', 'Open Sans'";
            font = fontWeight + " " + font;
            if (fontItalicized) font = "italic " + font;
            this._ctx.font = font;
        },
        writable: false
    },

    _setColors: {
        /**
         * Set the colors for the subtitle.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         * @param {SSALineStyleOverride} lineOverrides
         * @param {SSALineTransitionTargetOverride} lineTransitionTargetOverrides
         * @param {number} pass
         */
        value: function (
            time,
            style,
            overrides,
            lineOverrides,
            lineTransitionTargetOverrides,
            pass
        ) {
            if (
                pass === sabre.RenderPasses.BACKGROUND &&
                style.getBorderStyle() !== sabre.BorderStyleModes.SRT_STYLE &&
                style.getBorderStyle() !== sabre.BorderStyleModes.SRT_NO_OVERLAP
            ) {
                this._ctx.fillStyle = "rgba(255,0,255,1)";
            } else {
                if (
                    (overrides.getKaraokeMode() ===
                        sabre.KaraokeModes.COLOR_SWAP ||
                        overrides.getKaraokeMode() ===
                            sabre.KaraokeModes.COLOR_SWEEP) &&
                    time < overrides.getKaraokeStart()
                )
                    this._ctx.fillStyle = "rgba(0,255,0,1)";
                else if (
                    overrides.getKaraokeMode() ===
                        sabre.KaraokeModes.COLOR_SWEEP &&
                    time < overrides.getKaraokeEnd()
                ) {
                    let progress =
                        Math.max(time - overrides.getKaraokeStart(), 0) /
                        (overrides.getKaraokeEnd() -
                            overrides.getKaraokeStart());
                    let gradient = this._ctx.createLinearGradient(
                        0,
                        0,
                        this._width,
                        0
                    );
                    gradient.addColorStop(0, "rgba(255,0,0,1)");
                    gradient.addColorStop(progress, "rgba(255,0,0,1)");
                    gradient.addColorStop(
                        progress + 1 / this._width,
                        "rgba(0,255,0,1)"
                    );
                    gradient.addColorStop(1, "rgba(255,0,0,1)");
                } else {
                    this._ctx.fillStyle = "rgba(255,0,0,1)";
                }

                if (
                    overrides.getKaraokeMode() ===
                        sabre.KaraokeModes.OUTLINE_TOGGLE &&
                    time < overrides.getKaraokeStart()
                ) {
                    this._ctx.strokeStyle = "rgba(0,0,255,0)";
                } else {
                    this._ctx.strokeStyle = "rgba(0,0,255,1)";
                }
            }
        },
        writable: false
    },

    _calcSpacing: {
        /**
         * Calc spacing, handing transitions.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         */
        value: function (time, style, overrides) {
            let transitionOverrides = overrides.getTransitions();
            let spacing = overrides.getSpacing() ?? style.getSpacing();
            for (let i = 0; i < transitionOverrides.length; i++)
                spacing = sabre.performTransition(
                    time,
                    spacing,
                    transitionOverrides[i].getSpacing(),
                    transitionOverrides[i].getTransitionStart(),
                    transitionOverrides[i].getTransitionEnd(),
                    transitionOverrides[i].getTransitionAcceleration()
                );
            return spacing;
        },
        writable: false
    },

    _handleStyling: {
        /**
         * Sets up the canvas to render according to specified styles.
         * @param {number} time
         * @param {SSAStyleDefinition} style
         * @param {SSAStyleOverride} overrides
         * @param {SSALineStyleOverride} lineOverrides
         * @param {SSALineTransitionTargetOverride} lineTransitionTargetOverrides
         * @param {number} pass
         */
        value: function (
            time,
            style,
            overrides,
            lineOverrides,
            lineTransitionTargetOverrides,
            pass
        ) {
            this._ctx.resetTransform();
            this._ctx.textAlign = "left";
            this._ctx.textBaseline = "top";
            this._ctx.lineCap = "round";
            this._ctx.lineJoin = "round";
            //TODO: Strikeout/Strikethrough
            this._setOutline(
                time,
                style,
                overrides,
                lineOverrides,
                lineTransitionTargetOverrides,
                pass
            );
            this._setFont(
                time,
                style,
                overrides,
                lineOverrides,
                lineTransitionTargetOverrides,
                pass
            );
            this._setColors(
                time,
                style,
                overrides,
                lineOverrides,
                lineTransitionTargetOverrides,
                pass
            );
            this._setScale(
                time,
                style,
                overrides,
                lineOverrides,
                lineTransitionTargetOverrides,
                pass
            );
        },
        writable: false
    },

    _drawTextWithRelativeKerning: {
        /**
         * Draws text with relative kerning.
         * @param {string} text the text.
         * @param {number} offsetX the offset of the text in the x coordinate.
         * @param {number} offsetY the offset of the text in the y coordinate.
         * @param {number} kerning the amount to kern by.
         * @param {boolean} stroke if true, stroke text, if false fill it.
         */
        value: function (text, offsetX, offsetY, kerning, stroke) {
            let func = stroke ? this._ctx.strokeText : this._ctx.fillText;
            let letter_offset = 0;
            for (let i = 0; i < text.length; i++) {
                func.call(
                    this._ctx,
                    text[i],
                    offsetX + (kerning * i + letter_offset),
                    offsetY
                );
                letter_offset += this._ctx.measureText(text[i]).width;
            }
        },
        writable: false
    },

    "renderEvent": {
        /**
         * Render an event.
         * @param {number} time the time relative to the start of the event.
         * @param {SSASubtitleEvent} event the subtitle event to render
         * @param {number} pass the pass we are on.
         * @param {boolean} dryRun is this a dry run for positioning.
         */
        value: function (time, event, pass, dryRun) {
            if (!this._initialized) this._init();

            let text = event.getText();
            let style = event.getStyle();
            let overrides = event.getOverrides();
            let lineOverrides = event.getLineOverrides();
            let lineTransitionTargetOverrides =
                event.getLineTransitionTargetOverrides();

            this._offsetX = this._offsetY = 0;

            this._handleStyling(
                time,
                style,
                overrides,
                lineOverrides,
                lineTransitionTargetOverrides,
                pass
            );

            //These are used in multiple places, so to avoid recalculation we put it in the function scope.
            let spacing = this._calcSpacing(time, style, overrides);
            let scale = this._calcScale(time, style, overrides);

            //calculate size of text without scaling.
            {
                let fontSize = this._calcFontSize(time, style, overrides);
                if (spacing === 0) {
                    this._width = this._ctx.measureText(text).width;
                } else {
                    this._width = 0;
                    for (let i = 0; i < text.length; i++)
                        this._width += this._ctx.measureText(text[i]).width;
                    this._width += spacing * (text.length - 1);
                }
                this._height = fontSize;
            }

            let borderStyle = event.getStyle().getBorderStyle();

            //pad for outline
            let outline_x = 0;
            let outline_y = 0;

            if (
                pass === sabre.RenderPasses.OUTLINE ||
                pass === sabre.RenderPasses.BACKGROUND
            ) {
                let outline = this._calcOutline(time, style, overrides);
                this._width += outline.x * 2;
                this._height += outline.y * 2;
                this._offsetX -= outline.x;
                this._offsetY -= outline.y;
                outline_x = outline.x;
                outline_y = outline.y;
            }

            let offsetXUnscaled = -this._offsetX;
            let offsetYUnscaled = -this._offsetY;

            if (pass === sabre.RenderPasses.BACKGROUND) {
                if (
                    borderStyle !== sabre.BorderStyleModes.NONE &&
                    borderStyle !== sabre.BorderStyleModes.SRT_STYLE &&
                    borderStyle !== sabre.BorderStyleModes.SRT_NO_OVERLAP
                ) {
                    let shadowComponent =
                        Math.sign(style.getShadow()) *
                        Math.sqrt(Math.pow(style.getShadow(), 2) / 2);

                    this._offsetX += overrides.getShadowX() ?? shadowComponent;
                    this._offsetY += overrides.getShadowY() ?? shadowComponent;
                }
            }

            {
                this._offsetX *= scale.x * this._dpi;
                this._offsetY *= scale.y * this._dpi;
                this._width *= scale.x * this._dpi;
                this._height *= scale.y * this._dpi;
            }

            if (!dryRun) {
                this._canvas.width = Math.max(
                    Math.max(Math.ceil(this._width), 64),
                    this._canvas.width
                );
                this._canvas.height = Math.max(
                    Math.max(Math.ceil(this._height), 64),
                    this._canvas.height
                );
                this._handleStyling(
                    time,
                    style,
                    overrides,
                    lineOverrides,
                    lineTransitionTargetOverrides,
                    pass
                ); //To workaround a bug.

                //reset the composite operation
                this._ctx.globalCompositeOperation = "source-over";
                //draw the text
                {
                    if (pass === sabre.RenderPasses.BACKGROUND) {
                        switch (borderStyle) {
                            case sabre.BorderStyleModes.NONE:
                                return;
                            case sabre.BorderStyleModes.UNKNOWN:
                            case sabre.BorderStyleModes.NORMAL:
                            default:
                                {
                                    let outline_x_bigger =
                                        outline_x > outline_y;
                                    let outline_gt_zero =
                                        outline_x > 0 && outline_y > 0;
                                    if (spacing === 0) {
                                        // Smear outline
                                        if (outline_x_bigger) {
                                            if (outline_gt_zero) {
                                                for (
                                                    let i =
                                                        -outline_x / outline_y;
                                                    i <= outline_x / outline_y;
                                                    i += outline_y / outline_x
                                                ) {
                                                    this._ctx.strokeText(
                                                        text,
                                                        offsetXUnscaled + i,
                                                        offsetYUnscaled
                                                    );
                                                }
                                            } else {
                                                this._ctx.fillStyle =
                                                    this._ctx.strokeStyle;
                                                for (
                                                    let i = -outline_x;
                                                    i <= outline_x;
                                                    i++
                                                ) {
                                                    this._ctx.fillText(
                                                        text,
                                                        offsetXUnscaled + i,
                                                        offsetYUnscaled
                                                    );
                                                }
                                            }
                                        } else {
                                            if (outline_gt_zero) {
                                                for (
                                                    let i =
                                                        -outline_y / outline_x;
                                                    i <= outline_y / outline_x;
                                                    i += outline_x / outline_y
                                                ) {
                                                    this._ctx.strokeText(
                                                        text,
                                                        offsetXUnscaled,
                                                        offsetYUnscaled + i
                                                    );
                                                }
                                            } else {
                                                this._ctx.fillStyle =
                                                    this._ctx.strokeStyle;
                                                for (
                                                    let i = -outline_y;
                                                    i <= outline_y;
                                                    i++
                                                ) {
                                                    this._ctx.fillText(
                                                        text,
                                                        offsetXUnscaled,
                                                        offsetYUnscaled + i
                                                    );
                                                }
                                            }
                                        }
                                        this._ctx.fillText(
                                            text,
                                            offsetXUnscaled,
                                            offsetYUnscaled
                                        );
                                    } else {
                                        // Smear outline
                                        if (outline_x_bigger) {
                                            if (outline_gt_zero) {
                                                for (
                                                    let i =
                                                        -outline_x / outline_y;
                                                    i <= outline_x / outline_y;
                                                    i += outline_y / outline_x
                                                ) {
                                                    this._drawTextWithRelativeKerning(
                                                        text,
                                                        offsetXUnscaled + i,
                                                        offsetYUnscaled,
                                                        spacing,
                                                        true
                                                    );
                                                }
                                            } else {
                                                this._ctx.fillStyle =
                                                    this._ctx.strokeStyle;
                                                for (
                                                    let i = -outline_x;
                                                    i <= outline_x;
                                                    i++
                                                ) {
                                                    this._drawTextWithRelativeKerning(
                                                        text,
                                                        offsetXUnscaled + i,
                                                        offsetYUnscaled,
                                                        spacing,
                                                        false
                                                    );
                                                }
                                            }
                                        } else {
                                            if (outline_gt_zero) {
                                                for (
                                                    let i =
                                                        -outline_y / outline_x;
                                                    i <= outline_y / outline_x;
                                                    i += outline_x / outline_y
                                                ) {
                                                    this._drawTextWithRelativeKerning(
                                                        text,
                                                        offsetXUnscaled,
                                                        offsetYUnscaled + i,
                                                        spacing,
                                                        true
                                                    );
                                                }
                                            } else {
                                                this._ctx.fillStyle =
                                                    this._ctx.strokeStyle;
                                                for (
                                                    let i = -outline_y;
                                                    i <= outline_y;
                                                    i++
                                                ) {
                                                    this._drawTextWithRelativeKerning(
                                                        text,
                                                        offsetXUnscaled,
                                                        offsetYUnscaled + i,
                                                        spacing,
                                                        false
                                                    );
                                                }
                                            }
                                        }
                                        this._drawTextWithRelativeKerning(
                                            text,
                                            offsetXUnscaled,
                                            offsetYUnscaled,
                                            spacing,
                                            false
                                        );
                                    }
                                }
                                break;
                            case sabre.BorderStyleModes.SRT_STYLE:
                            case sabre.BorderStyleModes.SRT_NO_OVERLAP:
                                this._ctx.fillStyle = this._ctx.strokeStyle;
                                this._ctx.fillRect(
                                    0,
                                    0,
                                    this._width,
                                    this._height
                                );
                                break;
                        }
                    } else if (pass === sabre.RenderPasses.OUTLINE) {
                        if (
                            borderStyle === sabre.BorderStyleModes.NONE ||
                            borderStyle === sabre.BorderStyleModes.SRT_STYLE ||
                            borderStyle ===
                                sabre.BorderStyleModes.SRT_NO_OVERLAP
                        )
                            return;
                        let outline_x_bigger = outline_x > outline_y;
                        let outline_gt_zero = outline_x > 0 && outline_y > 0;
                        if (spacing === 0) {
                            // Smear outline
                            if (outline_x_bigger) {
                                if (outline_gt_zero) {
                                    for (
                                        let i = -outline_x / outline_y;
                                        i <= outline_x / outline_y;
                                        i += outline_y / outline_x
                                    ) {
                                        this._ctx.strokeText(
                                            text,
                                            offsetXUnscaled + i,
                                            offsetYUnscaled
                                        );
                                    }
                                } else {
                                    this._ctx.fillStyle = this._ctx.strokeStyle;
                                    for (
                                        let i = -outline_x;
                                        i <= outline_x;
                                        i++
                                    ) {
                                        this._ctx.fillText(
                                            text,
                                            offsetXUnscaled + i,
                                            offsetYUnscaled
                                        );
                                    }
                                }
                            } else {
                                if (outline_gt_zero) {
                                    for (
                                        let i = -outline_y / outline_x;
                                        i <= outline_y / outline_x;
                                        i += outline_x / outline_y
                                    ) {
                                        this._ctx.strokeText(
                                            text,
                                            offsetXUnscaled,
                                            offsetYUnscaled + i
                                        );
                                    }
                                } else {
                                    this._ctx.fillStyle = this._ctx.strokeStyle;
                                    for (
                                        let i = -outline_y;
                                        i <= outline_y;
                                        i++
                                    ) {
                                        this._ctx.fillText(
                                            text,
                                            offsetXUnscaled,
                                            offsetYUnscaled + i
                                        );
                                    }
                                }
                            }
                            this._ctx.globalCompositeOperation =
                                "destination-out";
                            this._ctx.fillText(
                                text,
                                offsetXUnscaled,
                                offsetYUnscaled
                            );
                            //TEST CODE
                            this._ctx.globalCompositeOperation = "source-over";
                            this._ctx.fillStyle = this._ctx.strokeStyle;
                            this._ctx.fillText(
                                text,
                                offsetXUnscaled,
                                offsetYUnscaled
                            );
                        } else {
                            // Smear outline
                            if (outline_x_bigger) {
                                if (outline_gt_zero) {
                                    for (
                                        let i = -outline_x / outline_y;
                                        i <= outline_x / outline_y;
                                        i += outline_y / outline_x
                                    ) {
                                        this._drawTextWithRelativeKerning(
                                            text,
                                            offsetXUnscaled + i,
                                            offsetYUnscaled,
                                            spacing,
                                            true
                                        );
                                    }
                                } else {
                                    this._ctx.fillStyle = this._ctx.strokeStyle;
                                    for (
                                        let i = -outline_x;
                                        i <= outline_x;
                                        i++
                                    ) {
                                        this._drawTextWithRelativeKerning(
                                            text,
                                            offsetXUnscaled + i,
                                            offsetYUnscaled,
                                            spacing,
                                            false
                                        );
                                    }
                                }
                            } else {
                                if (outline_gt_zero) {
                                    for (
                                        let i = -outline_y / outline_x;
                                        i <= outline_y / outline_x;
                                        i += outline_x / outline_y
                                    ) {
                                        this._drawTextWithRelativeKerning(
                                            text,
                                            offsetXUnscaled,
                                            offsetYUnscaled + i,
                                            spacing,
                                            true
                                        );
                                    }
                                } else {
                                    this._ctx.fillStyle = this._ctx.strokeStyle;
                                    for (
                                        let i = -outline_y;
                                        i <= outline_y;
                                        i++
                                    ) {
                                        this._drawTextWithRelativeKerning(
                                            text,
                                            offsetXUnscaled,
                                            offsetYUnscaled + i,
                                            spacing,
                                            false
                                        );
                                    }
                                }
                            }

                            this._ctx.globalCompositeOperation =
                                "destination-out";
                            this._drawTextWithRelativeKerning(
                                text,
                                offsetXUnscaled,
                                offsetYUnscaled,
                                spacing,
                                false
                            );
                            //TEST CODE
                            this._ctx.globalCompositeOperation = "source-over";
                            this._ctx.fillStyle = this._ctx.strokeStyle;
                            this._drawTextWithRelativeKerning(
                                text,
                                offsetXUnscaled,
                                offsetYUnscaled,
                                spacing,
                                false
                            );
                        }
                    } else {
                        if (spacing === 0)
                            this._ctx.fillText(
                                text,
                                offsetXUnscaled,
                                offsetYUnscaled
                            );
                        else {
                            this._drawTextWithRelativeKerning(
                                text,
                                offsetXUnscaled,
                                offsetYUnscaled,
                                spacing,
                                false
                            );
                        }
                    }
                }
            }
        },
        writable: false
    },

    "setDPI": {
        /**
         * Sets the DPI for Rendering text
         * @param {number} dpi the DPI to use for rendering text.
         */
        value: function (dpi) {
            this._dpi = dpi;
        },
        writable: false
    },

    "getOffset": {
        /**
         * Gets the offset of the resulting image.
         * @returns {Array<number>} offset of the resulting image
         */
        value: function () {
            return [this._offsetX, this._offsetY];
        },
        writable: false
    },

    "getDimensions": {
        /**
         * Gets the dimensions of the resulting image.
         * @returns {Array<number>} dimensions of the resulting image
         */
        value: function () {
            return [this._width, this._height];
        },
        writable: false
    },

    "getExtents": {
        /**
         * Gets the dimensions of the canvas.
         * @returns {Array<number>} dimensions of the canvas
         */
        value: function () {
            return [
                Math.max(
                    Math.max(Math.ceil(this._width), 64),
                    this._canvas.width
                ),
                Math.max(
                    Math.max(Math.ceil(this._height), 64),
                    this._canvas.height
                )
            ];
        },
        writable: false
    },

    "getImage": {
        value: function () {
            return this._canvas;
        },
        writable: true
    }
});

sabre["Canvas2DTextRenderer"] = function () {
    return Object.create(text_renderer_prototype);
};
