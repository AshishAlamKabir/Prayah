// Shipping calculation utilities

export interface ShippingRate {
  region: string;
  rate: number;
  description: string;
}

export const SHIPPING_RATES: ShippingRate[] = [
  {
    region: "northeast",
    rate: 80,
    description: "Northeast India"
  },
  {
    region: "west-bengal", 
    rate: 80,
    description: "West Bengal"
  },
  {
    region: "rest-of-india",
    rate: 150,
    description: "Rest of India"
  }
];

// Northeast states
const NORTHEAST_STATES = [
  "arunachal pradesh",
  "assam", 
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "sikkim",
  "tripura"
];

export function getShippingRegion(address: string): string {
  if (!address) return "rest-of-india";
  
  const lowerAddress = address.toLowerCase();
  
  // Check for West Bengal
  if (lowerAddress.includes("west bengal") || 
      lowerAddress.includes("kolkata") || 
      lowerAddress.includes("wb")) {
    return "west-bengal";
  }
  
  // Check for Northeast states
  for (const state of NORTHEAST_STATES) {
    if (lowerAddress.includes(state)) {
      return "northeast";
    }
  }
  
  return "rest-of-india";
}

export function calculateShipping(region: string): number {
  const shippingRate = SHIPPING_RATES.find(rate => rate.region === region);
  return shippingRate ? shippingRate.rate : SHIPPING_RATES.find(rate => rate.region === "rest-of-india")?.rate || 150;
}

export function getShippingRateByRegion(region: string): ShippingRate | undefined {
  return SHIPPING_RATES.find(rate => rate.region === region);
}