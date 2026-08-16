export const toJsonSafe = (value: unknown): unknown =>
  JSON.parse(
    JSON.stringify(value, (_, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  );