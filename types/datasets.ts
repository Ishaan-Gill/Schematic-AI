export type StoredDataset = {
  id?: string;

  user_id: string;

  table_name: string;

  storage_path: string;

  row_count: number;

  schema: {
    column_name: string;
    column_type: string;
  }[];

  profile: unknown;

  semantic: unknown;

  relationships: unknown[];
};
