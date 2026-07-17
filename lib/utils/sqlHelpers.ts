export const quoteIdentifier = (name: string): string =>
  `"${name.replace(/"/g, '""')}"`;

export const escapeSqlString = (value: string): string =>
  value.replace(/'/g, "''");
