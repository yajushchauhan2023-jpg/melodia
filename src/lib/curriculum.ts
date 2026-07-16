export const INSTRUMENTS = ["Piano", "Guitar", "Violin", "Drums", "Flute", "Ukulele", "Vocals", "Saxophone"] as const;
export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const GOALS = ["Play songs", "Learn theory", "Exam prep", "Improve performance", "Decode sheet music"] as const;
export const WEEKLY_TIMES = ["2 hours", "4 hours", "7+ hours"] as const;

export type Instrument = (typeof INSTRUMENTS)[number];
export type Level = (typeof LEVELS)[number];
export type Goal = (typeof GOALS)[number];
export type WeeklyTime = (typeof WEEKLY_TIMES)[number];

export type LessonStage = {
  order: number;
  title: string;
  description: string;
};

type StageTemplate = { title: string; description: string };

const STAGE_TEMPLATES: Record<Level, StageTemplate[]> = {
  Beginner: [
    { title: "Posture, hold, and first sounds", description: "Get comfortable holding your {instrument} and produce your first clean, confident sounds." },
    { title: "Reading your first notes", description: "Learn to recognize and play the first five notes on {instrument}." },
    { title: "Simple rhythms", description: "Practice steady beats and basic rhythm patterns on {instrument}." },
    { title: "Your first short piece", description: "Put it all together and play a short beginner piece on {instrument}." },
    { title: "Warm-ups & control", description: "Build control and consistency with daily {instrument} warm-up routines." },
    { title: "Beginner review & mini performance", description: "Review everything so far and record yourself playing a short piece on {instrument}." }
  ],
  Intermediate: [
    { title: "Expanding your range", description: "Extend the notes and positions you're comfortable with on {instrument}." },
    { title: "Chords & harmony basics", description: "Start combining notes into chords and simple harmony on {instrument}." },
    { title: "Rhythm variety", description: "Practice syncopation and mixed rhythm patterns on {instrument}." },
    { title: "Playing with dynamics", description: "Add expression by varying volume and articulation on {instrument}." },
    { title: "Learning a full song", description: "Work through a complete intermediate-level song on {instrument}." },
    { title: "Intermediate review & performance", description: "Polish and perform your song, then get feedback on {instrument} technique." }
  ],
  Advanced: [
    { title: "Advanced technique refinement", description: "Sharpen speed, precision, and tone control on {instrument}." },
    { title: "Improvisation basics", description: "Start improvising within a scale or chord progression on {instrument}." },
    { title: "Complex rhythms & meter changes", description: "Tackle odd meters and layered rhythms on {instrument}." },
    { title: "Interpreting advanced pieces", description: "Develop your own interpretation of an advanced piece on {instrument}." },
    { title: "Performance-ready polish", description: "Refine a performance-ready piece on {instrument} down to the last detail." },
    { title: "Advanced review & recital piece", description: "Prepare and record a recital-quality performance on {instrument}." }
  ]
};

function goalNote(goal: string): string {
  switch (goal) {
    case "Play songs":
      return " Framed around learning real songs you want to play.";
    case "Learn theory":
      return " Framed around understanding the music theory behind what you play.";
    case "Exam prep":
      return " Framed around building the technique examiners look for.";
    case "Improve performance":
      return " Framed around performance confidence and stage-readiness.";
    case "Decode sheet music":
      return " Framed around reading and translating sheet music fluently.";
    default:
      return "";
  }
}

export function getLessonPlan(instrument: string, level: string, goal: string): LessonStage[] {
  const stages = STAGE_TEMPLATES[level as Level] ?? STAGE_TEMPLATES.Beginner;
  const note = goalNote(goal);
  return stages.map((stage, index) => ({
    order: index,
    title: stage.title,
    description: index === 0
      ? stage.description.replaceAll("{instrument}", instrument) + note
      : stage.description.replaceAll("{instrument}", instrument)
  }));
}
