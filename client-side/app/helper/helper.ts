// timeUtils.ts

/**
 * Converts seconds into a concise human-readable format (e.g., "1 hr 15 min", "5 min", "45 sec").
 * Prioritizes the largest unit and only includes one or two units.
 * @param totalSeconds The total duration in seconds.
 * @returns A formatted string.
 */
export const formatTimeHuman = (totalSeconds: number): string => {
  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)} sec`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const remainingSecondsAfterHours = totalSeconds % 3600;
  const minutes = Math.floor(remainingSecondsAfterHours / 60);
  const seconds = Math.round(remainingSecondsAfterHours % 60);

  let parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
    if (minutes > 0) {
      parts.push(`${minutes} min`);
    }
  } else if (minutes > 0) {
    parts.push(`${minutes} min`);
    // Only include seconds if the duration is under 10 minutes and seconds are present
    if (minutes < 10 && seconds > 0) {
      parts.push(`${seconds} sec`);
    }
  } else if (seconds > 0) {
    parts.push(`${seconds} sec`);
  } else {
    return "0 sec";
  }

  // Concatenate up to the first two parts
  return parts.slice(0, 2).join(" ");
};

/**
 * Converts seconds into a minutes/seconds format (e.g., "5 min, 30 sec").
 * @param seconds The total duration in seconds.
 * @returns A formatted string.
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} min, ${secs} sec`;
};

/**
 * Converts a duration in seconds to the estimated local arrival time in ISO format.
 * @param seconds The duration in seconds.
 * @returns An ISO string representing the estimated local arrival time.
 */
export const toLocalDateTime = (seconds: number): string => {
  const now = new Date();
  const arrival = new Date(now.getTime() + seconds * 1000);
  return arrival.toISOString();
};
