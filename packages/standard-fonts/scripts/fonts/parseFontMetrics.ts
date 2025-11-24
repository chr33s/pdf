import {
  error,
  extractLinesFromSection,
  takeAfterFirstSpace,
  takeUntilFirstSpace,
} from "./utils.ts";

export interface IFontMetrics {
  Comment: string;
  FontName: string;
  FullName: string;
  FamilyName: string;
  Weight: string;
  CharacterSet: string;
  Version: string;
  Notice: string;
  EncodingScheme: string;
  ItalicAngle: number;
  UnderlinePosition: number;
  UnderlineThickness: number;
  CapHeight: number | void;
  XHeight: number | void;
  Ascender: number | void;
  Descender: number | void;
  StdHW: number;
  StdVW: number;
  IsFixedPitch: boolean;
  FontBBox: [number, number, number, number];
}

export type IFontMetricKey = keyof IFontMetrics;

type FontMetricEntry = {
  key: IFontMetricKey;
  value: IFontMetrics[IFontMetricKey];
};

const parseFontMetric = (line: string): FontMetricEntry => {
  const key = takeUntilFirstSpace(line) as IFontMetricKey;
  const rawValue = takeAfterFirstSpace(line).trim();

  switch (key) {
    case "Comment":
    case "FontName":
    case "FullName":
    case "FamilyName":
    case "Weight":
    case "CharacterSet":
    case "Version":
    case "Notice":
    case "EncodingScheme":
      return { key, value: rawValue };
    case "ItalicAngle":
    case "UnderlinePosition":
    case "UnderlineThickness":
    case "CapHeight":
    case "XHeight":
    case "Ascender":
    case "Descender":
    case "StdHW":
    case "StdVW":
      return { key, value: Number(rawValue) as IFontMetrics[typeof key] };
    case "IsFixedPitch":
      return { key, value: Boolean(rawValue) as IFontMetrics[typeof key] };
    case "FontBBox":
      return {
        key,
        value: rawValue.split(" ").map(Number) as IFontMetrics[typeof key],
      };
    default:
      return error(`Unrecognized font metric key: "${key}"`);
  }
};

export const parseFontMetricsSection = (data: string): IFontMetrics => {
  const metrics = extractLinesFromSection(data, {
    startAt: "StartFontMetrics",
    endAt: "StartCharMetrics",
  }).map(parseFontMetric);

  const result: Partial<Record<IFontMetricKey, IFontMetrics[IFontMetricKey]>> =
    {};
  for (const metric of metrics) {
    result[metric.key] = metric.value;
  }

  return result as IFontMetrics;
};
