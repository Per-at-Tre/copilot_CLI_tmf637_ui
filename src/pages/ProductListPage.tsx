import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle, Braces, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { listProducts, deleteProduct } from '@/api/productApi';
import type { Product, ProductStatusType } from '@/types/tmf637';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 20;
const STATUS_OPTIONS: ProductStatusType[] = [
  'created', 'pendingActive', 'active', 'suspended', 'pendingTerminate', 'terminated', 'cancelled', 'aborted'
];

type SortField = 'name' | 'status' | 'lastUpdate';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function ProductListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [jsonTarget, setJsonTarget] = useState<Product | null>(null);

  const params = {
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    ...(search ? { name: search } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted', description: 'The product has been removed.' });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: 'Delete failed', description: 'Could not delete the product.', variant: 'destructive' });
    },
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(0);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(current => {
      if (!current || current.field !== field) {
        return { field, direction: 'asc' };
      }

      return {
        field,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  }, []);

  const products = data?.data ?? [];
  const sortedProducts = useMemo(() => {
    if (!sortConfig) {
      return products;
    }

    const compareText = (a?: string, b?: string) => {
      return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
    };

    const sorted = [...products].sort((a, b) => {
      let result = 0;

      switch (sortConfig.field) {
        case 'name':
          result = compareText(a.name, b.name);
          break;
        case 'status':
          result = compareText(a.status, b.status);
          break;
        case 'lastUpdate': {
          const aTime = a.lastUpdate ? Date.parse(a.lastUpdate) : Number.NaN;
          const bTime = b.lastUpdate ? Date.parse(b.lastUpdate) : Number.NaN;
          const aValid = Number.isFinite(aTime);
          const bValid = Number.isFinite(bTime);

          if (!aValid && !bValid) {
            result = 0;
          } else if (!aValid) {
            result = 1;
          } else if (!bValid) {
            result = -1;
          } else {
            result = aTime - bTime;
          }
          break;
        }
      }

      if (result === 0) {
        result = compareText(a.id, b.id);
      }

      return sortConfig.direction === 'asc' ? result : -result;
    });

    return sorted;
  }, [products, sortConfig]);

  const paginatedProducts = sortedProducts;

  const renderSortIcon = (field: SortField) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
    }

    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-gray-700" />
      : <ArrowDown className="h-3.5 w-3.5 text-gray-700" />;
  };

  const totalCount = (data?.totalCount ?? 0) || products.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = page * PAGE_SIZE + paginatedProducts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Loading products...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="font-medium text-gray-900">Failed to load products</p>
            <p className="text-sm text-gray-500 mt-1">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-medium text-gray-900">No products found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or create a new product.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th
                  className="px-4 py-3 text-left"
                  aria-sort={sortConfig?.field === 'name' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {renderSortIcon('name')}
                  </button>
                </th>
                <th
                  className="px-4 py-3 text-left"
                  aria-sort={sortConfig?.field === 'status' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th
                  className="px-4 py-3 text-left"
                  aria-sort={sortConfig?.field === 'lastUpdate' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => handleSort('lastUpdate')}
                  >
                    Last Modified
                    {renderSortIcon('lastUpdate')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Offering / Spec</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{product.name ?? '—'}</div>
                    {product.id && <div className="text-xs text-gray-400 font-mono mt-0.5">{product.id}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(product.lastUpdate)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div>{product.productOffering?.name ?? product.productSpecification?.name ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setJsonTarget(product)}
                        title="View JSON"
                      >
                        <Braces className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/products/${product.id}`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(product)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && products.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {pageStart}–{pageEnd} of {totalCount} products
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="px-2">Page {page + 1} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* JSON Viewer Dialog */}
      <Dialog open={!!jsonTarget} onOpenChange={open => { if (!open) setJsonTarget(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>JSON — {jsonTarget?.name ?? jsonTarget?.id}</DialogTitle>
            <DialogDescription>{jsonTarget?.id}</DialogDescription>
          </DialogHeader>
          <pre className="flex-1 overflow-auto rounded-md bg-gray-950 text-gray-100 text-xs p-4 font-mono leading-relaxed">
            {jsonTarget ? JSON.stringify(jsonTarget, null, 2) : ''}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              void navigator.clipboard.writeText(JSON.stringify(jsonTarget, null, 2));
              toast({ title: 'Copied to clipboard' });
            }}>Copy</Button>
            <Button onClick={() => setJsonTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name ?? deleteTarget?.id}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget?.id && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
