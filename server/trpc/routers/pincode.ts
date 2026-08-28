import { z } from 'zod'
import { router, publicProcedure } from '../index.js'

// Curated high-frequency pincode dictionary for fast offline resolution
export const PINCODE_DIRECTORY: Record<string, { city: string; district: string; state: string; cod: boolean; days: number }> = {
  // Kerala
  '682001': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', cod: true, days: 2 },
  '682011': { city: 'Kochi (Kaloor)', district: 'Ernakulam', state: 'Kerala', cod: true, days: 2 },
  '682016': { city: 'Kochi (MG Road)', district: 'Ernakulam', state: 'Kerala', cod: true, days: 2 },
  '682020': { city: 'Kochi (Kadavanthra)', district: 'Ernakulam', state: 'Kerala', cod: true, days: 2 },
  '682024': { city: 'Edappally', district: 'Ernakulam', state: 'Kerala', cod: true, days: 2 },
  '682030': { city: 'Kakkanad (Infopark)', district: 'Ernakulam', state: 'Kerala', cod: true, days: 2 },
  '682031': { city: 'Palarivattom', district: 'Ernakulam', state: 'Kerala', cod: true, days: 2 },
  '695001': { city: 'Thiruvananthapuram', district: 'Thiruvananthapuram', state: 'Kerala', cod: true, days: 2 },
  '695004': { city: 'Kowdiar', district: 'Thiruvananthapuram', state: 'Kerala', cod: true, days: 2 },
  '673001': { city: 'Kozhikode', district: 'Kozhikode', state: 'Kerala', cod: true, days: 2 },
  '673004': { city: 'Calicut Town', district: 'Kozhikode', state: 'Kerala', cod: true, days: 2 },
  '680001': { city: 'Thrissur', district: 'Thrissur', state: 'Kerala', cod: true, days: 2 },
  '686001': { city: 'Kottayam', district: 'Kottayam', state: 'Kerala', cod: true, days: 2 },
  '691001': { city: 'Kollam', district: 'Kollam', state: 'Kerala', cod: true, days: 2 },
  '670001': { city: 'Kannur', district: 'Kannur', state: 'Kerala', cod: true, days: 2 },
  '678001': { city: 'Palakkad', district: 'Palakkad', state: 'Kerala', cod: true, days: 2 },
  '676505': { city: 'Malappuram', district: 'Malappuram', state: 'Kerala', cod: true, days: 2 },
  '688001': { city: 'Alappuzha', district: 'Alappuzha', state: 'Kerala', cod: true, days: 2 },
  '685584': { city: 'Munnar', district: 'Idukki', state: 'Kerala', cod: true, days: 3 },
  '671121': { city: 'Kasaragod', district: 'Kasaragod', state: 'Kerala', cod: true, days: 3 },

  // Tamil Nadu
  '600001': { city: 'Chennai (George Town)', district: 'Chennai', state: 'Tamil Nadu', cod: true, days: 2 },
  '600002': { city: 'Chennai (Anna Salai)', district: 'Chennai', state: 'Tamil Nadu', cod: true, days: 2 },
  '600004': { city: 'Chennai (Mylapore)', district: 'Chennai', state: 'Tamil Nadu', cod: true, days: 2 },
  '600017': { city: 'Chennai (T. Nagar)', district: 'Chennai', state: 'Tamil Nadu', cod: true, days: 2 },
  '600028': { city: 'Chennai (R.A. Puram)', district: 'Chennai', state: 'Tamil Nadu', cod: true, days: 2 },
  '600040': { city: 'Chennai (Anna Nagar)', district: 'Chennai', state: 'Tamil Nadu', cod: true, days: 2 },
  '641001': { city: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu', cod: true, days: 2 },
  '625001': { city: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', cod: true, days: 2 },
  '620001': { city: 'Tiruchirappalli', district: 'Tiruchirappalli', state: 'Tamil Nadu', cod: true, days: 2 },
  '636001': { city: 'Salem', district: 'Salem', state: 'Tamil Nadu', cod: true, days: 2 },

  // Karnataka
  '560001': { city: 'Bengaluru (MG Road)', district: 'Bengaluru Urban', state: 'Karnataka', cod: true, days: 2 },
  '560034': { city: 'Bengaluru (Koramangala)', district: 'Bengaluru Urban', state: 'Karnataka', cod: true, days: 2 },
  '560038': { city: 'Bengaluru (Indiranagar)', district: 'Bengaluru Urban', state: 'Karnataka', cod: true, days: 2 },
  '560066': { city: 'Bengaluru (Whitefield)', district: 'Bengaluru Urban', state: 'Karnataka', cod: true, days: 2 },
  '560076': { city: 'Bengaluru (BTM Layout)', district: 'Bengaluru Urban', state: 'Karnataka', cod: true, days: 2 },
  '560102': { city: 'Bengaluru (HSR Layout)', district: 'Bengaluru Urban', state: 'Karnataka', cod: true, days: 2 },
  '570001': { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka', cod: true, days: 2 },
  '575001': { city: 'Mangaluru', district: 'Dakshina Kannada', state: 'Karnataka', cod: true, days: 2 },

  // Telangana & Andhra Pradesh
  '500001': { city: 'Hyderabad (Abids)', district: 'Hyderabad', state: 'Telangana', cod: true, days: 2 },
  '500034': { city: 'Hyderabad (Banjara Hills)', district: 'Hyderabad', state: 'Telangana', cod: true, days: 2 },
  '500081': { city: 'Hyderabad (Hitec City)', district: 'Hyderabad', state: 'Telangana', cod: true, days: 2 },
  '520001': { city: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', cod: true, days: 3 },
  '530001': { city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', cod: true, days: 3 },

  // Maharashtra
  '400001': { city: 'Mumbai (Fort / Colaba)', district: 'Mumbai', state: 'Maharashtra', cod: true, days: 2 },
  '400050': { city: 'Mumbai (Bandra West)', district: 'Mumbai Suburban', state: 'Maharashtra', cod: true, days: 2 },
  '400053': { city: 'Mumbai (Andheri West)', district: 'Mumbai Suburban', state: 'Maharashtra', cod: true, days: 2 },
  '400076': { city: 'Mumbai (Powai)', district: 'Mumbai Suburban', state: 'Maharashtra', cod: true, days: 2 },
  '411001': { city: 'Pune (Camp)', district: 'Pune', state: 'Maharashtra', cod: true, days: 2 },
  '411014': { city: 'Pune (Viman Nagar)', district: 'Pune', state: 'Maharashtra', cod: true, days: 2 },
  '440001': { city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', cod: true, days: 3 },

  // Delhi NCR
  '110001': { city: 'New Delhi (Connaught Place)', district: 'Central Delhi', state: 'Delhi', cod: true, days: 2 },
  '110016': { city: 'New Delhi (Hauz Khas)', district: 'South Delhi', state: 'Delhi', cod: true, days: 2 },
  '110024': { city: 'New Delhi (Lajpat Nagar)', district: 'South Delhi', state: 'Delhi', cod: true, days: 2 },
  '122001': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', cod: true, days: 2 },
  '122002': { city: 'Gurugram (DLF Phase 1-5)', district: 'Gurugram', state: 'Haryana', cod: true, days: 2 },
  '201301': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', cod: true, days: 2 },

  // Gujarat, West Bengal, Rajasthan, others
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', cod: true, days: 2 },
  '395001': { city: 'Surat', district: 'Surat', state: 'Gujarat', cod: true, days: 2 },
  '700001': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', cod: true, days: 3 },
  '302001': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', cod: true, days: 3 },
}

// 2-digit PIN prefix mapping for general India postal circles
export function resolvePostalCircle(prefix2: string): { state: string; defaultCity: string } {
  const prefixNum = parseInt(prefix2, 10)
  if (isNaN(prefixNum)) return { state: 'India', defaultCity: 'Delivery Hub' }

  if (prefixNum >= 11 && prefixNum <= 11) return { state: 'Delhi NCR', defaultCity: 'New Delhi' }
  if (prefixNum >= 12 && prefixNum <= 13) return { state: 'Haryana', defaultCity: 'Gurugram / Faridabad' }
  if (prefixNum >= 14 && prefixNum <= 16) return { state: 'Punjab / Chandigarh', defaultCity: 'Chandigarh' }
  if (prefixNum >= 17 && prefixNum <= 17) return { state: 'Himachal Pradesh', defaultCity: 'Shimla Hub' }
  if (prefixNum >= 18 && prefixNum <= 19) return { state: 'Jammu & Kashmir', defaultCity: 'Jammu / Srinagar' }
  if (prefixNum >= 20 && prefixNum <= 28) return { state: 'Uttar Pradesh', defaultCity: 'UP Hub' }
  if (prefixNum >= 30 && prefixNum <= 34) return { state: 'Rajasthan', defaultCity: 'Rajasthan Hub' }
  if (prefixNum >= 36 && prefixNum <= 39) return { state: 'Gujarat', defaultCity: 'Gujarat Hub' }
  if (prefixNum >= 40 && prefixNum <= 44) return { state: 'Maharashtra', defaultCity: 'Maharashtra Region' }
  if (prefixNum >= 45 && prefixNum <= 48) return { state: 'Madhya Pradesh', defaultCity: 'MP Region' }
  if (prefixNum >= 49 && prefixNum <= 49) return { state: 'Chhattisgarh', defaultCity: 'Raipur Region' }
  if (prefixNum >= 50 && prefixNum <= 53) return { state: 'Andhra Pradesh / Telangana', defaultCity: 'Hyderabad / AP Hub' }
  if (prefixNum >= 56 && prefixNum <= 59) return { state: 'Karnataka', defaultCity: 'Karnataka Hub' }
  if (prefixNum >= 60 && prefixNum <= 64) return { state: 'Tamil Nadu', defaultCity: 'Tamil Nadu Hub' }
  if (prefixNum >= 67 && prefixNum <= 69) return { state: 'Kerala', defaultCity: 'Kerala Hub' }
  if (prefixNum >= 70 && prefixNum <= 74) return { state: 'West Bengal', defaultCity: 'West Bengal Hub' }
  if (prefixNum >= 75 && prefixNum <= 77) return { state: 'Odisha', defaultCity: 'Bhubaneswar Hub' }
  if (prefixNum >= 78 && prefixNum <= 79) return { state: 'Assam / North East', defaultCity: 'Guwahati Hub' }
  if (prefixNum >= 80 && prefixNum <= 85) return { state: 'Bihar / Jharkhand', defaultCity: 'Patna / Ranchi Hub' }
  return { state: 'India', defaultCity: 'Local Delivery Hub' }
}

export function getPincodeDetails(pincode: string) {
  const directMatch = PINCODE_DIRECTORY[pincode]
  if (directMatch) {
    return {
      success: true,
      pincode,
      city: directMatch.city,
      district: directMatch.district,
      state: directMatch.state,
      isCodAvailable: directMatch.cod,
      estimatedDeliveryDays: `${directMatch.days}-${directMatch.days + 1}`,
      expressDeliveryAvailable: directMatch.days <= 2,
      source: 'directory' as const,
    }
  }

  const prefix2 = pincode.substring(0, 2)
  const circle = resolvePostalCircle(prefix2)
  const isSouth = ['Kerala', 'Tamil Nadu', 'Karnataka'].includes(circle.state)

  return {
    success: true,
    pincode,
    city: circle.defaultCity,
    district: `${circle.state} Postal Circle`,
    state: circle.state,
    isCodAvailable: true,
    estimatedDeliveryDays: isSouth ? '2-3' : '3-5',
    expressDeliveryAvailable: isSouth,
    source: 'postal_circle' as const,
  }
}

export const pincodeRouter = router({
  // Public: Instant Indian PIN Code Auto-Lookup
  lookup: publicProcedure
    .input(
      z.object({
        pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code'),
      })
    )
    .query(async ({ input }) => {
      return getPincodeDetails(input.pincode)
    }),
})
