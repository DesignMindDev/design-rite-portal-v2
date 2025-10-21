/**
 * Product Search API - Query 114K+ product database
 *
 * Powers:
 * - AI Discovery product recommendations
 * - Product Library business tool
 * - AI Refinement proposal generation
 * - Labor Calculator equipment imports
 *
 * Data Source: Supabase manufacturer_pricing table (114,453 products from 45+ manufacturers)
 *
 * IMPORTANT: All prices are MSRP estimates. Include disclaimer in responses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for product queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// TypeScript interfaces
interface ProductSearchParams {
  query?: string
  category?: string
  manufacturer?: string
  min_price?: number
  max_price?: number
  limit?: number
  offset?: number
}

interface ManufacturerPricingProduct {
  id: number
  manufacturer: string
  model: string
  part_number: string | null
  description: string | null
  msrp: number | null
  dealer_price: number | null
  map_price: number | null
  category: string | null
  subcategory: string | null
  product_line: string | null
  source: string
  source_file: string | null
  last_updated: string
  effective_date: string | null
  metadata: any
  is_active: boolean
  is_verified: boolean
}

/**
 * GET /api/products/search
 *
 * Query parameters:
 * - query: Search term (searches name, description, tags, manufacturer_part_number)
 * - category: Filter by category (camera, nvr, switch, cable, etc.)
 * - manufacturer: Filter by vendor/manufacturer
 * - min_price: Minimum price in dollars (converted to cents)
 * - max_price: Maximum price in dollars (converted to cents)
 * - limit: Number of results (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 *
 * Examples:
 * GET /api/products/search?query=outdoor camera&category=camera&limit=20
 * GET /api/products/search?manufacturer=Hikvision&max_price=500
 * GET /api/products/search?category=nvr&min_price=200&max_price=1000
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const params: ProductSearchParams = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      manufacturer: searchParams.get('manufacturer') || undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 200),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    // Build Supabase query for manufacturer_pricing table
    let query = supabase
      .from('manufacturer_pricing')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('model', { ascending: true })

    // Text search across multiple fields
    if (params.query) {
      const searchTerm = `%${params.query}%`
      query = query.or(`model.ilike.${searchTerm},description.ilike.${searchTerm},part_number.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
    }

    // Filter by category
    if (params.category) {
      query = query.ilike('category', `%${params.category}%`)
    }

    // Filter by manufacturer
    if (params.manufacturer) {
      query = query.ilike('manufacturer', `%${params.manufacturer}%`)
    }

    // Price range filtering (MSRP is already in dollars in manufacturer_pricing table)
    if (params.min_price !== undefined) {
      query = query.gte('msrp', params.min_price)
    }
    if (params.max_price !== undefined) {
      query = query.lte('msrp', params.max_price)
    }

    // Pagination
    query = query.range(params.offset, params.offset + params.limit - 1)

    // Execute query
    const { data: products, error, count } = await query

    if (error) {
      console.error('Product search error:', error)
      return NextResponse.json(
        { error: 'Failed to search products', details: error.message },
        { status: 500 }
      )
    }

    // Transform products from manufacturer_pricing table
    const transformedProducts = (products || []).map((product: any) => ({
      id: product.id,
      manufacturer: product.manufacturer,
      model: product.model,
      part_number: product.part_number,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      product_line: product.product_line,
      msrp: product.msrp,
      dealer_price: product.dealer_price,
      map_price: product.map_price,
      price: product.msrp, // Alias for compatibility
      last_updated: product.last_updated,
      effective_date: product.effective_date
    }))

    // Return results with MSRP disclaimer
    return NextResponse.json({
      products: transformedProducts,
      count: count || 0,
      limit: params.limit,
      offset: params.offset,
      disclaimer: '⚠️ Prices shown are estimated MSRP. Actual pricing may vary based on vendor agreements, volume discounts, and market conditions. Use Product Library to override with your negotiated pricing.',
      query_params: params
    })

  } catch (error: any) {
    console.error('Product search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/search
 *
 * Alternative endpoint for complex queries with request body
 *
 * Request body:
 * {
 *   "query": "outdoor bullet camera",
 *   "filters": {
 *     "category": "camera",
 *     "manufacturer": "Hikvision",
 *     "price_range": { "min": 100, "max": 500 }
 *   },
 *   "pagination": {
 *     "limit": 50,
 *     "offset": 0
 *   },
 *   "sort": {
 *     "field": "price",
 *     "order": "asc"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      query: searchQuery,
      filters = {},
      pagination = {},
      sort = { field: 'name', order: 'asc' }
    } = body

    // Build Supabase query for manufacturer_pricing table
    let query = supabase
      .from('manufacturer_pricing')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Text search
    if (searchQuery) {
      const searchTerm = `%${searchQuery}%`
      query = query.or(`model.ilike.${searchTerm},description.ilike.${searchTerm},part_number.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
    }

    // Apply filters
    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`)
    }
    if (filters.subcategory) {
      query = query.ilike('subcategory', `%${filters.subcategory}%`)
    }
    if (filters.manufacturer) {
      query = query.ilike('manufacturer', `%${filters.manufacturer}%`)
    }
    if (filters.price_range) {
      if (filters.price_range.min !== undefined) {
        query = query.gte('msrp', filters.price_range.min)
      }
      if (filters.price_range.max !== undefined) {
        query = query.lte('msrp', filters.price_range.max)
      }
    }

    // Sorting (map common field names to manufacturer_pricing schema)
    let sortField = sort.field || 'model'
    if (sortField === 'name') sortField = 'model'
    if (sortField === 'price') sortField = 'msrp'
    const sortOrder = sort.order === 'desc' ? { ascending: false } : { ascending: true }
    query = query.order(sortField, sortOrder)

    // Pagination
    const limit = Math.min(pagination.limit || 50, 200)
    const offset = pagination.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: products, error, count } = await query

    if (error) {
      console.error('Product search error:', error)
      return NextResponse.json(
        { error: 'Failed to search products', details: error.message },
        { status: 500 }
      )
    }

    // Transform products from manufacturer_pricing table
    const transformedProducts = (products || []).map((product: any) => ({
      id: product.id,
      manufacturer: product.manufacturer,
      model: product.model,
      part_number: product.part_number,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      product_line: product.product_line,
      msrp: product.msrp,
      dealer_price: product.dealer_price,
      map_price: product.map_price,
      price: product.msrp, // Alias for compatibility
      last_updated: product.last_updated,
      effective_date: product.effective_date
    }))

    return NextResponse.json({
      products: transformedProducts,
      count: count || 0,
      limit,
      offset,
      disclaimer: '⚠️ Prices shown are estimated MSRP. Actual pricing may vary based on vendor agreements, volume discounts, and market conditions. Use Product Library to override with your negotiated pricing.',
      search: {
        query: searchQuery,
        filters,
        sort
      }
    })

  } catch (error: any) {
    console.error('Product search POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
