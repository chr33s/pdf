/**
 * Array of WinAnsi glyph names.
 * Allows lookups of character names given a character code.
 *
 * From:
 *   https://github.com/foliojs/pdfkit/blob/83f5f7243172a017adcf6a7faa5547c55982c57b/lib/font/afm.js#L33-L105
 */
const WinAnsiCharNames = `
.notdef       .notdef        .notdef        .notdef
.notdef       .notdef        .notdef        .notdef
.notdef       .notdef        .notdef        .notdef
.notdef       .notdef        .notdef        .notdef
.notdef       .notdef        .notdef        .notdef
.notdef       .notdef        .notdef        .notdef
.notdef       .notdef        .notdef        .notdef
.notdef       .notdef        .notdef        .notdef

space         exclam         quotedbl       numbersign
dollar        percent        ampersand      quotesingle
parenleft     parenright     asterisk       plus
comma         hyphen         period         slash
zero          one            two            three
four          five           six            seven
eight         nine           colon          semicolon
less          equal          greater        question

at            A              B              C
D             E              F              G
H             I              J              K
L             M              N              O
P             Q              R              S
T             U              V              W
X             Y              Z              bracketleft
backslash     bracketright   asciicircum    underscore

grave         a              b              c
d             e              f              g
h             i              j              k
l             m              n              o
p             q              r              s
t             u              v              w
x             y              z              braceleft
bar           braceright     asciitilde     .notdef

Euro          .notdef        quotesinglbase florin
quotedblbase  ellipsis       dagger         daggerdbl
circumflex    perthousand    Scaron         guilsinglleft
OE            .notdef        Zcaron         .notdef
.notdef       quoteleft      quoteright     quotedblleft
quotedblright bullet         endash         emdash
tilde         trademark      scaron         guilsinglright
oe            .notdef        zcaron         ydieresis

space         exclamdown     cent           sterling
currency      yen            brokenbar      section
dieresis      copyright      ordfeminine    guillemotleft
logicalnot    hyphen         registered     macron
degree        plusminus      twosuperior    threesuperior
acute         mu             paragraph      periodcentered
cedilla       onesuperior    ordmasculine   guillemotright
onequarter    onehalf        threequarters  questiondown

Agrave        Aacute         Acircumflex    Atilde
Adieresis     Aring          AE             Ccedilla
Egrave        Eacute         Ecircumflex    Edieresis
Igrave        Iacute         Icircumflex    Idieresis
Eth           Ntilde         Ograve         Oacute
Ocircumflex   Otilde         Odieresis      multiply
Oslash        Ugrave         Uacute         Ucircumflex
Udieresis     Yacute         Thorn          germandbls

agrave        aacute         acircumflex    atilde
adieresis     aring          ae             ccedilla
egrave        eacute         ecircumflex    edieresis
igrave        iacute         icircumflex    idieresis
eth           ntilde         ograve         oacute
ocircumflex   otilde         odieresis      divide
oslash        ugrave         uacute         ucircumflex
udieresis     yacute         thorn          ydieresis
`
  .trim()
  .split(/\s+/);

export type EncodingMap = Record<number, [number, string]>;

type EncodingTuple = [number, number, string, string];

const isValidEncodingTuple = (
  entry: [number, number, string, string | undefined],
): entry is EncodingTuple => {
  const [, , , postscriptName] = entry;
  return typeof postscriptName === "string" && postscriptName !== ".notdef";
};

export const parseWin1252 = (data: string): EncodingMap => {
  const rows = data
    .split("\n")
    .filter((line) => line[0] !== "#")
    .filter(Boolean)
    .map((line) => line.split("\t"))
    .map(([postscriptCode, unicodeCode, unicodeName]) => {
      const unicode = Number(unicodeCode);
      const postscript = Number(postscriptCode);
      const postscriptName = WinAnsiCharNames[postscript];
      return [
        unicode,
        postscript,
        unicodeName.substring(1),
        postscriptName,
      ] as [number, number, string, string | undefined];
    })
    .filter(isValidEncodingTuple);

  const encodings: EncodingMap = {};
  for (const [unicodeCode, postscriptCode, , postscriptName] of rows) {
    encodings[unicodeCode] = [postscriptCode, postscriptName];
  }

  return encodings;
};
