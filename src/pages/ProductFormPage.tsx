import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react';
import { getProduct, createProduct, patchProduct } from '@/api/productApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { Product_FVO, Product_MVO } from '@/types/tmf637';

const characteristicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  valueType: z.enum(['string', 'boolean', 'number', 'integer', 'object']),
  value: z.string(),
});

const relatedPartySchema = z.object({
  role: z.string().min(1, 'Role is required'),
  name: z.string().min(1, 'Name is required'),
  id: z.string(),
  partyType: z.enum(['Individual', 'Organization', 'PartyRole']),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  status: z.enum(['created', 'pendingActive', 'active', 'suspended', 'pendingTerminate', 'terminated', 'cancelled', 'aborted']).optional(),
  isBundle: z.boolean(),
  isCustomerVisible: z.boolean(),
  specId: z.string(),
  specName: z.string(),
  offeringId: z.string(),
  offeringName: z.string(),
  characteristics: z.array(characteristicSchema),
  relatedParties: z.array(relatedPartySchema),
});

type ProductFormValues = z.infer<typeof productSchema>;

const STATUS_OPTIONS = ['created', 'pendingActive', 'active', 'suspended', 'pendingTerminate', 'terminated', 'cancelled', 'aborted'] as const;
const VALUE_TYPES = ['string', 'boolean', 'number', 'integer', 'object'] as const;
const PARTY_TYPES = ['Individual', 'Organization', 'PartyRole'] as const;

