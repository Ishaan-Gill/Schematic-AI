export function cleanSql(sql: string): string {
    return sql
        .trim()
        .replace(/;+$/, "")
        .replace(/```sql/g, "")
        .replace(/```/g, "")
}
