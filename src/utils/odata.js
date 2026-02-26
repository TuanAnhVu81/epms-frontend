/**
 * OData V4 Query Builder Utility
 *
 * Converts UI parameters (pagination, sort, filter, search) into
 * a valid OData V4 query string that can be appended to any OData endpoint.
 *
 * OData V4 Syntax Reference used:
 *   $top=10         → limit rows (like SQL LIMIT)
 *   $skip=0         → offset rows (like SQL OFFSET)
 *   $count=true     → ask backend to return total count in response
 *   $orderby=field desc → sorting
 *   $filter=...     → dynamic filter expression
 *   $search=...     → free-text search (if backend supports it)
 */

/**
 * Build a complete OData query string from UI parameters.
 *
 * @param {object} options
 * @param {number} options.page       - 1-indexed page number (from Ant Design Table)
 * @param {number} options.pageSize   - rows per page
 * @param {object|null} options.sort  - { field: string, order: 'ascend'|'descend' } from Ant Design sorter
 * @param {string|null} options.statusFilter - e.g. 'APPROVED', 'PENDING'
 * @param {string|null} options.keyword      - free-text search keyword
 * @returns {string} URL query string e.g. "?$top=10&$skip=0&$count=true&$filter=..."
 */
export function buildODataQuery({ page = 1, pageSize = 10, sort = null, statusFilter = null, keyword = '' } = {}) {
    const params = new URLSearchParams();

    // ── Pagination ────────────────────────────────────────────────────────────
    params.set('$top', pageSize);
    params.set('$skip', (page - 1) * pageSize); // Convert 1-indexed to 0-indexed offset
    params.set('$count', 'true');               // Always request total count for pagination display

    // ── Sorting ───────────────────────────────────────────────────────────────
    if (sort?.field && sort?.order) {
        // Ant Design returns 'ascend'/'descend' → OData expects 'asc'/'desc'
        const direction = sort.order === 'descend' ? 'desc' : 'asc';
        params.set('$orderby', `${sort.field} ${direction}`);
    } else {
        // Default: newest POs first by creation date
        params.set('$orderby', 'createdAt desc');
    }

    // ── Filtering ($filter) ───────────────────────────────────────────────────
    const filterClauses = [];

    // Status filter: e.g. status eq 'APPROVED'
    if (statusFilter) {
        filterClauses.push(`status eq '${statusFilter}'`);
    }

    // Keyword search: use OData 'contains' function on poNumber and vendorName
    // Syntax: contains(field, 'keyword')
    if (keyword && keyword.trim()) {
        const kw = keyword.trim().replace(/'/g, "''"); // Escape single quotes (SQL-injection safe)
        filterClauses.push(`(contains(poNumber, '${kw}') or contains(vendorName, '${kw}'))`);
    }

    // Join multiple filter clauses with 'and'
    if (filterClauses.length > 0) {
        params.set('$filter', filterClauses.join(' and '));
    }

    return `?${params.toString()}`;
}

/**
 * Parse OData V4 response envelope.
 *
 * OData responses typically wrap data in:
 * {
 *   "@odata.count": 150,        ← total count (only present if $count=true)
 *   "value": [ {...}, {...} ]   ← actual data array
 * }
 *
 * @param {object} response - raw Axios response object
 * @returns {{ data: Array, total: number }}
 */
export function parseODataResponse(response) {
    const body = response.data;

    // OData standard: data lives inside "value" key
    const data = Array.isArray(body?.value) ? body.value : [];

    // Total count from "@odata.count" annotation (present when $count=true)
    const total = body?.['@odata.count'] ?? data.length;

    return { data, total };
}
