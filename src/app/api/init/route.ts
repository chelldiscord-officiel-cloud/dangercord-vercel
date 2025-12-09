
import { NextResponse } from 'next/server';
import { ensureDB } from '@/lib/db';
export async function GET() {
    try { await ensureDB(); return NextResponse.json({ok: true, message: "Tables created"}); } 
    catch(e:any) { return NextResponse.json({error: e.message}, {status: 500}); }
}
