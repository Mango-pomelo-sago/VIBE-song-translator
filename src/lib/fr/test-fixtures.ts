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

  // 难度
  bonjour: row("bonjour", "NOM", "m", "sg", "bɔ̃ʒuʁ", 300, "", "A1"),
  chatouiller: row("chatouiller", "VER", "", "", "ʃatuje", 5, "inf", "C1"),
};
