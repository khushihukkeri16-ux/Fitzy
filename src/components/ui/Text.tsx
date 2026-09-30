import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { fonts, palette } from '@/constants/theme';

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption';

const styles: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 40, color: palette.ink },
  title: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 32, color: palette.ink },
  heading: { fontFamily: fonts.bodyExtra, fontSize: 17, lineHeight: 24, color: palette.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: palette.ink },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 20, color: palette.ink },
  caption: { fontFamily: fonts.bodySemi, fontSize: 12.5, lineHeight: 18, color: palette.inkSoft },
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
}

export function Text({ variant = 'body', color, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[styles[variant], color ? { color } : null, style]}
    />
  );
}
