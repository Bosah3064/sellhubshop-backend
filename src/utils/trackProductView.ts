import { supabase } from "@/integrations/supabase/client";

export async function trackProductView(productId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('🔍 Tracking view for product:', productId, 'User:', user?.id);

    // 1️⃣ Insert view record
    const { error: viewError } = await supabase
      .from('product_views')
      .insert({
        product_id: productId,
        user_id: user?.id || null,
        created_at: new Date().toISOString()
      });

    if (viewError) {
      console.error('❌ Error inserting into product_views:', viewError);
      
      if (viewError.code === '23505') {
        console.log('View already tracked for this user/product');
      } else {
        console.log('Continuing to update views_count despite tracking error');
      }
    } else {
      console.log('✅ Successfully recorded in product_views table');
    }

    // 2️⃣ Update product view count safely
    // Supabase doesn’t support raw SQL directly, so use a Postgres RPC (recommended)
    const { error: updateError } = await supabase.rpc('increment_product_views', {
      product_id: productId,
    });

    if (updateError) {
      console.error('❌ Error updating views_count via RPC:', updateError);
      return false;
    }

    console.log('✅ Successfully updated views_count for product:', productId);
    return true;

  } catch (error) {
    console.error('💥 Unexpected error in trackProductView:', error);
    return false;
  }
}