const defaultValues: ProductFormValues = {
  name: '',
  description: '',
  status: undefined,
  isBundle: false,
  isCustomerVisible: true,
  specId: '',
  specName: '',
  offeringId: '',
  offeringName: '',
  characteristics: [],
  relatedParties: [],
};

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const { fields: charFields, append: appendChar, remove: removeChar } = useFieldArray({
    control,
    name: 'characteristics',
  });

  const { fields: partyFields, append: appendParty, remove: removeParty } = useFieldArray({
    control,
    name: 'relatedParties',
  });

  // Populate form when editing — use reset() so useFieldArray fields also update
  useEffect(() => {
    if (existingProduct) {
      reset({
        name: existingProduct.name ?? '',
        description: existingProduct.description ?? '',
        status: existingProduct.status,
        isBundle: existingProduct.isBundle ?? false,
        isCustomerVisible: existingProduct.isCustomerVisible ?? true,
        specId: existingProduct.productSpecification?.id ?? '',
        specName: existingProduct.productSpecification?.name ?? '',
        offeringId: existingProduct.productOffering?.id ?? '',
        offeringName: existingProduct.productOffering?.name ?? '',
        characteristics: (existingProduct.productCharacteristic ?? []).map(c => ({
          name: c.name ?? '',
          valueType: (c.valueType ?? 'string') as 'string' | 'boolean' | 'number' | 'integer' | 'object',
          value: c.value != null ? String(c.value) : '',
        })),
        relatedParties: (existingProduct.relatedParty ?? []).map(rp => ({
          role: rp.role ?? '',
          name: rp.partyOrPartyRole?.name ?? '',
          id: rp.partyOrPartyRole?.id ?? '',
          partyType: (rp.partyOrPartyRole?.['@referredType'] ?? 'Individual') as 'Individual' | 'Organization' | 'PartyRole',
        })),
      });
    }
  }, [existingProduct, reset]);

  const createMutation = useMutation({
    mutationFn: (body: Product_FVO) => createProduct(body),
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product created', description: `"${product?.name ?? 'Product'}" has been created.` });
      navigate('/products');
    },
    onError: (err) => {
      console.error('[ProductForm] Create error:', err);
      toast({ title: 'Create failed', description: 'Could not create the product.', variant: 'destructive' });
    },
  });

  const patchMutation = useMutation({
    mutationFn: (body: Product_MVO) => patchProduct(id!, body),
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast({ title: 'Product updated', description: `"${product?.name ?? 'Product'}" has been updated.` });
      navigate('/products');
    },
    onError: (err) => {
      console.error('[ProductForm] Patch error:', err);
      toast({ title: 'Update failed', description: 'Could not update the product.', variant: 'destructive' });
    },
  });

  const isPending = createMutation.isPending || patchMutation.isPending;

  const onSubmit = (values: ProductFormValues) => {
    console.log('[ProductForm] onSubmit called, values:', values);
    const body = {
      '@type': 'Product',
      name: values.name,
      description: values.description,
      status: values.status,
      isBundle: values.isBundle,
      isCustomerVisible: values.isCustomerVisible,
      ...(values.specId ? {
        productSpecification: { '@type': 'ProductSpecificationRef', id: values.specId, name: values.specName || undefined }
      } : {}),
      ...(values.offeringId ? {
        productOffering: { '@type': 'ProductOfferingRef', id: values.offeringId, name: values.offeringName || undefined }
      } : {}),
      productCharacteristic: values.characteristics.map(c => ({
        '@type': 'Characteristic',
        name: c.name,
        valueType: c.valueType,
        value: c.value,
      })),
      relatedParty: values.relatedParties.map(rp => ({
        '@type': 'RelatedPartyOrPartyRole',
        role: rp.role,
        partyOrPartyRole: {
          '@type': 'PartyRef',
          '@referredType': rp.partyType,
          id: rp.id || undefined,
          name: rp.name,
        },
      })),
    };

    if (isEdit) {
      patchMutation.mutate(body as Product_MVO);
    } else {
      createMutation.mutate(body as Product_FVO);
    }
  };

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    console.error('[ProductForm] Validation failed:', fieldErrors);
    toast({
      title: 'Validation failed',
      description: `Fix errors in: ${Object.keys(fieldErrors).join(', ')}`,
      variant: 'destructive',
    });
  };


  if (isEdit && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input id="name" {...register('name')} placeholder="Product name" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Textarea
                    id="description"
                    placeholder="Optional description"
                    rows={3}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('isBundle')} className="h-4 w-4 rounded border-gray-300" />
                Is Bundle
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('isCustomerVisible')} className="h-4 w-4 rounded border-gray-300" />
                Customer Visible
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Specification & Offering */}
        <Card>
          <CardHeader><CardTitle>Specification & Offering</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="specId">Specification ID</Label>
                <Input id="specId" {...register('specId')} placeholder="Specification ID" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="specName">Specification Name</Label>
                <Input id="specName" {...register('specName')} placeholder="Specification Name" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="offeringId">Offering ID</Label>
                <Input id="offeringId" {...register('offeringId')} placeholder="Offering ID" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="offeringName">Offering Name</Label>
                <Input id="offeringName" {...register('offeringName')} placeholder="Offering Name" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Characteristics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Characteristics</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendChar({ name: '', valueType: 'string', value: '' })}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {charFields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No characteristics. Click "Add" to add one.</p>
            ) : (
              <div className="space-y-3">
                {charFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_140px_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs text-gray-500">Name</Label>}
                      <Input {...register(`characteristics.${index}.name`)} placeholder="Name" />
                      {errors.characteristics?.[index]?.name && (
                        <p className="text-xs text-red-500">{errors.characteristics[index].name?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs text-gray-500">Type</Label>}
                      <Select
                        value={watch(`characteristics.${index}.valueType`)}
                        onValueChange={v => setValue(`characteristics.${index}.valueType`, v as 'string' | 'boolean' | 'number' | 'integer' | 'object')}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {VALUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs text-gray-500">Value</Label>}
                      <Input {...register(`characteristics.${index}.value`)} placeholder="Value" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600"
                      onClick={() => removeChar(index)}
                      style={index === 0 ? { marginTop: '22px' } : {}}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Parties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Related Parties</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendParty({ role: '', name: '', id: '', partyType: 'Individual' })}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {partyFields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No related parties. Click "Add" to add one.</p>
            ) : (
              <div className="space-y-3">
                {partyFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_140px_auto] gap-2 items-end">
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs text-gray-500">Role</Label>}
                      <Input {...register(`relatedParties.${index}.role`)} placeholder="Role" />
                      {errors.relatedParties?.[index]?.role && (
                        <p className="text-xs text-red-500">{errors.relatedParties[index].role?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs text-gray-500">Name</Label>}
                      <Input {...register(`relatedParties.${index}.name`)} placeholder="Name" />
                      {errors.relatedParties?.[index]?.name && (
                        <p className="text-xs text-red-500">{errors.relatedParties[index].name?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs text-gray-500">Party ID</Label>}
                      <Input {...register(`relatedParties.${index}.id`)} placeholder="ID (optional)" />
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs text-gray-500">Type</Label>}
                      <Select
                        value={watch(`relatedParties.${index}.partyType`)}
                        onValueChange={v => setValue(`relatedParties.${index}.partyType`, v as 'Individual' | 'Organization' | 'PartyRole')}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PARTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600"
                      onClick={() => removeParty(index)}
                      style={index === 0 ? { marginTop: '22px' } : {}}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
