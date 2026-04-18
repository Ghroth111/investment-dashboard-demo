export const fontFamilies = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 40,
  },
  heading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 24,
    lineHeight: 30,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  monoNumber: {
    fontFamily: fontFamilies.semibold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
};
