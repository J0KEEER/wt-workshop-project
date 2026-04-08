/**
 * Parse pagination params from query string.
 * @param {object} query - req.query
 * @returns {{ limit: number, offset: number, page: number }}
 */
export function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

/**
 * Format paginated response.
 * @param {Array} rows - data rows
 * @param {number} count - total count
 * @param {{ page: number, limit: number }} pagination
 */
export function paginatedResponse(rows, count, { page, limit }) {
    return {
        data: rows,
        pagination: {
            page,
            limit,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            hasNext: page * limit < count,
            hasPrev: page > 1,
        },
    };
}
