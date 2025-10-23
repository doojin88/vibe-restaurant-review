import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!q) {
      return NextResponse.json(
        { ok: false, error: { message: '검색어가 필요합니다.' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .ilike('name', `%${q}%`);

    if (countError) {
      console.error('Count query error:', countError);
      return NextResponse.json(
        { ok: false, error: { message: '검색 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    const total = count ?? 0;

    // 데이터 조회
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .ilike('name', `%${q}%`)
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Search query error:', error);
      return NextResponse.json(
        { ok: false, error: { message: '검색 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: { message: '검색 결과 조회에 실패했습니다.' } },
        { status: 500 }
      );
    }

    const places = data.map((place) => ({
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      created_at: place.created_at,
    }));

    const hasMore = total > offset + limit;

    return NextResponse.json({
      ok: true,
      data: {
        places,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { ok: false, error: { message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
