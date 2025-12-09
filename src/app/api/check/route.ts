
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const id = new URL(req.url).searchParams.get('id');
    if(!id) return NextResponse.json({error: "No ID"});

    let reports = [];
    try {
        const { rows } = await sql`SELECT * FROM reports WHERE target_id = ${id} ORDER BY timestamp DESC`;
        reports = rows;
    } catch(e) { console.error("DB Error", e); }

    let discordUser = null;
    try {
        const r = await fetch(`https://discord.com/api/users/${id}`, { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } });
        if(r.ok) discordUser = await r.json();
    } catch(e) {}

    return NextResponse.json({ reports, discordUser });
}
