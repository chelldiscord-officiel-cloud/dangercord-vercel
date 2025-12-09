
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
        fetch(`/api/check?id=${id}`).then(r=>r.json()).then(setD);
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
            <div className={`p-10 rounded-3xl border mb-10 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden ${safe ? 'border-green-900 bg-green-950/10' : 'border-red-900 bg-red-950/10'}`}>
                <div className="relative z-10">
                    <img src={target?.avatar ? `https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
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
