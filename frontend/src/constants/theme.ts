// ─── Color Palette ───────────────────────────────────────────────────────────
// Source: Stitch design system "Editorial Organicism / Lichen Stone"
// All colors extracted from code.html files — never hardcode colors elsewhere.

export const colors = {
  // Primary (forest green authority)
  primary: '#47674a',
  primaryDim: '#3b5a3f',
  primaryFixed: '#c8ecc7',
  primaryFixedDim: '#badeba',
  primaryContainer: '#c8ecc7',
  onPrimary: '#e9ffe6',
  onPrimaryFixed: '#27462c',
  onPrimaryFixedVariant: '#436346',
  onPrimaryContainer: '#3a593d',
  inversePrimary: '#d0f5d0',

  // Secondary
  secondary: '#56634d',
  secondaryDim: '#4a5741',
  secondaryFixed: '#d9e7cb',
  secondaryFixedDim: '#cbd9be',
  secondaryContainer: '#d9e7cb',
  onSecondary: '#effee1',
  onSecondaryFixed: '#36432f',
  onSecondaryFixedVariant: '#525f49',
  onSecondaryContainer: '#495640',

  // Tertiary (organic yellow-green accent)
  tertiary: '#5b6330',
  tertiaryDim: '#505725',
  tertiaryFixed: '#ebf4b3',
  tertiaryFixedDim: '#dce5a5',
  tertiaryContainer: '#ebf4b3',
  onTertiary: '#f6ffbd',
  onTertiaryFixed: '#434a1a',
  onTertiaryFixedVariant: '#5f6733',
  onTertiaryContainer: '#555c2a',

  // Surface hierarchy (base → elevated)
  background: '#f9faf6',
  surface: '#f9faf6',
  surfaceBright: '#f9faf6',
  surfaceDim: '#d6dbd5',
  surfaceVariant: '#dfe4de',
  surfaceTint: '#47674a',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4ef',
  surfaceContainer: '#ebefe9',
  surfaceContainerHigh: '#e5e9e4',
  surfaceContainerHighest: '#dfe4de',
  onSurface: '#2e3430',
  onSurfaceVariant: '#5b605c',
  onBackground: '#2e3430',
  inverseSurface: '#0c0f0d',
  inverseOnSurface: '#9b9d9a',

  // Outline
  outline: '#767c77',
  outlineVariant: '#aeb3ae',

  // Error
  error: '#a73b21',
  errorDim: '#791903',
  errorContainer: '#fd795a',
  onError: '#fff7f6',
  onErrorContainer: '#6e1400',

  // Component-specific (explicit in Stitch HTML)
  topBarBg: '#f2f4ef',
  tabActiveBg: '#c8ecc7',
  tabActiveText: '#2e3430',
  tabInactiveText: '#5b605c',

  // Glassmorphism overlays
  glassPanel: 'rgba(249, 250, 246, 0.7)',
  navBarBg: 'rgba(255, 255, 255, 0.8)',
  scanOverlay: 'rgba(46, 52, 48, 0.4)',
  scanLabelBg: 'rgba(0, 0, 0, 0.4)',
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
// Headlines: Plus Jakarta Sans | Body/Labels: Manrope

export const fonts = {
  headline: 'PlusJakartaSans_700Bold',
  headlineExtraBold: 'PlusJakartaSans_800ExtraBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
} as const;

export const fontSizes = {
  displayLg: 56,    // hero headings (Did You Know?)
  displayMd: 48,    // verdict text (RECYCLABLE)
  headlineLg: 32,   // screen headings
  headlineMd: 24,   // app title, card headings
  headlineSm: 20,   // section headings
  titleLg: 18,      // list item titles
  bodyLg: 16,       // primary body text
  bodySm: 14,       // secondary body text
  labelLg: 12,      // chips, captions, uppercase labels
  labelSm: 11,      // nav tab labels
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radii = {
  xs: 4,    // DEFAULT
  sm: 8,    // lg
  md: 12,   // xl — main containers, cards
  lg: 16,   // rounded-2xl — tab active pill
  xl: 24,   // nav bar top corners, large modals
  full: 9999,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,   // p-4, card padding small, item gap
  lg: 20,     // p-5
  xl: 24,     // p-6, page horizontal padding
  xxl: 32,    // p-8, hero card padding, section spacing
  xxxl: 40,
} as const;

// ─── Component Sizes ─────────────────────────────────────────────────────────

export const sizes = {
  headerHeight: 64,
  scanButton: 80,
  scanButtonRing: 4,
  viewfinder: 288,
  viewfinderCorner: 48,
  viewfinderBorder: 4,
  historyThumbnail: 64,
  tabIconContainer: 40,
  navBarPaddingBottom: 24,
  navBarPaddingTop: 12,
} as const;

// ─── Shadows (ambient only — never drop-shadows) ─────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#2e3430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  scanButton: {
    shadowColor: '#47674a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  navBar: {
    shadowColor: '#2e3430',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredCard: {
    shadowColor: '#47674a',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;
