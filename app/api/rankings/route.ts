import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 개인 랭킹 top 10
    const { data: individual, error: e1 } = await supabase
      .from('idol_stats')
      .select('idol_name, group_name, count')
      .order('count', { ascending: false })
      .limit(10)

    if (e1) throw e1

    // 그룹 랭킹 top 10 (RPC 함수 사용)
    const { data: group, error: e2 } = await supabase
      .rpc('get_group_rankings')

    if (e2) throw e2

    return NextResponse.json({ individual: individual ?? [], group: group ?? [] })
  } catch (error) {
    console.error('[rankings] error:', JSON.stringify(error))
    return NextResponse.json({ individual: [], group: [], error: String(error) })
  }
}
