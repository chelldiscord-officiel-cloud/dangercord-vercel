const fs = require('fs');
const path = require('path');

console.log("💿 GÉNÉRATION DU PROJET FINAL (VERCEL STACK)...");

const dirs = [
    'src/app', 
    'src/app/api/auth/callback', 
    'src/app/api/check', 
    'src/app/api/report', 
    'src/app/api/init', 
    'src/app/check/[id]', 
    'src/app/dashboard', 
    'src/components', 
    'src/lib'
];

dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// 1. CONFIGURATION (Standard Vercel)
fs.writeFileSync('package.json', JSON.stringify({
  "name": "dangercord-final",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "lucide-react": "^0.300.0",
    "@vercel/postgres": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  },
  "devDependencies": {
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "5.3.3",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest"
  }
}, null, 2));

fs.writeFileSync('tsconfig.json', JSON.stringify({
  "compilerOptions": { "lib": ["dom", "dom.iterable", "esnext"], "allowJs": true, "skipLibCheck": true, "strict": true, "noEmit": true, "esModuleInterop": true, "module": "esnext", "moduleResolution": "bundler", "resolveJsonModule": true, "isolatedModules": true, "jsx": "preserve", "incremental": true, "plugins": [{ "name": "next" }], "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], "exclude": ["node_modules"]
}, null, 2));

fs.writeFileSync('next.config.mjs', `/** @type {import('next').NextConfig} */ const nextConfig = {}; export default nextConfig;`);
fs.writeFileSync('postcss.config.js', `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {}, }, };`);
fs.writeFileSync('tailwind.config.ts', `import type { Config } from "tailwindcss"; const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: {} }, plugins: [], }; export default config;`);
fs.writeFileSync('src/app/globals.css', `@tailwind base; @tailwind components; @tailwind utilities; body { @apply bg-black text-white; } .glass { @apply bg-zinc-900 border border-zinc-800 rounded-xl; }`);

// 2. LIBS
fs.writeFileSync('src/lib/db.ts', `
import { sql } from '@vercel/postgres';
// Helper pour initialiser la DB si elle n'existe pas
export async function ensureDB() {
    await sql\`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, avatar TEXT, created_at BIGINT);\`;
    await sql\`CREATE TABLE IF NOT EXISTS reports (id SERIAL PRIMARY KEY, target_id TEXT, reporter_id TEXT, reason TEXT, proofs TEXT, timestamp BIGINT);\`;
}
`);

// 3. COMPONENTS
fs.writeFileSync('src/components/Navbar.tsx', `
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        // Lecture cookie simple
        const match = document.cookie.match(new RegExp('(^| )dc_user=([^;]+)'));
        if(match) try { setUser(JSON.parse(decodeURIComponent(match[2]))); } catch(e){}
    }, []);

    const login = () => {
        // Redirection vers notre API qui gère l'URL Discord dynamiquement
        window.location.href = "/api/auth/callback?login=true";
    };

    return (
        <nav className="fixed w-full h-16 bg-black/80 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-6 z-50">
            <Link href="/" className="font-black text-xl text-red-600 tracking-tighter">DANGERCORD</Link>
            <div className="flex gap-4 items-center">
                <Link href="/" className="text-sm text-gray-400 hover:text-white">Recherche</Link>
                {user ? (
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1">
                         {user.avatar && <img src={\`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png\`} className="w-6 h-6 rounded-full"/>}
                         <span className="font-bold text-sm">{user.username}</span>
                    </div>
                ) : (
                    <button onClick={login} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm transition">Connexion</button>
                )}
            </div>
        </nav>
    );
}
`);

// 4. API ROUTES

// AUTH
fs.writeFileSync('src/app/api/auth/callback/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const origin = new URL(req.url).origin;
    const redirectUri = \`\${origin}/api/auth/callback\`;

    // 1. Demande de login : On redirige vers Discord
    if (searchParams.get('login')) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const url = \`https://discord.com/api/oauth2/authorize?client_id=\${clientId}&redirect_uri=\${encodeURIComponent(redirectUri)}&response_type=code&scope=identify\`;
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
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: \`Bearer \${tokens.access_token}\` } });
        const discordUser = await userRes.json();

        // Save DB
        await sql\`INSERT INTO users (id, username, avatar, created_at) VALUES (\${discordUser.id}, \${discordUser.username}, \${discordUser.avatar}, \${Date.now()}) ON CONFLICT (id) DO UPDATE SET username=\${discordUser.username}, avatar=\${discordUser.avatar}\`;

        // Cookie Session
        const res = NextResponse.redirect(new URL('/dashboard', req.url));
        res.cookies.set('dc_user', JSON.stringify({id: discordUser.id, username: discordUser.username, avatar: discordUser.avatar}), { path: '/', maxAge: 604800, httpOnly: false });
        return res;

    } catch (e) {
        console.error(e);
        return NextResponse.redirect(new URL('/?error=auth_failed', req.url));
    }
}
`);

// CHECK
fs.writeFileSync('src/app/api/check/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const id = new URL(req.url).searchParams.get('id');
    if(!id) return NextResponse.json({error: "No ID"});

    let reports = [];
    try {
        const { rows } = await sql\`SELECT * FROM reports WHERE target_id = \${id} ORDER BY timestamp DESC\`;
        reports = rows;
    } catch(e) { console.error("DB Error", e); }

    let discordUser = null;
    try {
        const r = await fetch(\`https://discord.com/api/users/\${id}\`, { headers: { Authorization: \`Bot \${process.env.DISCORD_BOT_TOKEN}\` } });
        if(r.ok) discordUser = await r.json();
    } catch(e) {}

    return NextResponse.json({ reports, discordUser });
}
`);

// REPORT
fs.writeFileSync('src/app/api/report/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        await sql\`INSERT INTO reports (target_id, reporter_id, reason, proofs, timestamp) VALUES (\${body.target_id}, \${body.reporter_id}, \${body.reason}, \${JSON.stringify(body.proofs)}, \${Date.now()})\`;
        return NextResponse.json({success: true});
    } catch(e:any) { return NextResponse.json({error: e.message}, {status: 500}); }
}
`);

// INIT DB (Endpoint secret pour créer les tables)
fs.writeFileSync('src/app/api/init/route.ts', `
import { NextResponse } from 'next/server';
import { ensureDB } from '@/lib/db';
export async function GET() {
    try { await ensureDB(); return NextResponse.json({ok: true, message: "Tables created"}); } 
    catch(e:any) { return NextResponse.json({error: e.message}, {status: 500}); }
}
`);

// 5. PAGES FRONTEND

fs.writeFileSync('src/app/layout.tsx', `
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
export const metadata: Metadata = { title: "Dangercord", description: "Database" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return ( <html lang="fr"><body className="min-h-screen pt-16"><Navbar />{children}</body></html> );
}
`);

fs.writeFileSync('src/app/page.tsx', `
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Home() {
    const [s, setS] = useState('');
    const router = useRouter();
    const go = (e:any) => { e.preventDefault(); if(s) router.push(\`/check/\${s}\`); };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-gradient-to-b from-red-950/20 to-black">
            <div className="mb-8 p-2 px-4 rounded-full border border-red-900 bg-red-950/30 text-red-400 text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> SYSTEME EN LIGNE
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-white">DANGER<span className="text-red-600">CORD</span></h1>
            <p className="text-xl text-zinc-400 max-w-2xl mb-12">La base de données communautaire pour sécuriser vos serveurs Discord. Vérifiez un ID, signalez un abus.</p>
            
            <form onSubmit={go} className="relative w-full max-w-xl group">
                <input value={s} onChange={e=>setS(e.target.value)} placeholder="Collez un ID Discord ici..." 
                    className="w-full bg-zinc-900/80 border border-zinc-800 p-5 pl-14 rounded-2xl outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition text-lg shadow-2xl"/>
                <Search className="absolute left-5 top-5 text-zinc-500 group-focus-within:text-red-500 transition"/>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full max-w-5xl">
                <div className="glass p-6 hover:border-red-900 transition">
                    <ShieldAlert className="text-red-500 mb-4 h-8 w-8"/>
                    <h3 className="font-bold text-lg mb-2">Signalements</h3>
                    <p className="text-zinc-400 text-sm">Base de données partagée des utilisateurs malveillants.</p>
                </div>
                <div className="glass p-6 hover:border-blue-900 transition">
                    <Search className="text-blue-500 mb-4 h-8 w-8"/>
                    <h3 className="font-bold text-lg mb-2">Vérification</h3>
                    <p className="text-zinc-400 text-sm">Vérifiez instantanément si un utilisateur est fiable.</p>
                </div>
                <div className="glass p-6 hover:border-green-900 transition">
                    <CheckCircle className="text-green-500 mb-4 h-8 w-8"/>
                    <h3 className="font-bold text-lg mb-2">Fiabilité</h3>
                    <p className="text-zinc-400 text-sm">Données modérées et vérifiées par la communauté.</p>
                </div>
            </div>
        </div>
    );
}
`);

fs.writeFileSync('src/app/check/[id]/page.tsx', `
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Flag, Upload, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Check() {
    const { id } = useParams();
    const [d, setD] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [reason, setReason] = useState('');
    const [proofs, setProofs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const c = document.cookie.match(new RegExp('(^| )dc_user=([^;]+)'));
        if (c) setUser(JSON.parse(decodeURIComponent(c[2])));
        fetch(\`/api/check?id=\${id}\`).then(r=>r.json()).then(setD);
    }, [id]);

    const up = async (e:any) => {
        const f = new FormData(); f.append('image', e.target.files[0]);
        // Upload direct sans backend pour les images (client side)
        try {
            const r = await fetch('https://api.imgbb.com/1/upload?key=b4f9b4ca14a7aac501f9493dd6b16a45', { method:'POST', body:f });
            const j = await r.json();
            if(j.data) setProofs([...proofs, j.data.url]);
        } catch(e) { alert("Erreur upload"); }
    };

    const send = async () => {
        if(!user) return alert("Login requis");
        if(!reason) return alert("Raison requise");
        setLoading(true);
        await fetch('/api/report', { method:'POST', body: JSON.stringify({ target_id: id, reporter_id: user.id, reason, proofs }) });
        window.location.reload();
    };

    if(!d) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 rounded-full animate-spin border-t-transparent"></div></div>;
    
    const reports = d.reports || [];
    const safe = reports.length === 0;
    const target = d.discordUser;

    return (
        <div className="max-w-5xl mx-auto p-6 pt-10">
            <div className={\`p-10 rounded-3xl border mb-10 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden \${safe ? 'border-green-900 bg-green-950/10' : 'border-red-900 bg-red-950/10'}\`}>
                <div className="relative z-10">
                    <img src={target?.avatar ? \`https://cdn.discordapp.com/avatars/\${target.id}/\${target.avatar}.png\` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                         className="w-32 h-32 rounded-full border-4 border-black shadow-xl"/>
                </div>
                
                <div className="z-10 text-center md:text-left flex-1">
                    <h1 className="text-4xl font-black mb-2">{target?.username || "Utilisateur Inconnu"}</h1>
                    <p className="font-mono text-zinc-500 mb-6 bg-black/30 inline-block px-3 py-1 rounded">{id}</p>
                    
                    <div className="flex gap-4 justify-center md:justify-start">
                        {safe ? (
                            <span className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-green-900/20">
                                <CheckCircle size={20}/> SÛR
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-red-900/20">
                                <AlertTriangle size={20}/> SIGNALÉ ({reports.length})
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="glass p-6 h-fit md:sticky md:top-24">
                    <h3 className="font-bold mb-4 flex gap-2 items-center text-xl"><Flag size={20} className="text-red-500"/> Signaler</h3>
                    {user ? <>
                        <textarea className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg mb-4 text-white min-h-[100px] outline-none focus:border-red-600" 
                                  value={reason} onChange={e=>setReason(e.target.value)} placeholder="Décrivez le problème (Raid, Scam, Doxxing)..."/>
                        
                        <label className="block mb-4 cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-center text-sm transition">
                            <Upload className="inline w-4 h-4 mr-2"/> Ajouter Preuve
                            <input type="file" onChange={up} className="hidden"/>
                        </label>

                        {proofs.length > 0 && <div className="flex gap-2 mb-4 overflow-x-auto p-2 bg-black/30 rounded">{proofs.map(p=><img key={p} src={p} className="w-10 h-10 rounded object-cover border border-zinc-700"/>)}</div>}
                        
                        <button onClick={send} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold transition shadow-lg shadow-red-900/20">
                            {loading ? 'Envoi...' : 'ENVOYER LE SIGNALEMENT'}
                        </button>
                    </> : (
                        <div className="text-center py-8 bg-zinc-900/50 rounded-lg">
                            <p className="text-zinc-400 mb-4">Connectez-vous pour signaler.</p>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Shield size={20}/> Historique des rapports</h3>
                    {reports.length === 0 && <div className="text-center py-10 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">Aucun rapport pour le moment.</div>}
                    {reports.map((r:any) => (
                        <div key={r.id} className="glass p-6 border-l-4 border-red-600 hover:bg-zinc-900 transition">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-red-400 text-lg">{r.reason}</span>
                                <span className="text-xs text-zinc-500">{new Date(Number(r.timestamp)).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                                {r.proofs && JSON.parse(r.proofs).map((p:string, i:number)=>(
                                    <a href={p} target="_blank" key={p} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-blue-400 transition">Preuve #{i+1}</a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
`);

fs.writeFileSync('src/app/dashboard/page.tsx', `export default function D() { return <div className="p-10 pt-32 text-center"><h1>Tableau de bord (En construction)</h1></div> }`);

console.log("✅ TERMINÉ. DOSSIER PRÊT.");