export interface TimePeriod {
  startDateTime?: string;
  endDateTime?: string;
}

export interface Money {
  unit?: string;
  value?: number;
}

export interface Price {
  '@type'?: string;
  taxIncludedAmount?: Money;
  dutyFreeAmount?: Money;
  taxRate?: number;
  percentage?: number;
  unit?: string;
  value?: number;
}

export interface Duration {
  amount?: number;
  units?: string;
}

export interface Quantity {
  amount?: number;
  units?: string;
}

export interface PlaceRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface RelatedPlaceRefOrValue {
  '@type'?: string;
  role?: string;
  place?: PlaceRef;
}

export interface PartyRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface RelatedPartyOrPartyRole {
  '@type'?: string;
  role?: string;
  partyOrPartyRole?: PartyRef;
}

export interface ProductSpecificationRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
  version?: string;
}

export interface ProductOfferingRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface ProductOfferingPriceRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface ServiceRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface ResourceRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface AccountRef {
  '@type'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface AgreementItemRef {
  '@type'?: string;
  id?: string;
  href?: string;
  name?: string;
  agreementItemId?: string;
}

export interface BillingAccountRef {
  '@type'?: string;
  id?: string;
  href?: string;
  name?: string;
  ratingType?: string;
}

export interface CharacteristicRelationship {
  '@type'?: string;
  id?: string;
  relationshipType?: string;
}

export interface Characteristic {
  '@type': string;
  id?: string;
  name?: string;
  valueType?: string;
  value?: unknown;
  characteristicRelationship?: CharacteristicRelationship[];
}

export interface ProductPrice {
  '@type'?: string;
  name?: string;
  description?: string;
  priceType?: string;
  recurringChargePeriod?: string;
  unitOfMeasure?: string;
  price?: Price;
  productOfferingPrice?: ProductOfferingPriceRef;
}

export interface ProductTerm {
  '@type'?: string;
  name?: string;
  description?: string;
  duration?: Duration;
  validFor?: TimePeriod;
}

export interface ProductRef {
  '@type'?: string;
  '@referredType'?: string;
  id?: string;
  href?: string;
  name?: string;
}

export interface ProductRelationship {
  '@type'?: string;
  id?: string;
  href?: string;
  name?: string;
  relationshipType?: string;
  product?: ProductRef;
}

export type ProductStatusType = 'created' | 'pendingActive' | 'cancelled' | 'active' | 'pendingTerminate' | 'terminated' | 'suspended' | 'aborted';

export interface Product {
  '@type'?: string;
  '@baseType'?: string;
  '@schemaLocation'?: string;
  id?: string;
  href?: string;
  name?: string;
  description?: string;
  isBundle?: boolean;
  isCustomerVisible?: boolean;
  status?: ProductStatusType;
  orderDate?: string;
  startDate?: string;
  terminationDate?: string;
  creationDate?: string;
  lastUpdate?: string;
  productSerialNumber?: string;
  place?: RelatedPlaceRefOrValue[];
  relatedParty?: RelatedPartyOrPartyRole[];
  productCharacteristic?: Characteristic[];
  productRelationship?: ProductRelationship[];
  productSpecification?: ProductSpecificationRef;
  productOffering?: ProductOfferingRef;
  productPrice?: ProductPrice[];
  productTerm?: ProductTerm[];
  realizingService?: ServiceRef[];
  realizingResource?: ResourceRef[];
  billingAccount?: BillingAccountRef;
  agreement?: AgreementItemRef[];
  productOrderItem?: unknown[];
}

export interface Product_FVO extends Omit<Product, 'id' | 'href' | 'creationDate'> {
  '@type': string;
}

export interface Product_MVO extends Partial<Product> {
  '@type': string;
}

export interface ProductListResponse {
  data: Product[];
  totalCount: number;
  resultCount: number;
}
