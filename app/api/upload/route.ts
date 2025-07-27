import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const carNo = formData.get('carNo') as string;
  const fileIndex = formData.get('fileIndex') as string;

  const arrayBuffer = await file.arrayBuffer();
  const { data, error } = await supabase.storage
    .from('vehicles')
    .upload(`${carNo}/${fileIndex}.jpg`, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return NextResponse.json({ error }, { status: 500 });

  const { data: publicUrlData } = supabase.storage
  .from('vehicles')
  .getPublicUrl(`${carNo}/${fileIndex}.jpg`)

return NextResponse.json({ url: publicUrlData.publicUrl })

}
