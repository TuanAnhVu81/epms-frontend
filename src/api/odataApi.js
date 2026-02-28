import axiosClient from './axiosClient';
import { buildODataQuery, parseODataResponse } from '../utils/odata';

/**
 * OData V4 API Layer
 *
 * Base URL: /odata
 * All endpoints follow OData V4 specification.
 *
 * Supported query options (per API_Reference.md):
 *   $top, $skip, $orderby, $filter, $count
 */

const ODATA_BASE = '/odata';

/**
 * Query PurchaseOrders via OData V4 endpoint.
 * Supports pagination ($top/$skip), sorting ($orderby),
 * status filter and keyword search (via $filter).
 *
 * @param {object} queryParams - { page, pageSize, sort, statusFilter, keyword }
 * @returns {Promise<{ data: Array, total: number }>}
 */
export const queryPurchaseOrdersOData = async (queryParams) => {
    const queryString = buildODataQuery(queryParams);
    const response = await axiosClient.get(`${ODATA_BASE}/PurchaseOrders${queryString}`);
    return parseODataResponse(response);
};

/**
 * Query Vendors via OData V4 endpoint.
 * Useful for advanced vendor search across multiple fields simultaneously.
 *
 * @param {object} queryParams - { page, pageSize, sort, keyword }
 * @returns {Promise<{ data: Array, total: number }>}
 */
export const queryVendorsOData = async (queryParams) => {
    const queryString = buildODataQuery(queryParams);
    const response = await axiosClient.get(`${ODATA_BASE}/Vendors${queryString}`);
    return parseODataResponse(response);
};

/**
 * Query Materials via OData V4 endpoint.
 *
 * @param {object} queryParams - { page, pageSize, sort, keyword }
 * @returns {Promise<{ data: Array, total: number }>}
 */
export const queryMaterialsOData = async (queryParams) => {
    const queryString = buildODataQuery(queryParams);
    const response = await axiosClient.get(`${ODATA_BASE}/Materials${queryString}`);
    return parseODataResponse(response);
};

/**
 * Fetch ALL active vendors for dropdown/select components.
 * Uses OData $filter=status eq 'ACTIVE' with large $top to load entire list.
 * Replaces the old REST getVendors({ page: 0, size: 200 }) call.
 *
 * @returns {Promise<Array>} flat array of vendor objects
 */
export const fetchAllVendorsForDropdown = async () => {
    const response = await axiosClient.get(
        `${ODATA_BASE}/Vendors?$top=500&$orderby=name asc&$filter=status eq 'ACTIVE'`
    );
    // OData wraps data in { value: [...] }
    return response.data?.value ?? [];
};

/**
 * Fetch ALL active materials for dropdown/select components.
 * Uses OData $filter=isActive eq true with large $top to load entire list.
 * Replaces the old REST getActiveMaterials({ page: 0, size: 500 }) call.
 *
 * @returns {Promise<Array>} flat array of material objects
 */
export const fetchAllActiveMaterialsForDropdown = async () => {
    const response = await axiosClient.get(
        `${ODATA_BASE}/Materials?$top=1000&$orderby=description asc&$filter=isActive eq true`
    );
    return response.data?.value ?? [];
};

/**
 * Get OData service metadata (EDMX XML).
 * Useful for debugging or displaying available entity sets.
 */
export const getODataMetadata = () =>
    axiosClient.get(`${ODATA_BASE}/$metadata`).then((r) => r.data);
