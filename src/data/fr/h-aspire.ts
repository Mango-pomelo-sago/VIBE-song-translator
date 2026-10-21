/**
 * h aspiré 词表：这些词以 h 开头但不与前面的词联诵，
 * 例如 « les hiboux » 不能说成 /le.zibu/。
 *
 * 只收确定属于 h aspiré 的高频词；宁可少收（漏标联诵），
 * 也不要误收哑音 h 词（错标联诵更影响发音学习）。
 */
export const H_ASPIRE = new Set([
  "hache", "hacher", "hachis", "haie", "haine", "haïr", "haïssable",
  "hall", "halle", "halte", "hameau", "hanche", "handicap", "hangar",
  "hanter", "haras", "harceler", "hardi", "hareng", "hargne", "haricot",
  "harnais", "harpe", "harpon", "hasard", "hâte", "hâter", "hausse",
  "hausser", "haut", "hauteur", "havre", "hérisson", "hernie", "héros",
  "hêtre", "heurter", "hibou", "hideur", "hier", "hiérarchie", "hisser",
  "hiver", "hocher", "hockey", "hollande", "homard", "honte", "hoquet",
  "horde", "hors", "houblon", "houe", "houille", "houle", "housse",
  "houx", "hublot", "huer", "huit", "hurler", "hussard", "hutte", "hyène",
  "hochement", "hochet", "hollande", "hollandaise", "homard", "hongrois",
]);
