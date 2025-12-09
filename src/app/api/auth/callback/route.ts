
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/auth/callback`;

    // 1. Demande de login : On redirige vers Discord
    if (searchParams.get('login')) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
        return NextResponse.redirect(url);
    }

    // 2. Retour de Discord avec le code
    const code = searchParams.get('code');
    if (!code) return NextResponse.redirect(new URL('/', req.url));

    try {
        // Echange Code -> Token
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID!,
                client_secret: process.env.DISCORD_CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
            })
        });
        
        const tokens = await tokenRes.json();
        if(!tokens.access_token) throw new Error("No Access Token");

        // Récup User
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
        const discordUser = await userRes.json();

        // Save DB
        await sql`INSERT INTO users (id, username, avatar, created_at) VALUES (${discordUser.id}, ${discordUser.username}, ${discordUser.avatar}, ${Date.now()}) ON CONFLICT (id) DO UPDATE SET username=${discordUser.username}, avatar=${discordUser.avatar}`;

        // Cookie Session
        const res = NextResponse.redirect(new URL('/dashboard', req.url));
        res.cookies.set('dc_user', JSON.stringify({id: discordUser.id, username: discordUser.username, avatar: discordUser.avatar}), { path: '/', maxAge: 604800, httpOnly: false });
        return res;

    } catch (e) {
        console.error(e);
        return NextResponse.redirect(new URL('/?error=auth_failed', req.url));
    }
}
