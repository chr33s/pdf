import { EmbeddedFileOptions } from "../core/embedders/FileEmbedder.js";
import { TypeFeatures } from "../types/fontkit.js";

export type ParseSpeed = number;

const parseSpeeds = {
  Fastest: Infinity,
  Fast: 1500,
  Medium: 500,
  Slow: 100,
} as const satisfies Record<string, ParseSpeed>;

export const ParseSpeeds = parseSpeeds;

export interface AttachmentOptions extends EmbeddedFileOptions {}

export interface SaveOptions {
  useObjectStreams?: boolean;
  addDefaultPage?: boolean;
  objectsPerTick?: number;
  updateFieldAppearances?: boolean;
}

export interface Base64SaveOptions extends SaveOptions {
  dataUri?: boolean;
}

export interface LoadOptions {
  ignoreEncryption?: boolean;
  parseSpeed?: ParseSpeed;
  throwOnInvalidObject?: boolean;
  warnOnInvalidObjects?: boolean;
  updateMetadata?: boolean;
  capNumbers?: boolean;
  password?: string;
}

export interface CreateOptions {
  updateMetadata?: boolean;
}

export interface EmbedFontOptions {
  subset?: boolean;
  customName?: string;
  features?: TypeFeatures;
}

export interface SetTitleOptions {
  showInWindowTitleBar: boolean;
}
