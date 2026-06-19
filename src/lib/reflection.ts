export const fallbackReflectionPrompts = [
  "Apa hal paling penting yang Anda pahami setelah membaca cerpen ini?",
  "Bagian mana dari cerpen yang menurut Anda paling perlu dikritisi? Jelaskan alasannya.",
  "Apa hubungan persoalan dalam cerpen dengan kehidupan sosial di sekitar Anda?",
  "Bagaimana kutipan yang Anda pilih membantu memahami pesan cerpen?",
  "Pertanyaan kritis apa yang muncul setelah Anda membaca cerpen ini?",
];

export function selectReflectionPrompt(seedText: string) {
  const seed = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
  return fallbackReflectionPrompts[seed % fallbackReflectionPrompts.length];
}
