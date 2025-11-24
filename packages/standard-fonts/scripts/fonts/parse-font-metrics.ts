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

const parseString = (raw: string): string => raw;
const parseNumber = (raw: string): number => Number(raw);
const parseBoolean = (raw: string): boolean => Boolean(raw);
const parseFontBBox = (raw: string): [number, number, number, number] =>
  raw.split(" ").map(Number) as [number, number, number, number];

const metricParsers: {
  [K in IFontMetricKey]: (raw: string) => IFontMetrics[K];
} = {
  Comment: parseString,
  FontName: parseString,
  FullName: parseString,
  FamilyName: parseString,
  Weight: parseString,
  CharacterSet: parseString,
  Version: parseString,
  Notice: parseString,
  EncodingScheme: parseString,
  ItalicAngle: parseNumber,
  UnderlinePosition: parseNumber,
  UnderlineThickness: parseNumber,
  CapHeight: parseNumber,
  XHeight: parseNumber,
  Ascender: parseNumber,
  Descender: parseNumber,
  StdHW: parseNumber,
  StdVW: parseNumber,
  IsFixedPitch: parseBoolean,
  FontBBox: parseFontBBox,
};

const isFontMetricKey = (value: string): value is IFontMetricKey =>
  value in metricParsers;

const parseFontMetric = (line: string): FontMetricEntry => {
  const key = takeUntilFirstSpace(line);
  const rawValue = takeAfterFirstSpace(line).trim();

  if (!isFontMetricKey(key)) {
    return error(`Unrecognized font metric key: "${key}"`);
  }

  const parse = metricParsers[key];
  return { key, value: parse(rawValue) };
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
