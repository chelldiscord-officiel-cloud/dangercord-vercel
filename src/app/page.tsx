
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Home() {
    const [s, setS] = useState('');
    const router = useRouter();
    const go = (e:any) => { e.preventDefault(); if(s) router.push(`/check/${s}`); };

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
