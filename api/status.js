export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET') return res.status(405).json({success:false,message:'Método não permitido.'});
  const id = String(req.query?.transactionId || '');
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) return res.status(400).json({success:false,message:'transactionId inválido.'});
  const gateway = process.env.DUTTYFY_PIX_URL_ENCRYPTED;
  if (!gateway || !gateway.startsWith('https://')) return res.status(500).json({success:false,message:'Gateway de pagamento não configurado na Vercel.'});
  try {
    const r = await fetch(gateway+'?transactionId='+encodeURIComponent(id),{headers:{Accept:'application/json'}});
    const data = await r.json().catch(()=>({}));
    if (!r.ok || !data.status) return res.status(502).json({success:false,message:'Não foi possível consultar a transação.'});
    const status = String(data.status);
    const successUrl = process.env.SUCCESS_URL || '';
    return res.status(200).json({success:true,status,paidAt:data.paidAt||null,successUrl:status==='COMPLETED'&&successUrl?successUrl:null});
  } catch(e) { return res.status(502).json({success:false,message:'Não foi possível consultar a transação.'}); }
}
