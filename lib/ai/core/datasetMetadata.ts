type DatasetMetadataArgs = {
  query: string;
  schemas: Record<string, unknown[]>;
};

type ColumnLike = {
  column_name?: string;
  column_type?: string;
};

const normalize = (value: string): string =>
  value.trim().replace(/^["'`]+|["'`]+$/g, "").toLowerCase();

const HOW_MANY = /\bhow\s+many\s+(?:uploaded\s+)?(?:tables|datasets|sheets|files|views)\s*(?:\?|are\s+there)?\s*$/i;
const LIST_TABLES =
  /\blist\s+(?:me\s+)?(?:all\s+|the\s+|my\s+)?(?:tables|datasets|sheets|files|views)\s*\?*$/i;
const WHAT_TABLES =
  /\bwhat\s+tables\s+(?:do\s+i\s+have|are\s+(?:there|available)|did\s+i\s+upload)\s*\?*$/i;
const WHAT_COLUMNS =
  /\bwhat\s+columns\s+does\s+["']?([^"']+?)["']?\s+have\s*\?*$/i;
const COLUMNS_IN =
  /\b(?:what\s+columns\s+(?:are\s+)?in|list\s+(?:the\s+)?columns\s+(?:in|of|for)|show\s+columns\s+(?:in|of|for))\s+["']?([^"']+?)["']?\s*\?*$/i;
const DESCRIBE =
  /\b(?:describe|structure|show\s+schema\s+of|columns\s+of)\s+["']?([^"']+?)["']?\s*\?*$/i;

const noDatasets = () => "You haven't uploaded any datasets yet.";

const describeColumns = (
  tableName: string,
  columns: ColumnLike[],
): string => {
  if (columns.length === 0) {
    return `Table "${tableName}" has no columns.`;
  }

  const columnText = columns
    .map(
      (column) =>
        `${column.column_name ?? "?"} (${column.column_type ?? "unknown"})`,
    )
    .join(", ");

  return `Table "${tableName}" has ${columns.length} column${
    columns.length === 1 ? "" : "s"
  }: ${columnText}.`;
};

export const answerDatasetMetadata = ({
  query,
  schemas,
}: DatasetMetadataArgs): string | undefined => {
  const tableNames = Object.keys(schemas);

  if (HOW_MANY.test(query) || LIST_TABLES.test(query) || WHAT_TABLES.test(query)) {
    if (tableNames.length === 0) return noDatasets();

    return tableNames.length === 1
      ? `You have 1 table: ${tableNames[0]}.`
      : `You have ${tableNames.length} tables: ${tableNames.join(", ")}.`;
  }

  const columnsMatch =
    query.match(WHAT_COLUMNS) ?? query.match(COLUMNS_IN) ?? query.match(DESCRIBE);

  if (columnsMatch?.[1]) {
    const tableName = tableNames.find(
      (name) => normalize(name) === normalize(columnsMatch[1]),
    );

    if (!tableName) return undefined;

    return describeColumns(tableName, (schemas[tableName] ?? []) as ColumnLike[]);
  }

  return undefined;
};
