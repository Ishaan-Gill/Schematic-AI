export const inferDateFormat = (samples: string[]): string | null => {
  const nonEmpty = samples.filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0,
  );
  if (nonEmpty.length === 0) return null;

  // Normalize year-first slashes to dashes (YYYY/MM/DD → YYYY-MM-DD)
  const normalizedSamples = nonEmpty.map((s) =>
    /^\d{4}\//.test(s) ? s.replace(/\//g, "-") : s,
  );

  // 1. Deterministic formats — check if ALL samples match
  if (normalizedSamples.every((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)))
    return "%Y-%m-%d";

  if (
    normalizedSamples.every((s) =>
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(
        s,
      ),
    )
  )
    return "%Y-%m-%dT%H:%M:%S";

  if (
    normalizedSamples.every((s) =>
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s),
    )
  )
    return "%Y-%m-%d %H:%M:%S";

  if (normalizedSamples.every((s) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)))
    return "%Y-%m-%d %H:%M";

  if (normalizedSamples.every((s) => /^\d{8}$/.test(s))) return "%Y%m%d";

  if (normalizedSamples.every((s) => /^\d{2}\.\d{2}\.\d{4}$/.test(s)))
    return "%d.%m.%Y";

  if (normalizedSamples.every((s) => /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/.test(s)))
    return "%d.%m.%Y %H:%M";

  // 2. Mixed-separator check — reject columns with both "." and "/" or "-" dates
  let hasDotDate = false;
  let hasSlashDashDate = false;
  for (const s of nonEmpty) {
    if (/^\d{2}\.\d{2}\.\d{4}(?: \d{2}:\d{2})?$/.test(s)) hasDotDate = true;
    if (/^\d{2}[\/-]\d{2}[\/-]\d{4}(?: \d{2}:\d{2})?$/.test(s))
      hasSlashDashDate = true;
  }
  if (hasDotDate && hasSlashDashDate) return null;

  // 3. Slash / dash ambiguous formats — evidence-based disambiguation
  //    Normalize "-" to "/" before inference (separator has no semantic meaning)
  let ddEv = 0;
  let mmEv = 0;
  let anyWithTime = false;
  let anyWithoutTime = false;

  for (const s of nonEmpty) {
    const normalized = s.replace(/-/g, "/");
    const m = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}:\d{2}))?$/);
    if (!m) continue;

    const first = parseInt(m[1], 10);
    const second = parseInt(m[2], 10);
    if (first > 12) ddEv++;
    if (second > 12) mmEv++;

    if (m[4]) anyWithTime = true;
    else anyWithoutTime = true;
  }

  if (ddEv === 0 && mmEv === 0) return null;
  if (ddEv > 0 && mmEv > 0) return null;

  const suffix = anyWithTime && !anyWithoutTime ? " %H:%M" : "";

  if (ddEv > 0) return `%d/%m/%Y${suffix}`;
  return `%m/%d/%Y${suffix}`;
};
