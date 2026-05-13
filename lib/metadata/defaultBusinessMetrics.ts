export const BUSINESS_METRICS = {
    popularity: {
        metric: "SUM(quantity)",
        description: "Most units sold"
    },

    revenue: {
        metric: "SUM(quantity * unitprice)",
        description: "Highest sales revenue"
    },

    frequency: {
        metric: "COUNT(*)",
        description: "Most frequent occurrences"
    },

    loyal_customers: {
        metric: "COUNT(DISTINCT invoiceno)",
        description: "Customers with many purchases"
    },

    wholesale: {
        metric: "AVG(quantity)",
        description: "Large bulk purchases"
    },

    retail: {
        metric: "AVG(quantity)",
        description: "Small individual purchases"
    },

    growth: {
        metric: "Revenue increase over time",
        description: "Trend comparison across dates"
    }
}