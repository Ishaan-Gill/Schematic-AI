// Bounds for how much workspace schema is sent to the SQL-generation LLM.
// Shared by the server prompt builder and the client-side overflow warning
// so the two can never drift apart.
export const MAX_CONTEXT_TABLES = 8;
export const MAX_CONTEXT_COLUMNS = 30;
