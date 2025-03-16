declare module 'tailwindcss/lib/util/flattenColorPalette' {
  const flattenColorPalette: (colors: any) => Record<string, string>;
  export default flattenColorPalette;
}

declare module 'tailwindcss/defaultTheme' {
  const defaultTheme: any;
  export default defaultTheme;
}

declare module 'tailwindcss/colors' {
  const colors: Record<string, Record<string, string>>;
  export default colors;
} 