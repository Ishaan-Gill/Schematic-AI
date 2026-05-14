const MAX_ROWS = 2_000_000
const MAX_COLUMNS = 200

type ValidateTableArgs = {
    rowCount: number
    columns: Array<unknown>
}
export const validateTable = ({
    rowCount,
    columns,
}: ValidateTableArgs) => {
    if (rowCount > MAX_ROWS) {
        throw new Error(`Dataset too large. Maximum rows allowed: ${MAX_ROWS.toLocaleString()}`)
    }

    if (columns.length > MAX_COLUMNS) {
        throw new Error(`Too many columns. Maximum supported: ${MAX_COLUMNS}`)
    }
}