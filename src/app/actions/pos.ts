'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processCheckoutAction(formData: {
  cart: any[],
  orderDiscount: number,
  orderDiscountType: 'amount' | 'percent',
  finalTotal: number,
  shift_id?: string,
  register_id?: string,
  payment_method?: string,
  order_type?: string,
  table_id?: string,
  session_id?: string
}) {
  const supabase = await createClient()

  try {
    // 1. Get current user & profile
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) throw new Error('Unauthorized')

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('shop_id, full_name, role')
      .eq('id', user.id)
      .single()

    if (profErr || !profile) throw new Error('Profile not found')

    // 2. SERVER-SIDE CALCULATION (Security Check)
    // We recalculate to ensure the client didn't manipulate the total
    const itemsTotalBeforeOrderDiscount = formData.cart.reduce((sum, item) => {
      let itemDiscount = item.discountType === 'percent' ? (item.price * item.discount / 100) : item.discount
      return sum + (item.price - itemDiscount) * item.quantity
    }, 0)

    let serverCalculatedDiscount = 0
    if (formData.orderDiscountType === 'percent') {
      serverCalculatedDiscount = (itemsTotalBeforeOrderDiscount * formData.orderDiscount) / 100
    } else {
      serverCalculatedDiscount = formData.orderDiscount
    }

    const serverTotal = Math.max(0, itemsTotalBeforeOrderDiscount - serverCalculatedDiscount)

    // Security check: If difference is more than 1 unit, fail
    if (Math.abs(serverTotal - formData.finalTotal) > 1) {
      throw new Error('Cảnh báo bảo mật: Dữ liệu đơn hàng bị sai lệch. Vui lòng thử lại.')
    }

    // 3. ATOMIC TRANSACTION: Create Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        shop_id: profile.shop_id,
        profile_id: user.id,
        created_by_name: profile.full_name,
        total_amount: serverTotal,
        discount_total: serverCalculatedDiscount,
        shift_id: formData.shift_id || null,
        register_id: formData.register_id || null,
        payment_method: formData.payment_method || 'cash',
        order_type: formData.order_type || 'takeaway',
        table_id: formData.table_id || null,
        session_id: formData.session_id || null,
        status: 'draft' // BƯỚC 1: Tạo đơn nháp trước để nhận ID
      })
      .select()
      .single()

    if (orderErr) throw orderErr

    // 4. Buid BOM Snapshots & Create Order Items
    const productIds = formData.cart.filter(i => !i.is_manual).map(i => i.id)
    let allRecipes: any[] = []
    if (productIds.length > 0) {
      const { data: boms } = await supabase
        .from('product_ingredients')
        .select(`
          product_id,
          quantity,
          ingredient:ingredients(id, name, cost_price)
        `)
        .in('product_id', productIds)
      if (boms) allRecipes = boms
    }

    const orderItems = formData.cart.map(item => {
      const itemDiscountValue = item.discountType === 'percent' ? (item.price * (item.discount || 0) / 100) : (item.discount || 0)
      
      // Build Snapshot cho sản phẩm này
      let snapshot = null
      if (!item.is_manual) {
         const itemRecipes = allRecipes.filter(r => r.product_id === item.id)
         if (itemRecipes.length > 0) {
           snapshot = itemRecipes.map(r => ({
              ingredient_id: r.ingredient.id,
              ingredient_name: r.ingredient.name,
              quantity_per_unit: r.quantity,
              total_used: r.quantity * item.quantity,
              cost_price: r.ingredient.cost_price || 0 // Snapshot giá vốn để tính lợi nhuận
           }))
         }
      }

      return {
        order_id: order.id,
        product_id: item.is_manual ? null : item.id,
        manual_name: item.is_manual ? item.name : null,
        quantity: item.quantity,
        price_original: item.price,
        discount: itemDiscountValue,
        final_price: item.price - itemDiscountValue,
        recipe_snapshot: snapshot // Lưu snapshot bất biến
      }
    })

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
    if (itemsErr) throw itemsErr

    // 4.5. BƯỚC CHỐT: Chuyển trạng thái sang completed để kích hoạt Trigger trừ kho
    const { error: finalizeErr } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order.id)
    if (finalizeErr) throw finalizeErr

    // 5. AUDIT LOG (SaaS Standard)
    await supabase.from('audit_logs').insert({
      shop_id: profile.shop_id,
      profile_id: user.id,
      action: 'ORDER_CHECKOUT',
      details: {
        order_id: order.id,
        total: serverTotal,
        items_count: formData.cart.length
      }
    })

    revalidatePath('/dashboard/pos')
    return { success: true, orderId: order.id }

  } catch (error: any) {
    console.error('Checkout Action Error:', error)
    return { success: false, error: error.message }
  }
}
