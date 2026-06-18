export const fallbackReflectionPrompts = [
  "Apa hal paling penting yang kamu pahami setelah membaca cerpen ini?",
  "Bagian mana dari cerpen yang menurutmu paling perlu dikritisi? Jelaskan alasannya.",
  "Apa hubungan persoalan dalam cerpen dengan kehidupan sosial di sekitarmu?",
  "Bagaimana kutipan yang kamu pilih membantu memahami pesan cerpen?",
  "Pertanyaan kritis apa yang muncul setelah kamu membaca cerpen ini?",
];

export function selectReflectionPrompt(seedText: string) {
  const seed = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
  return fallbackReflectionPrompts[seed % fallbackReflectionPrompts.length];
}
