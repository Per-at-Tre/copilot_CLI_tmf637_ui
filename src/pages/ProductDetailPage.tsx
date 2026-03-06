import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, Loader2, AlertCircle, Package } from 'lucide-react';
import { getProduct, deleteProduct } from '@/api/productApi';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted', description: 'The product has been removed.' });
      navigate('/products');
    },
    onError: () => {
      toast({ title: 'Delete failed', description: 'Could not delete the product.', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading product...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <p className="font-medium text-gray-900">Failed to load product</p>
        <p className="text-sm text-gray-500">{error instanceof Error ? error.message : 'Not found.'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>Back to list</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{product.name ?? 'Unnamed Product'}</h1>
              <StatusBadge status={product.status} />
            </div>
            {product.id && <p className="text-sm text-gray-400 font-mono mt-1">{product.id}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Basic Information</CardTitle></CardHeader>
          <CardContent>
            <dl>
              <InfoRow label="Name" value={product.name} />
              <InfoRow label="Description" value={product.description} />
              <InfoRow label="Status" value={<StatusBadge status={product.status} />} />
              <InfoRow label="Is Bundle" value={product.isBundle != null ? String(product.isBundle) : undefined} />
              <InfoRow label="Customer Visible" value={product.isCustomerVisible != null ? String(product.isCustomerVisible) : undefined} />
              <InfoRow label="Serial Number" value={product.productSerialNumber} />
              <InfoRow label="Order Date" value={formatDate(product.orderDate)} />
              <InfoRow label="Start Date" value={formatDate(product.startDate)} />
              <InfoRow label="Termination Date" value={formatDate(product.terminationDate)} />
              <InfoRow label="Creation Date" value={formatDate(product.creationDate)} />
            </dl>
          </CardContent>
        </Card>

        {/* Specification & Offering */}
        {(product.productSpecification || product.productOffering) && (
          <Card>
            <CardHeader><CardTitle>Specification & Offering</CardTitle></CardHeader>
            <CardContent>
              <dl>
                {product.productSpecification && (
                  <>
                    <InfoRow label="Spec ID" value={product.productSpecification.id} />
                    <InfoRow label="Spec Name" value={product.productSpecification.name} />
                    <InfoRow label="Spec Version" value={product.productSpecification.version} />
                  </>
                )}
                {product.productOffering && (
                  <>
                    <InfoRow label="Offering ID" value={product.productOffering.id} />
                    <InfoRow label="Offering Name" value={product.productOffering.name} />
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Characteristics */}
        {product.productCharacteristic && product.productCharacteristic.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Characteristics</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.productCharacteristic.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium">{c.name ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{c.valueType ?? '—'}</td>
                      <td className="px-3 py-2">{c.value != null ? String(c.value) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Related Parties */}
        {product.relatedParty && product.relatedParty.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Related Parties</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Role</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.relatedParty.map((rp, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{rp.role ?? '—'}</td>
                      <td className="px-3 py-2">{rp.partyOrPartyRole?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{rp.partyOrPartyRole?.['@referredType'] ?? rp['@type'] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        {product.productPrice && product.productPrice.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Amount</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.productPrice.map((pp, i) => {
                    const amount = pp.price?.taxIncludedAmount ?? pp.price?.dutyFreeAmount;
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium">{pp.name ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{pp.priceType ?? '—'}</td>
                        <td className="px-3 py-2">{amount ? `${amount.value} ${amount.unit}` : '—'}</td>
                        <td className="px-3 py-2">{pp.recurringChargePeriod ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Terms */}
        {product.productTerm && product.productTerm.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Product Terms</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Duration</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Valid From</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Valid To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.productTerm.map((t, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium">{t.name ?? '—'}</td>
                      <td className="px-3 py-2">{t.duration ? `${t.duration.amount} ${t.duration.units}` : '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(t.validFor?.startDateTime)}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(t.validFor?.endDateTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Realizing Services & Resources */}
        {((product.realizingService && product.realizingService.length > 0) ||
          (product.realizingResource && product.realizingResource.length > 0)) && (
          <Card>
            <CardHeader><CardTitle>Realizing Services & Resources</CardTitle></CardHeader>
            <CardContent>
              {product.realizingService && product.realizingService.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                  <ul className="space-y-1">
                    {product.realizingService.map((s, i) => (
                      <li key={i} className="text-sm text-gray-600">{s.name ?? s.id ?? '—'}</li>
                    ))}
                  </ul>
                </div>
              )}
              {product.realizingResource && product.realizingResource.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Resources</h4>
                  <ul className="space-y-1">
                    {product.realizingResource.map((r, i) => (
                      <li key={i} className="text-sm text-gray-600">{r.name ?? r.id ?? '—'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{product.name ?? product.id}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
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
