import { supabase } from "@/integrations/supabase/client"

class SupersonicCache {
  private cache = new Map()
  
  set(key: string, data: any, ttl = 2 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }
}

export const supersonicCache = new SupersonicCache()

export const supersonicQueries = {
  async getDashboardStats() {
    const cacheKey = 'dashboard_stats'
    const cached = supersonicCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('products')
      .select('id, status, created_at')
      .limit(1000)

    if (error) throw error

    const stats = {
      totalUsers: 0, // You'll need to adjust based on your schema
      totalProducts: data?.length || 0,
      pendingProducts: data?.filter(p => p.status === 'pending').length || 0,
      activeSubscriptions: 0
    }

    supersonicCache.set(cacheKey, stats, 30000)
    return stats
  },

  async getProductsUltra(limit = 25) {
    const cacheKey = `products_${limit}`
    const cached = supersonicCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, status, featured, created_at, images')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    supersonicCache.set(cacheKey, data)
    return data
  },

  async getUsersUltra(limit = 25) {
    const cacheKey = `users_${limit}`
    const cached = supersonicCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    supersonicCache.set(cacheKey, data)
    return data
  }
}