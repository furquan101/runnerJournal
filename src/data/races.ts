export type KnownRace = {
  name: string;
  date: string;
  city: string;
  distance: "marathon" | "half" | "10mile" | "10k" | "ultra";
  defaultGoalTime?: string;
  suggestedFreq?: number;
  suggestedDays?: string[];
};

export const KNOWN_RACES: KnownRace[] = [
  // World Marathon Majors 2026
  { name: "Tokyo Marathon", city: "Tokyo", date: "2026-03-01", distance: "marathon" },
  { name: "Boston Marathon", city: "Boston", date: "2026-04-20", distance: "marathon" },
  { name: "London Marathon", city: "London", date: "2026-04-26", distance: "marathon" },
  { name: "Berlin Marathon", city: "Berlin", date: "2026-09-27", distance: "marathon" },
  { name: "Chicago Marathon", city: "Chicago", date: "2026-10-11", distance: "marathon" },
  { name: "New York City Marathon", city: "New York", date: "2026-11-01", distance: "marathon" },
  { name: "Sydney Marathon", city: "Sydney", date: "2026-08-30", distance: "marathon" },

  // World Marathon Majors 2027
  { name: "Tokyo Marathon", city: "Tokyo", date: "2027-03-07", distance: "marathon" },
  { name: "Boston Marathon", city: "Boston", date: "2027-04-19", distance: "marathon" },
  { name: "London Marathon", city: "London", date: "2027-04-25", distance: "marathon" },
  { name: "Berlin Marathon", city: "Berlin", date: "2027-09-26", distance: "marathon" },
  { name: "Chicago Marathon", city: "Chicago", date: "2027-10-10", distance: "marathon" },
  { name: "New York City Marathon", city: "New York", date: "2027-11-07", distance: "marathon" },
  { name: "Sydney Marathon", city: "Sydney", date: "2027-08-29", distance: "marathon" },

  // Other notable marathons
  { name: "Paris Marathon", city: "Paris", date: "2026-04-12", distance: "marathon" },
  { name: "Paris Marathon", city: "Paris", date: "2027-04-11", distance: "marathon" },
  { name: "Amsterdam Marathon", city: "Amsterdam", date: "2026-10-18", distance: "marathon" },
  { name: "Amsterdam Marathon", city: "Amsterdam", date: "2027-10-17", distance: "marathon" },
  { name: "Valencia Marathon", city: "Valencia", date: "2026-12-06", distance: "marathon" },
  { name: "Valencia Marathon", city: "Valencia", date: "2027-12-05", distance: "marathon" },
  { name: "Frankfurt Marathon", city: "Frankfurt", date: "2026-10-25", distance: "marathon" },
  { name: "Frankfurt Marathon", city: "Frankfurt", date: "2027-10-31", distance: "marathon" },
  { name: "Manchester Marathon", city: "Manchester", date: "2026-04-19", distance: "marathon" },
  { name: "Manchester Marathon", city: "Manchester", date: "2027-04-18", distance: "marathon" },
  { name: "Edinburgh Marathon", city: "Edinburgh", date: "2026-05-24", distance: "marathon" },
  { name: "Edinburgh Marathon", city: "Edinburgh", date: "2027-05-30", distance: "marathon" },
  { name: "Brighton Marathon", city: "Brighton", date: "2026-04-12", distance: "marathon" },
  { name: "Brighton Marathon", city: "Brighton", date: "2027-04-11", distance: "marathon" },
  { name: "Copenhagen Marathon", city: "Copenhagen", date: "2026-05-17", distance: "marathon" },
  { name: "Copenhagen Marathon", city: "Copenhagen", date: "2027-05-16", distance: "marathon" },
  { name: "Dubai Marathon", city: "Dubai", date: "2026-01-25", distance: "marathon" },
  { name: "Dubai Marathon", city: "Dubai", date: "2027-01-24", distance: "marathon" },

  // UK marathons
  { name: "Belfast Marathon", city: "Belfast", date: "2026-05-03", distance: "marathon" },
  { name: "Belfast Marathon", city: "Belfast", date: "2027-05-02", distance: "marathon" },
  { name: "MK Marathon", city: "Milton Keynes", date: "2026-05-04", distance: "marathon" },
  { name: "MK Marathon", city: "Milton Keynes", date: "2027-05-03", distance: "marathon" },
  { name: "Yorkshire Marathon", city: "York", date: "2026-10-11", distance: "marathon" },
  { name: "Yorkshire Marathon", city: "York", date: "2027-10-10", distance: "marathon" },
  { name: "Loch Ness Marathon", city: "Inverness", date: "2026-10-04", distance: "marathon" },
  { name: "Loch Ness Marathon", city: "Inverness", date: "2027-10-03", distance: "marathon" },
  { name: "Snowdonia Marathon Eryri", city: "Llanberis", date: "2026-10-24", distance: "marathon" },
  { name: "Snowdonia Marathon Eryri", city: "Llanberis", date: "2027-10-30", distance: "marathon" },
  { name: "Beachy Head Marathon", city: "Eastbourne", date: "2026-10-24", distance: "marathon" },
  { name: "Beachy Head Marathon", city: "Eastbourne", date: "2027-10-23", distance: "marathon" },
  { name: "Bournemouth Marathon", city: "Bournemouth", date: "2026-10-04", distance: "marathon" },
  { name: "Bournemouth Marathon", city: "Bournemouth", date: "2027-10-03", distance: "marathon" },
  { name: "Robin Hood Marathon", city: "Nottingham", date: "2026-09-27", distance: "marathon" },
  { name: "Robin Hood Marathon", city: "Nottingham", date: "2027-09-26", distance: "marathon" },
  { name: "Liverpool Marathon", city: "Liverpool", date: "2026-10-25", distance: "marathon" },
  { name: "Liverpool Marathon", city: "Liverpool", date: "2027-10-24", distance: "marathon" },
  { name: "Chester Marathon", city: "Chester", date: "2026-10-04", distance: "marathon" },
  { name: "Chester Marathon", city: "Chester", date: "2027-10-03", distance: "marathon" },
  { name: "Dublin Marathon", city: "Dublin", date: "2026-10-25", distance: "marathon" },
  { name: "Dublin Marathon", city: "Dublin", date: "2027-10-24", distance: "marathon" },

  // UK half marathons
  { name: "Hackney Half", city: "London", date: "2026-05-17", distance: "half", suggestedFreq: 4 },
  { name: "Hackney Half", city: "London", date: "2027-05-16", distance: "half", suggestedFreq: 4 },
  { name: "The Big Half", city: "London", date: "2026-09-06", distance: "half", suggestedFreq: 4 },
  { name: "The Big Half", city: "London", date: "2027-09-05", distance: "half", suggestedFreq: 4 },
  { name: "Great North Run", city: "Newcastle", date: "2026-09-13", distance: "half", suggestedFreq: 4 },
  { name: "Great North Run", city: "Newcastle", date: "2027-09-12", distance: "half", suggestedFreq: 4 },
  { name: "Royal Parks Half", city: "London", date: "2026-10-11", distance: "half", suggestedFreq: 4 },
  { name: "Royal Parks Half", city: "London", date: "2027-10-10", distance: "half", suggestedFreq: 4 },
  { name: "London Landmarks Half", city: "London", date: "2026-04-12", distance: "half", suggestedFreq: 4 },
  { name: "London Landmarks Half", city: "London", date: "2027-04-11", distance: "half", suggestedFreq: 4 },
  { name: "Bath Half", city: "Bath", date: "2026-03-15", distance: "half", suggestedFreq: 4 },
  { name: "Bath Half", city: "Bath", date: "2027-03-14", distance: "half", suggestedFreq: 4 },
  { name: "Reading Half", city: "Reading", date: "2026-04-05", distance: "half", suggestedFreq: 4 },
  { name: "Reading Half", city: "Reading", date: "2027-04-04", distance: "half", suggestedFreq: 4 },
  { name: "Cardiff Half", city: "Cardiff", date: "2026-10-04", distance: "half", suggestedFreq: 4 },
  { name: "Cardiff Half", city: "Cardiff", date: "2027-10-03", distance: "half", suggestedFreq: 4 },
  { name: "Bristol Half", city: "Bristol", date: "2026-09-13", distance: "half", suggestedFreq: 4 },
  { name: "Bristol Half", city: "Bristol", date: "2027-09-12", distance: "half", suggestedFreq: 4 },
  { name: "Liverpool Half", city: "Liverpool", date: "2026-03-22", distance: "half", suggestedFreq: 4 },
  { name: "Liverpool Half", city: "Liverpool", date: "2027-03-21", distance: "half", suggestedFreq: 4 },
  { name: "Great Birmingham Run", city: "Birmingham", date: "2026-05-03", distance: "half", suggestedFreq: 4 },
  { name: "Great Birmingham Run", city: "Birmingham", date: "2027-05-02", distance: "half", suggestedFreq: 4 },
  { name: "Leeds Half", city: "Leeds", date: "2026-05-10", distance: "half", suggestedFreq: 4 },
  { name: "Leeds Half", city: "Leeds", date: "2027-05-09", distance: "half", suggestedFreq: 4 },
  { name: "Manchester Half", city: "Manchester", date: "2026-10-11", distance: "half", suggestedFreq: 4 },
  { name: "Manchester Half", city: "Manchester", date: "2027-10-10", distance: "half", suggestedFreq: 4 },
  { name: "Oxford Half", city: "Oxford", date: "2026-10-11", distance: "half", suggestedFreq: 4 },
  { name: "Oxford Half", city: "Oxford", date: "2027-10-10", distance: "half", suggestedFreq: 4 },
  { name: "Cambridge Half", city: "Cambridge", date: "2026-03-08", distance: "half", suggestedFreq: 4 },
  { name: "Cambridge Half", city: "Cambridge", date: "2027-03-07", distance: "half", suggestedFreq: 4 },
  { name: "Sheffield Half", city: "Sheffield", date: "2026-04-05", distance: "half", suggestedFreq: 4 },
  { name: "Sheffield Half", city: "Sheffield", date: "2027-04-04", distance: "half", suggestedFreq: 4 },

  // International halves
  { name: "Berlin Half Marathon", city: "Berlin", date: "2026-04-05", distance: "half", suggestedFreq: 4 },
  { name: "Berlin Half Marathon", city: "Berlin", date: "2027-04-04", distance: "half", suggestedFreq: 4 },
  { name: "Lisbon Half Marathon", city: "Lisbon", date: "2026-03-15", distance: "half", suggestedFreq: 4 },
  { name: "Lisbon Half Marathon", city: "Lisbon", date: "2027-03-14", distance: "half", suggestedFreq: 4 },

  // UK 10-mile races
  { name: "Great South Run", city: "Portsmouth", date: "2026-10-18", distance: "10mile", suggestedFreq: 3 },
  { name: "Great South Run", city: "Portsmouth", date: "2027-10-17", distance: "10mile", suggestedFreq: 3 },
  { name: "Cabbage Patch 10", city: "Twickenham", date: "2026-10-11", distance: "10mile", suggestedFreq: 3 },
  { name: "Cabbage Patch 10", city: "Twickenham", date: "2027-10-10", distance: "10mile", suggestedFreq: 3 },

  // UK 10Ks
  { name: "Vitality London 10,000", city: "London", date: "2026-05-25", distance: "10k", suggestedFreq: 3 },
  { name: "Vitality London 10,000", city: "London", date: "2027-05-31", distance: "10k", suggestedFreq: 3 },
  { name: "Great Manchester Run 10K", city: "Manchester", date: "2026-05-24", distance: "10k", suggestedFreq: 3 },
  { name: "Great Manchester Run 10K", city: "Manchester", date: "2027-05-23", distance: "10k", suggestedFreq: 3 },
  { name: "Asics London 10K", city: "London", date: "2026-07-12", distance: "10k", suggestedFreq: 3 },
  { name: "Asics London 10K", city: "London", date: "2027-07-11", distance: "10k", suggestedFreq: 3 },

  // UK ultras
  { name: "Race to the Stones", city: "Lewknor → Avebury", date: "2026-07-11", distance: "ultra", suggestedFreq: 5 },
  { name: "Race to the Stones", city: "Lewknor → Avebury", date: "2027-07-10", distance: "ultra", suggestedFreq: 5 },
  { name: "South Downs Way 100", city: "Winchester → Eastbourne", date: "2026-06-13", distance: "ultra", suggestedFreq: 5 },
  { name: "South Downs Way 100", city: "Winchester → Eastbourne", date: "2027-06-12", distance: "ultra", suggestedFreq: 5 },
  { name: "Ultra-Trail Snowdonia", city: "Llanberis", date: "2026-05-15", distance: "ultra", suggestedFreq: 5 },
  { name: "Ultra-Trail Snowdonia", city: "Llanberis", date: "2027-05-14", distance: "ultra", suggestedFreq: 5 },
  { name: "Lakeland 50/100", city: "Coniston", date: "2026-07-25", distance: "ultra", suggestedFreq: 5 },
  { name: "Lakeland 50/100", city: "Coniston", date: "2027-07-24", distance: "ultra", suggestedFreq: 5 },
  { name: "Spine Race", city: "Edale → Kirk Yetholm", date: "2027-01-10", distance: "ultra", suggestedFreq: 5 },
];

export function searchRaces(query: string, limit = 6): KnownRace[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const today = new Date().toISOString().slice(0, 10);
  const matches = KNOWN_RACES.filter((r) => {
    if (r.date < today) return false;
    return (
      r.name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q)
    );
  });
  matches.sort((a, b) => (a.date < b.date ? -1 : 1));
  return matches.slice(0, limit);
}
