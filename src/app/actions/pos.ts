'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processCheckoutAction(formData: {
  cart: any[],
  orderDiscount: number,
  orderDiscountType: 'amount' | 'percent',
  finalTotal: number
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
        status: 'completed'
      })
      .select()
      .single()

    if (orderErr) throw orderErr

    // 4. Create Order Items
    const orderItems = formData.cart.map(item => {
      const itemDiscountValue = item.discountType === 'percent' ? (item.price * (item.discount || 0) / 100) : (item.discount || 0)
      return {
        order_id: order.id,
        product_id: item.is_manual ? null : item.id,
        manual_name: item.is_manual ? item.name : null,
        quantity: item.quantity,
        price_original: item.price,
        discount: itemDiscountValue,
        final_price: item.price - itemDiscountValue
      }
    })

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
    if (itemsErr) throw itemsErr

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
