export function cleanSql(sql: string): string {
    return sql
        .trim()
        .replace(/```sql/gi, "")
        .replace(/```/g, "")
        .trim()
        .replace(/;+$/, "")
        .trim()
}
