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
 * Get OData service metadata (EDMX XML).
 * Useful for debugging or displaying available entity sets.
 */
export const getODataMetadata = () =>
    axiosClient.get(`${ODATA_BASE}/$metadata`).then((r) => r.data);
