import { DeliveryStatusType } from "./types";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CommissionData {
  address: string;
  specification: string;
  deliveryInstructions: string;
  coordinates: Coordinates;
}

export interface GeoapifyFeatureCollection {
  type: "FeatureCollection";
  features: GeoapifyFeature[];
}

export interface GeoapifyFeature {
  type: "Feature";
  properties: GeoapifyProperties;
  geometry: GeoapifyGeometry;
  bbox?: number[];
}
export interface NavigateRegion {
  Orders: string;
  address: string;
  region: any;
}

export interface GeoapifyProperties {
  country: string;
  country_code: string;
  region?: string;
  state?: string;
  city?: string;
  village?: string;
  municipality?: string;
  county?: string;
  postcode?: string;
  suburb?: string;
  iso3166_2?: string;
  datasource: GeoapifyDatasource;
  lon: number;
  lat: number;
  population?: number;
  result_type: string;
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  category?: string;
  timezone?: GeoapifyTimezone;
  plus_code?: string;
  plus_code_short?: string;
  rank?: GeoapifyRank;
  place_id: string;
}

export interface GeoapifyDatasource {
  sourcename: string;
  attribution: string;
  license: string;
  url: string;
}

export interface GeoapifyTimezone {
  name: string;
  offset_STD: string;
  offset_STD_seconds: number;
  offset_DST: string;
  offset_DST_seconds: number;
  abbreviation_STD: string;
  abbreviation_DST: string;
}

export interface GeoapifyRank {
  confidence: number;
  confidence_city_level?: number;
  match_type?: string;
}

export interface GeoapifyGeometry {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface LocationPickerParams {
  returnAddress: string;
  returnLocation: Coordinates;
}

export interface Order {
  orderId: number;
  orderStatus: DeliveryStatusType;
  orderTime: Date;
  formattedTime: string;
  locationBought: string;
  specification: string;
  instructions: string;
  placeDelivered: string;
  fee: number;
}

export interface User {
  imageUrl: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phoneNumber: string;
  dateOfBirth: Date;
  emailAddress: string;
  password: string;
}

export { Coordinates, CommissionData };
