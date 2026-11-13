// SVGO for hand-drawn graphics (spec §3). SVGO 4 no longer removes the viewBox by default,
// so everything still scales from CSS. Stroke attributes live on the sprite root.
export default {
  multipass: true,
  plugins: [
    { name: "preset-default", params: { overrides: { convertPathData: { floatPrecision: 2 } } } },
    {
      name: "removeAttrs",
      params: { attrs: ["xmlns", "fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap"] },
    },
  ],
};
