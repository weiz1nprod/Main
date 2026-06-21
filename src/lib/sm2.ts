// SuperMemo 2 algorithm implementation
export function calculateSM2(
  quality: number, // 0-5
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number
) {
  let newRepetitions = repetitions;
  let interval = previousInterval;
  let easeFactor = previousEaseFactor;

  if (quality >= 3) {
    if (newRepetitions === 0) {
      interval = 1;
    } else if (newRepetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * easeFactor);
    }
    newRepetitions++;
  } else {
    newRepetitions = 0;
    interval = 1;
  }

  easeFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    nextReviewDate,
    interval,
    easeFactor,
    repetitions: newRepetitions
  };
}
