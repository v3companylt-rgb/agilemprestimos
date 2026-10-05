export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({success:false,message:'Método não permitido.'});
  const inData = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const digits = v => String(v ?? '').replace(/\D/g,'');
  const name = String(inData.name ?? '').trim();
  const email = String(inData.email ?? '').trim();
  const phone = digits(inData.phone);
  const doc = digits(inData.document);
  if (name.length < 3) return res.status(400).json({success:false,message:'Digite um nome válido.'});
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({success:false,message:'Digite um e-mail válido.'});
  if (![10,11].includes(phone.length)) return res.status(400).json({success:false,message:'Digite um telefone válido com DDD.'});
  if (![11,14].includes(doc.length)) return res.status(400).json({success:false,message:'Digite um CPF ou CNPJ válido.'});

  const amount = 2957;
  const product = 'Tarifa de cadastro';
  const gateway = process.env.DUTTYFY_PIX_URL_ENCRYPTED;
  if (!gateway || !gateway.startsWith('https://')) return res.status(500).json({success:false,message:'Gateway de pagamento não configurado na Vercel.'});
  let utm = String(inData.utm ?? '').replace(/[\x00-\x1F\x7F\s]+/g,'').replace(/^\?/,'').slice(0,4000);
  const payload = {amount,description:product,customer:{name,document:doc,email,phone},item:{title:product,price:amount,quantity:1},paymentMethod:'PIX',utm};
  try {
    let response;
    for (let attempt=1; attempt<=3; attempt++) {
      response = await fetch(gateway,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
      if (response.status < 500 || attempt===3) break;
      await new Promise(r=>setTimeout(r,attempt*1000));
    }
    const data = await response.json().catch(()=>({}));
    if (response.status===401) return res.status(502).json({success:false,message:'Pagamento indisponível no momento.'});
    if (!response.ok || !data.pixCode || !data.transactionId) return res.status(response.status>=400&&response.status<500?400:502).json({success:false,message:data.message||data.error||'O gateway recusou a transação.'});
    return res.status(200).json({success:true,transactionId:String(data.transactionId),pixCode:String(data.pixCode),status:'PENDING'});
  } catch (e) { return res.status(502).json({success:false,message:'Não foi possível conectar ao gateway. Tente novamente.'}); }
}
