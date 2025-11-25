const imageAlignment = {
  Left: 0,
  Center: 1,
  Right: 2,
} as const;

export const ImageAlignment = imageAlignment;

export type ImageAlignment =
  (typeof imageAlignment)[keyof typeof imageAlignment];
