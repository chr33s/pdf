const textAlignment = {
  Left: 0,
  Center: 1,
  Right: 2,
} as const;

export const TextAlignment = textAlignment;

export type TextAlignment = (typeof textAlignment)[keyof typeof textAlignment];
