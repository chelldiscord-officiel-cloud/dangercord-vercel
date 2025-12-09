
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
                         {user.avatar && <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-6 h-6 rounded-full"/>}
                         <span className="font-bold text-sm">{user.username}</span>
                    </div>
                ) : (
                    <button onClick={login} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm transition">Connexion</button>
                )}
            </div>
        </nav>
    );
}
