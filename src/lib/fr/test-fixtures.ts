/** 法语单测共用的最小词表 fixture（不读取 5MB 真实词表） */

import type { LexRow } from "./lexicon";

const row = (
  lemma: string,
  cgram: string,
  genre = "",
  nombre = "",
  ipa = "",
  freq = 100,
  infover = "",
  cefr = "A1",
): LexRow => [lemma, cgram, genre, nombre, ipa, freq, infover, cefr];

export const FR_FIXTURE: Record<string, LexRow> = {
  // 省音
  "j'": row("je", "PRO:per", "", "", "ʒ", 1000),
  ai: row("avoir", "AUX", "", "", "ɛ", 1000, "ind:pre:1s"),
  je: row("je", "PRO:per", "", "", "ʒə", 1000),
  "t'": row("te", "PRO:per", "", "", "t", 900),
  aime: row("aimer", "VER", "", "", "ɛm", 900, "ind:pre:1s"),
  "l'": row("le", "ART:def", "m", "", "l", 1200),
  amour: row("amour", "NOM", "m", "sg", "amuʁ", 450),
  "d'": row("de", "PRE", "", "", "d", 1200),
  "qu'": row("que", "CON", "", "", "k", 800),
  "aujourd'hui": row("aujourd'hui", "ADV", "", "", "oʒuʁdɥi", 360),

  // 空格/连字符
  laisse: row("laisser", "VER", "", "", "lɛs", 300, "ind:pre:1s"),
  moi: row("moi", "PRO:per", "", "", "mwa", 500),
  partir: row("partir", "VER", "", "", "paʁtiʁ", 400, "inf"),

  // 冠词
  le: row("le", "ART:def", "m", "sg", "lə", 3000),
  la: row("la", "ART:def", "f", "sg", "la", 3000),

  // 联诵
  les: row("les", "ART:def", "", "pl", "le", 2000),
  amis: row("ami", "NOM", "m", "pl", "ami", 300, "", "A1"),
  un: row("un", "ART:ind", "m", "sg", "œ̃", 2000),
  une: row("un", "ART:ind", "f", "sg", "yn", 1500),
  petit: row("petit", "ADJ", "m", "sg", "pəti", 800),
  et: row("et", "CON", "", "", "e", 3000),
  hiboux: row("hibou", "NOM", "m", "pl", "ibu", 20, "", "B2"),
  l_ami: row("ami", "NOM", "m", "sg", "ami", 300),
  trop: row("trop", "ADV", "", "", "tʁo", 900),
  aimable: row("aimable", "ADJ", "m", "sg", "ɛmabl", 50),
  chat: row("chat", "NOM", "m", "sg", "ʃa", 300),
  adorable: row("adorable", "ADJ", "m", "sg", "adɔʁabl", 60),

  // 意群
  dans: row("dans", "PRE", "", "", "dɑ̃", 2000),
  nuit: row("nuit", "NOM", "f", "sg", "nɥi", 500),
  voudrais: row("vouloir", "VER", "", "", "vudʁɛ", 400, "cnd:pre:1s"),
  est: row("être", "VER", "", "", "e", 3000, "ind:pre:3s"),
  ce: row("ce", "PRON", "", "", "sə", 800),
  que: row("que", "CON", "", "", "kə", 800),
  chante: row("chanter", "VER", "", "", "ʃɑ̃t", 300, "ind:pre:3s"),
  danse: row("danser", "VER", "", "", "dɑ̃s", 300, "ind:pre:3s"),

  // 句法切分
  vois: row("voir", "VER", "", "", "vwa", 800, "ind:pre:1s"),
  vie: row("vie", "NOM", "f", "sg", "vi", 900),
  rose: row("rose", "NOM", "f", "sg", "ʁoz", 400),
  yeux: row("œil", "NOM", "m", "pl", "jø", 700),
  qui: row("qui", "PRO:rel", "", "", "ki", 3000),
  font: row("faire", "VER", "", "", "fɔ̃", 1200, "ind:pre:3p"),
  baisser: row("baisser", "VER", "", "", "bɛse", 200, "inf"),
  miens: row("mien", "PRO:pos", "", "", "mjɛ̃", 200),
  des: row("des", "ART:def", "", "pl", "de", 3000),
  en: row("en", "PRE", "", "", "ɑ̃", 3000),
  il: row("il", "PRO:per", "", "", "il", 3000),
  me: row("me", "PRO:per", "", "", "mə", 2500),
  mots: row("mot", "NOM", "m", "pl", "mo", 800),
  dit: row("dire", "VER", "", "", "di", 1500, "ind:pre:3s"),
  perdu: row("perdre", "VER", "", "", "pɛʁdy", 600, "par:pas"),
  nord: row("nord", "NOM", "m", "sg", "nɔʁ", 300),
  parle: row("parler", "VER", "", "", "paʁl", 900, "ind:pre:3s"),
  tout: row("tout", "ADV", "", "", "tu", 2000),
  bas: row("bas", "ADV", "", "", "ba", 600),
  entré: row("entrer", "VER", "", "", "ɑ̃tʁe", 700, "par:pas"),
  mon: row("mon", "ART:poss", "m", "sg", "mɔ̃", 2500),
  coeur: row("coeur", "NOM", "m", "sg", "kœʁ", 800),
  dès: row("dès", "PRE", "", "", "dɛ", 900),
  aperçois: row("apercevoir", "VER", "", "", "apɛʁswa", 300, "ind:pre:1s"),

  // 难度
  bonjour: row("bonjour", "NOM", "m", "sg", "bɔ̃ʒuʁ", 300, "", "A1"),
  chatouiller: row("chatouiller", "VER", "", "", "ʃatuje", 5, "inf", "C1"),
};
