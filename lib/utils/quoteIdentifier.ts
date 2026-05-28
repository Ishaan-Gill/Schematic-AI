export const quoteIdentifier = (name: string): string =>
    `"${name.replace(/"/g, '""')}"`