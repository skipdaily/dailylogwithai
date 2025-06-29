import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    console.log('🔍 Searching for action items with query:', query);

    // Search for action items by title (case-insensitive)
    const { data, error } = await supabase
      .from('action_items')
      .select('id, title, status, priority, assigned_to, description')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error searching action items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('📊 Found action items:', data?.length || 0);

    return NextResponse.json({
      success: true,
      results: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('Error in search-action-items route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
