
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        await sql`INSERT INTO reports (target_id, reporter_id, reason, proofs, timestamp) VALUES (${body.target_id}, ${body.reporter_id}, ${body.reason}, ${JSON.stringify(body.proofs)}, ${Date.now()})`;
        return NextResponse.json({success: true});
    } catch(e:any) { return NextResponse.json({error: e.message}, {status: 500}); }
}
