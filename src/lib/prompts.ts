const PROMPTS = [
  "How's the running going?",
  "What made today's run harder?",
  "What surprised you today?",
  "One small win from today?",
  "What did your body need today?",
  "What were you thinking about as you ran?",
  "What would you tell tomorrow's you?",
];

export function promptForDate(dateISO: string): string {
  let h = 0;
  for (let i = 0; i < dateISO.length; i++) h = (h * 31 + dateISO.charCodeAt(i)) >>> 0;
  return PROMPTS[h % PROMPTS.length];
}
