import axios from 'axios';
import type { Product, Product_FVO, Product_MVO, ProductListResponse } from '@/types/tmf637';

const BASE_URL = 'http://localhost:8637/tmf-api/productInventoryManagement/v5';

const api = axios.create({ baseURL: BASE_URL });

export interface ListProductsParams {
  offset?: number;
  limit?: number;
  fields?: string;
  sort?: string;
  filter?: string;
  [key: string]: string | number | undefined;
}

export async function listProducts(params: ListProductsParams = {}): Promise<ProductListResponse> {
  const res = await api.get('/product', { params });
  return {
    data: res.data as Product[],
    totalCount: parseInt(res.headers['x-total-count'] ?? '0', 10),
    resultCount: parseInt(res.headers['x-result-count'] ?? String((res.data as Product[]).length), 10),
  };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await api.get(`/product/${id}`);
  return res.data as Product;
}

export async function createProduct(body: Product_FVO): Promise<Product> {
  const res = await api.post('/product', body);
  return res.data as Product;
}

export async function patchProduct(id: string, body: Product_MVO): Promise<Product> {
  const res = await api.patch(`/product/${id}`, body);
  return res.data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/product/${id}`);
}
