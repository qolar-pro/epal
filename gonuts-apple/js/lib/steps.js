/** Which step is playing at a given second? Steps are listed by start time, ascending. */
export function currentStep(starts, seconds) {
  let current = -1;
  for (let i = 0; i < starts.length; i += 1) if (seconds >= starts[i]) current = i;
  return current;
}
