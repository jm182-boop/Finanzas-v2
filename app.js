const GEM_KEY='AIzaSyBE2vMCY-NuUZVKGtumtBrfd3PhHK4Rg70';
const PALETTE=['#7c6dfa','#3ecf8e','#f59e0b','#f87171','#2dd4bf','#a594fb','#60a5fa','#fb923c','#e879f9','#34d399','#fbbf24','#f472b6'];
const CAT_LABEL={casa:'Tarjeta Casa',pareja:'Tarjeta Pareja',personal:'Tarjeta Personal',alquiler:'Alquiler',otro:'Otro',sueldo:'Sueldo',freelance:'Freelance',venta:'Venta'};
const PERSONA_LABEL={yo:'Yo',novia:'Mi novia',ambos:'Ambos',''  :''};

let cfg={sueldo:2200000,nec:50,des:30,aho:20,alqUsd:0,tc:1200,exp:0,nombre1:'Yo',nombre2:'Mi novia'};
let movs=[],ahorros=[],prestamos=[],pagos=[];
let curMes=new Date().toISOString().slice(0,7),darkMode=true;
let tipoActual='gasto',filtro='todo',chartMode='total',colorSel='#7c6dfa';
let chartA=null,chartG=null,chartH=null,modalPrestId=null;

const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const mesLabel=ym=>{const[y,m]=ym.split('-');return meses[+m-1]+' '+y;};
const parsM=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'))||0;
const fmt=v=>'$'+Math.round(v).toLocaleString('es-AR');
function fmtI(el){let r=el.value.replace(/[^\d]/g,'');el.value=r?parseInt(r).toLocaleString('es-AR'):'';}
const fmtDT=iso=>{if(!iso)return'';const d=new Date(iso);return d.toLocaleDateString('es-AR')+' '+d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});};
const pct=(a,b)=>b>0?Math.min(100,Math.round(a/b*100)):0;
const bCol=(g,p)=>{const r=pct(g,p);return r>=90?'#f87171':r>=80?'#f59e0b':'#3ecf8e';};
const todayStr=()=>new Date().toISOString().slice(0,10);

function calcCuota(){
  const monto=parsM(document.getElementById('gmonto').value);
  const cuotas=parsM(document.getElementById('gcuotas').value);
  const prev=document.getElementById('cuota-preview');
  if(monto>0&&cuotas>0){prev.style.display='block';prev.textContent='Cuota mensual: '+fmt(Math.round(monto/cuotas))+' x '+cuotas+' meses = '+fmt(monto)+' total';}
  else prev.style.display='none';
}

// THEME
function toggleTheme(){
  darkMode=!darkMode;document.body.classList.toggle('light',!darkMode);
  document.getElementById('icon-dark').style.display=darkMode?'block':'none';
  document.getElementById('icon-light').style.display=darkMode?'none':'block';
  localStorage.setItem('ft',darkMode?'dark':'light');
  renderResumen();renderHistorialChart();renderAhorros();
}

// INIT
async function initApp(){
  document.getElementById('auth-screen').style.display='none';document.getElementById('app').style.display='block';
  document.getElementById('uemail').textContent=U.email;
  ['gfecha','gfechai','afecha','pfecha'].forEach(id=>document.getElementById(id).value=todayStr());
  const t=localStorage.getItem('ft')||'dark';darkMode=t==='dark';document.body.classList.toggle('light',!darkMode);
  document.getElementById('icon-dark').style.display=darkMode?'block':'none';
  document.getElementById('icon-light').style.display=darkMode?'none':'block';
  initColorPicker();
  document.getElementById('abilletera').addEventListener('change',function(){document.getElementById('custom-bill-wrap').style.display=this.value==='__custom'?'block':'none';});
  await Promise.all([loadCfg(),loadMovs(),loadAhorros(),loadPrestamos(),loadPagos()]);
  renderResumen();renderHistorial();renderAhorros();renderPrestamos();initCfgUI();
}

// CONFIG
async function loadCfg(){
  const r=await sb('/rest/v1/configuracion?user_id=eq.'+U.id);
  if(r.ok&&r.d.length>0){const d=r.d[0];cfg={sueldo:+d.sueldo,nec:+d.nec,des:+d.des,aho:+d.aho,alqUsd:+d.alq_usd,tc:+d.tipo_cambio,exp:+d.expensas,nombre1:d.nombre1||'Yo',nombre2:d.nombre2||'Mi novia'};}
}
async function guardarCfg(){
  cfg.sueldo=parsM(document.getElementById('csueldo').value)||cfg.sueldo;
  cfg.alqUsd=parsM(document.getElementById('calq').value)||0;
  cfg.tc=parsM(document.getElementById('ctc').value)||1200;
  cfg.exp=parsM(document.getElementById('cexp').value)||0;
  cfg.nombre1=document.getElementById('cnombre1').value||'Yo';
  cfg.nombre2=document.getElementById('cnombre2').value||'Mi novia';
  const p={user_id:U.id,sueldo:cfg.sueldo,nec:cfg.nec,des:cfg.des,aho:cfg.aho,alq_usd:cfg.alqUsd,tipo_cambio:cfg.tc,expensas:cfg.exp,nombre1:cfg.nombre1,nombre2:cfg.nombre2};
  const ex=await sb('/rest/v1/configuracion?user_id=eq.'+U.id);
  if(ex.ok&&ex.d.length>0)await sb('/rest/v1/configuracion?user_id=eq.'+U.id,'PATCH',p);
  else await sb('/rest/v1/configuracion','POST',p);
  toast('Configuracion guardada');renderResumen();
}
function initCfgUI(){
  document.getElementById('csueldo').value=Math.round(cfg.sueldo).toLocaleString('es-AR');
  document.getElementById('rnec').value=cfg.nec;document.getElementById('rdes').value=cfg.des;
  document.getElementById('calq').value=cfg.alqUsd?Math.round(cfg.alqUsd).toLocaleString('es-AR'):'';
  document.getElementById('ctc').value=cfg.tc?Math.round(cfg.tc).toLocaleString('es-AR'):'';
  document.getElementById('cexp').value=cfg.exp?Math.round(cfg.exp).toLocaleString('es-AR'):'';
  document.getElementById('cnombre1').value=cfg.nombre1||'';
  document.getElementById('cnombre2').value=cfg.nombre2||'';
  ['nec','des','aho'].forEach(k=>document.getElementById('l'+k).textContent=cfg[k]);
  document.getElementById('rvnec').textContent=cfg.nec+'%';document.getElementById('rvdes').textContent=cfg.des+'%';
  updAho();updAlq();
}
function syncR(c){
  let nec=+document.getElementById('rnec').value,des=+document.getElementById('rdes').value;
  if(nec+des>90){if(c==='nec')des=90-nec;else nec=90-des;}
  document.getElementById('rnec').value=nec;document.getElementById('rdes').value=des;
  const aho=100-nec-des;cfg.nec=nec;cfg.des=des;cfg.aho=aho;
  document.getElementById('lnec').textContent=nec;document.getElementById('ldes').textContent=des;document.getElementById('laho').textContent=aho;
  document.getElementById('rvnec').textContent=nec+'%';document.getElementById('rvdes').textContent=des+'%';updAho();
}
function updAho(){const s=parsM(document.getElementById('csueldo').value)||cfg.sueldo;document.getElementById('ahoinf').textContent=cfg.aho+'% → '+fmt(s*cfg.aho/100)+' / mes';}
function updAlq(){
  const u=parsM(document.getElementById('calq').value)||0,t=parsM(document.getElementById('ctc').value)||0,e=parsM(document.getElementById('cexp').value)||0;
  document.getElementById('alqinf').textContent=u*t+e>0?'Total vivienda: '+fmt(u*t+e)+' ARS':'';
}

// MOVIMIENTOS
async function loadMovs(){const r=await sb('/rest/v1/gastos?user_id=eq.'+U.id+'&order=created_at.desc');if(r.ok)movs=r.d||[];}
function setTipo(t){
  tipoActual=t;
  document.getElementById('campos-gasto').style.display=t==='gasto'?'block':'none';
  document.getElementById('campos-ingreso').style.display=t==='ingreso'?'block':'none';
  document.getElementById('btg').className='tb'+(t==='gasto'?' ag':'');
  document.getElementById('bti').className='tb'+(t==='ingreso'?' ai':'');
  document.getElementById('btnagregar').textContent=t==='gasto'?'Guardar gasto':'Guardar ingreso';
}
async function agregarMov(){
  const desc=document.getElementById('gdesc').value.trim(),montoTotal=parsM(document.getElementById('gmonto').value);
  if(!desc||!montoTotal){toast('Completa descripcion y monto');return;}
  const btn=document.getElementById('btnagregar');btn.innerHTML='<span class="sp"></span>Guardando...';
  const esI=tipoActual==='ingreso';
  const fecha=esI?document.getElementById('gfechai').value:document.getElementById('gfecha').value;
  if(!fecha||fecha.length<8){toast('Ingresa una fecha valida (AAAA-MM-DD)');btn.textContent=esI?'Guardar ingreso':'Guardar gasto';return;}
  const cat=esI?document.getElementById('gti').value:document.getElementById('gcat').value;
  const nota=document.getElementById('gnota').value.trim();
  const cuotasTotal=parsM(document.getElementById('gcuotas').value)||null;
  const cuotaNum=parsM(document.getElementById('gcuota-num').value)||null;
  const persona=document.getElementById('gpersona')?.value||'';
  const montoPres=cuotasTotal?Math.round(montoTotal/cuotasTotal):montoTotal;
  let notaFinal=nota;
  if(cuotasTotal&&montoTotal>montoPres){
    notaFinal=nota?(nota+' | Total: '+fmt(montoTotal)):'Total: '+fmt(montoTotal);
  }
  const p={user_id:U.id,descripcion:desc,monto:montoPres,categoria:cat,fecha,nota:notaFinal||null,tipo:tipoActual,cuotas_total:cuotasTotal,cuotas_numero:cuotaNum,persona:persona||null};
  const r=await sb('/rest/v1/gastos','POST',p);
  if(r.ok||r.s===201){
    await loadMovs();
    ['gdesc','gmonto','gnota','gcuotas','gcuota-num'].forEach(id=>document.getElementById(id).value='');
    if(document.getElementById('gpersona'))document.getElementById('gpersona').value='';
    document.getElementById('cuota-preview').style.display='none';
    toast(esI?'Ingreso guardado':'Gasto guardado');renderResumen();renderHistorial();
  } else toast('Error al guardar. Verifica tu conexion.');
  btn.textContent=esI?'Guardar ingreso':'Guardar gasto';
}
async function eliminarMov(id){await sb('/rest/v1/gastos?id=eq.'+id,'DELETE');movs=movs.filter(m=>m.id!==id);renderResumen();renderHistorial();toast('Eliminado');}

// AHORROS
async function loadAhorros(){const r=await sb('/rest/v1/ahorros?user_id=eq.'+U.id+'&order=fecha.asc');if(r.ok)ahorros=r.d||[];}
function initColorPicker(){
  const cp=document.getElementById('cpicker');cp.innerHTML='';
  PALETTE.forEach(c=>{const d=document.createElement('div');d.className='cp-dot'+(c===colorSel?' selected':'');d.style.background=c;d.onclick=()=>{colorSel=c;document.querySelectorAll('.cp-dot').forEach(x=>x.classList.remove('selected'));d.classList.add('selected');};cp.appendChild(d);});
}
async function agregarAhorro(){
  const monto=parsM(document.getElementById('amonto').value);if(!monto){toast('Ingresa un monto');return;}
  const sel=document.getElementById('abilletera').value;
  const bill=sel==='__custom'?document.getElementById('acustom').value.trim()||'Otra':sel;
  const fecha=document.getElementById('afecha').value;
  if(!fecha||fecha.length<8){toast('Ingresa una fecha valida');return;}
  const nota=document.getElementById('anota').value.trim();
  const btn=document.getElementById('btnahorro');btn.innerHTML='<span class="sp"></span>Guardando...';
  const r=await sb('/rest/v1/ahorros','POST',{user_id:U.id,monto,billetera:bill,color:colorSel,fecha,nota:nota||null});
  if(r.ok||r.s===201){await loadAhorros();document.getElementById('amonto').value='';document.getElementById('anota').value='';toast('Deposito guardado');renderAhorros();}
  else toast('Error al guardar. Verifica tu conexion.');
  btn.textContent='Guardar deposito';
}
async function eliminarAhorro(id){await sb('/rest/v1/ahorros?id=eq.'+id,'DELETE');ahorros=ahorros.filter(a=>a.id!==id);renderAhorros();toast('Eliminado');}

// PRESTAMOS
async function loadPrestamos(){const r=await sb('/rest/v1/prestamos?user_id=eq.'+U.id+'&order=created_at.desc');if(r.ok)prestamos=r.d||[];}
async function agregarPrestamo(){
  const nombre=document.getElementById('pnombre').value.trim(),desc=document.getElementById('pdesc').value.trim();
  const monto=parsM(document.getElementById('pmonto').value);
  const cuotasRaw=document.getElementById('pcuotas').value.replace(/\./g,'');
  const cuotas=cuotasRaw?parseInt(cuotasRaw):null;
  const fecha=document.getElementById('pfecha').value;
  if(!nombre||!monto){toast('Completa nombre y monto');return;}
  if(!fecha||fecha.length<8){toast('Ingresa una fecha valida');return;}
  const r=await sb('/rest/v1/prestamos','POST',{user_id:U.id,nombre,descripcion:desc||null,monto_cuota:monto,cuotas_total:cuotas,fecha_inicio:fecha,activo:true});
  if(r.ok||r.s===201){await loadPrestamos();['pnombre','pdesc','pmonto','pcuotas','pfecha'].forEach(id=>document.getElementById(id).value='');document.getElementById('pfecha').value=todayStr();toast('Prestamo agregado');renderPrestamos();}
  else toast('Error al guardar. Verifica tu conexion.');
}
async function eliminarPrestamo(id){await sb('/rest/v1/prestamos?id=eq.'+id,'DELETE');prestamos=prestamos.filter(p=>p.id!==id);renderPrestamos();toast('Eliminado');}

function openModalAdj(id){modalPrestId=id;document.getElementById('modal-monto').value='';document.getElementById('modal-motivo').value='';document.getElementById('modal-adj').classList.add('open');}
function closeModal(){document.getElementById('modal-adj').classList.remove('open');modalPrestId=null;}
async function confirmarAdj(){
  const nuevoMonto=parsM(document.getElementById('modal-monto').value);
  if(!nuevoMonto){toast('Ingresa el nuevo monto');return;}
  await sb('/rest/v1/prestamos?id=eq.'+modalPrestId,'PATCH',{monto_cuota:nuevoMonto});
  await loadPrestamos();closeModal();renderPrestamos();toast('Monto actualizado');
}

// PAGOS CHECKLIST
async function loadPagos(){const r=await sb('/rest/v1/pagos_mensuales?user_id=eq.'+U.id+'&mes=eq.'+curMes);if(r.ok)pagos=r.d||[];}
async function togglePago(concepto){
  const ex=pagos.find(p=>p.concepto===concepto&&p.mes===curMes);
  if(ex){
    const newVal=!ex.pagado;
    const r=await sb('/rest/v1/pagos_mensuales?id=eq.'+ex.id,'PATCH',{pagado:newVal});
    if(r.ok||r.s===200||r.s===204){ex.pagado=newVal;}
    else{toast('Error al actualizar');return;}
  } else {
    const p={user_id:U.id,mes:curMes,concepto,pagado:true};
    const r=await sb('/rest/v1/pagos_mensuales','POST',p);
    if(r.ok||r.s===201){const id=Array.isArray(r.d)&&r.d[0]?r.d[0].id:Date.now();pagos.push({...p,id});}
    else{toast('Error al guardar');return;}
  }
  renderResumen();renderPrestamos();
}
const isPagado=c=>!!(pagos.find(p=>p.concepto===c&&p.mes===curMes&&p.pagado));

// MONTH NAV
function changeMonth(dir){
  const[y,m]=curMes.split('-').map(Number);const d=new Date(y,m-1+dir,1);
  curMes=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  loadPagos().then(()=>{renderResumen();renderHistorial();renderPrestamos();});
}
const movDelMes=mes=>movs.filter(m=>m.fecha&&m.fecha.startsWith(mes||curMes));

// RENDER RESUMEN
function renderResumen(){
  document.getElementById('mlabel').textContent=mesLabel(curMes);
  const gm=movDelMes(),gastosM=gm.filter(m=>m.tipo!=='ingreso'),ingresosM=gm.filter(m=>m.tipo==='ingreso');
  const ingrExtra=ingresosM.reduce((a,b)=>a+b.monto,0),ingrTotal=cfg.sueldo+ingrExtra;
  const alqArs=cfg.alqUsd*cfg.tc,totalViv=alqArs+cfg.exp;
  const presNec=ingrTotal*cfg.nec/100,presDes=ingrTotal*cfg.des/100,presAho=ingrTotal*cfg.aho/100;
  const gastCasa=gastosM.filter(g=>g.categoria==='casa').reduce((a,b)=>a+b.monto,0);
  const gastPar=gastosM.filter(g=>g.categoria==='pareja').reduce((a,b)=>a+b.monto,0);
  const gastPers=gastosM.filter(g=>g.categoria==='personal').reduce((a,b)=>a+b.monto,0);
  const gastAho=ahorros.filter(a=>a.fecha?.startsWith(curMes)).reduce((a,b)=>a+b.monto,0);
  const gastNec=totalViv+gastCasa,gastDes=gastPar+gastPers,totalGast=gastNec+gastDes+gastAho;
  const sob=ingrTotal-totalGast,sobOk=sob>=0;
  const prevM=(()=>{const[y,m]=curMes.split('-').map(Number);const d=new Date(y,m-2,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');})();
  const prevGast=movDelMes(prevM).filter(m=>m.tipo!=='ingreso').reduce((a,b)=>a+b.monto,0);
  const diff=totalGast-prevGast,diffP=prevGast>0?Math.abs(Math.round(diff/prevGast*100)):0;

  const alertas=[];
  if(pct(gastNec,presNec)>=100)alertas.push(`Necesidades excedidas en ${fmt(gastNec-presNec)}`);
  if(pct(gastDes,presDes)>=100)alertas.push(`Deseos excedidos en ${fmt(gastDes-presDes)}`);

  const conceptos=[
    {key:'alquiler',label:'Alquiler',monto:alqArs},
    {key:'expensas',label:'Expensas',monto:cfg.exp},
    {key:'t-casa',label:'Tarjeta Casa',monto:gastCasa},
    {key:'t-pareja',label:'Tarjeta Pareja',monto:gastPar},
    {key:'t-personal',label:'Tarjeta Personal',monto:gastPers},
    ...prestamos.filter(p=>p.activo).map(p=>({key:'prest-'+p.id,label:'Prestamo: '+p.nombre+(p.descripcion?' ('+p.descripcion+')':''),monto:p.monto_cuota}))
  ];
  const donutData=[gastCasa,gastPar,gastPers,totalViv,gastAho];
  const donutColors=['#7c6dfa','#3ecf8e','#f59e0b','#2dd4bf','#a594fb'];
  const donutLabels=['T. Casa','T. Pareja','T. Personal','Vivienda','Ahorro'];

  document.getElementById('resumen-content').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-size:11px;color:var(--text3)">${gastosM.length} gastos · ${ingresosM.length} ingresos</span>
      <span class="badge ${sobOk?'bg':'br'}">${sobOk?'En presupuesto':'Excedido'}</span>
    </div>
    ${alertas.map(a=>`<div class="al al-r">${a}</div>`).join('')}
    ${ingrExtra>0?`<div class="al al-g">Ingreso extra este mes: +${fmt(ingrExtra)}</div>`:''}
    ${!sobOk&&!alertas.length?`<div class="al al-w">Excediste el presupuesto en ${fmt(Math.abs(sob))}</div>`:''}
    ${prevGast>0?`<div class="comp ${diff>0?'cu':'cd'}">${diff>0?'↑':'↓'} Gastaste ${diffP}% ${diff>0?'mas':'menos'} que ${mesLabel(prevM)}</div>`:''}
    <div class="mg">
      <div class="met"><div class="ml">Ingresos</div><div class="mv">${fmt(ingrTotal)}</div></div>
      <div class="met"><div class="ml">Gastado</div><div class="mv ${sobOk?'ok':'bad'}">${fmt(totalGast)}</div></div>
      <div class="met"><div class="ml">Disponible</div><div class="mv ${sobOk?'ok':'bad'}">${fmt(Math.max(0,sob))}</div></div>
    </div>
    <div class="card">
      <div class="ct">Regla ${cfg.nec}/${cfg.des}/${cfg.aho}</div>
      ${[{l:`Necesidades (${cfg.nec}%)`,p:presNec,g:gastNec},{l:`Deseos (${cfg.des}%)`,p:presDes,g:gastDes},{l:`Ahorro (${cfg.aho}%)`,p:presAho,g:gastAho}].map(({l,p,g})=>{
        const pc=pct(g,p),col=bCol(g,p);
        return `<div class="pw"><div class="ph"><span class="pl">${l}</span><span class="pn">${fmt(g)} / ${fmt(p)}</span></div><div class="pb"><div class="pf" style="width:${pc}%;background:${col}"></div></div>${pc>=80&&pc<90?`<div class="pa">Atencion: usaste el ${pc}% del presupuesto</div>`:''}${pc>=90&&pc<100?`<div class="pa" style="color:var(--red)">Casi al limite (${pc}%)</div>`:''}${pc>=100?`<div class="pa" style="color:var(--red);font-weight:600">Excedido en ${fmt(g-p)}</div>`:''}</div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="ct">Checklist de pagos</div>
      ${conceptos.map(c=>`<div class="chk-item" onclick="togglePago('${c.key}')"><div class="chk-box${isPagado(c.key)?' done':''}"></div><span class="chk-label${isPagado(c.key)?' done':''}">${c.label}</span><span class="chk-monto">${fmt(c.monto)}</span></div>`).join('')}
    </div>
    <div class="card">
      <div class="ct">Por tarjeta</div>
      ${[['Tarjeta Casa',gastCasa],['Tarjeta Pareja',gastPar],['Tarjeta Personal',gastPers],['Alquiler + Expensas',totalViv],['Ahorro del mes',gastAho]].map(([l,v])=>`<div class="ri"><span class="rl">${l}</span><span class="rr">${fmt(v)}</span></div>`).join('')}
    </div>
    <div class="card">
      <div class="ct">Distribucion</div>
      <div class="donut-wrap">
        <div class="donut-chart"><canvas id="pgasto"></canvas></div>
        <div class="donut-legend">${donutLabels.map((l,i)=>`<div class="dl-item"><div class="dl-dot" style="background:${donutColors[i]}"></div><span>${l}</span><span class="dl-val">${fmt(donutData[i])}</span></div>`).join('')}</div>
      </div>
    </div>`;

  setTimeout(()=>{
    const ctx=document.getElementById('pgasto');if(!ctx)return;
    if(chartG)chartG.destroy();
    chartG=new Chart(ctx,{type:'doughnut',data:{labels:donutLabels,datasets:[{data:donutData,backgroundColor:donutColors,borderWidth:0,hoverOffset:3,cutout:'75%'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},layout:{padding:4}}});
  },80);
}

// RENDER HISTORIAL
function renderHistorial(){
  document.getElementById('mlabel2').textContent=mesLabel(curMes);
  const busq=(document.getElementById('search-input')?.value||'').toLowerCase().trim();
  let gm=movDelMes();
  if(filtro==='gasto')gm=gm.filter(m=>m.tipo!=='ingreso');
  else if(filtro==='ingreso')gm=gm.filter(m=>m.tipo==='ingreso');
  else if(filtro==='cuotas')gm=gm.filter(m=>m.cuotas_total);
  else if(filtro==='yo')gm=gm.filter(m=>m.persona==='yo');
  else if(filtro==='novia')gm=gm.filter(m=>m.persona==='novia');
  if(busq)gm=gm.filter(m=>(m.descripcion||'').toLowerCase().includes(busq)||(m.nota||'').toLowerCase().includes(busq)||(m.persona||'').toLowerCase().includes(busq)||(m.categoria||'').toLowerCase().includes(busq));
  const el=document.getElementById('historial-content');
  if(!gm.length){el.innerHTML='<div class="empty">Sin resultados</div>';}
  else el.innerHTML=gm.map(g=>{
    const pLabel=g.persona?(g.persona==='yo'?cfg.nombre1:g.persona==='novia'?cfg.nombre2:'Ambos'):'';
    return `<div class="gi"><div class="gt"><div><div class="gd">${g.descripcion}${g.cuotas_total?` <span style="font-size:11px;color:var(--accent2)">${g.cuotas_numero||'?'}/${g.cuotas_total}</span>`:''}</div><div class="gm2">${CAT_LABEL[g.categoria]||g.categoria} · ${g.fecha}</div>${g.created_at?`<div class="ghr">${fmtDT(g.created_at)}</div>`:''}</div><div class="gright">${g.cuotas_total&&g.nota&&g.nota.includes('Total:')?`<div class="gmonto-total">${g.nota.match(/Total: \$[\d.,]+/)?.[0]||''}</div>`:''}<div class="gmonto ${g.tipo==='ingreso'?'ing':'gas'}">${g.tipo==='ingreso'?'+':''}${fmt(g.monto)}</div><button class="bdel" onclick="eliminarMov(${g.id})">×</button></div></div>${pLabel?`<div><span class="gpersona">${pLabel}</span></div>`:''}</div>`;
  }).join('');
  renderHistorialChart();
}
function setFiltro(f,btn){filtro=f;document.querySelectorAll('#hfiltros .qbtn').forEach(b=>{b.style.borderColor='';b.style.color='';});btn.style.borderColor='var(--accent)';btn.style.color='var(--accent2)';renderHistorial();}

function renderHistorialChart(){
  const ctx=document.getElementById('hist-chart');if(!ctx)return;
  if(chartH)chartH.destroy();
  const mls=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);mls.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
  const tc=darkMode?'#9090a8':'#5a5a72',gc=darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)';
  chartH=new Chart(document.getElementById('hist-chart'),{type:'bar',data:{labels:mls.map(m=>mesLabel(m).split(' ')[0]),datasets:[{label:'Gastos',data:mls.map(m=>movDelMes(m).filter(x=>x.tipo!=='ingreso').reduce((a,b)=>a+b.monto,0)),backgroundColor:'rgba(248,113,113,0.7)',borderRadius:4},{label:'Ingresos extra',data:mls.map(m=>movDelMes(m).filter(x=>x.tipo==='ingreso').reduce((a,b)=>a+b.monto,0)),backgroundColor:'rgba(62,207,142,0.7)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:{family:'Poppins',size:10},boxWidth:8,usePointStyle:true,pointStyle:'circle'}}},scales:{y:{ticks:{color:tc,font:{family:'Poppins',size:9},callback:v=>'$'+Math.round(v/1000)+'k'},grid:{color:gc}},x:{ticks:{color:tc,font:{family:'Poppins',size:9}},grid:{color:gc}}}}});
}

// RENDER AHORROS
function renderAhorros(){
  const total=ahorros.reduce((a,b)=>a+b.monto,0);
  document.getElementById('ahero').innerHTML=`<div class="ahorro-hero"><div class="ah-label">Total ahorrado</div><div class="ah-value">${fmt(total)}</div><div style="font-size:12px;opacity:.7;margin-top:4px">${ahorros.length} depositos</div></div>`;
  const bmap={};ahorros.forEach(a=>{if(!bmap[a.billetera])bmap[a.billetera]={total:0,color:a.color||'#7c6dfa'};bmap[a.billetera].total+=a.monto;});
  document.getElementById('bill-list').innerHTML=Object.keys(bmap).length?Object.entries(bmap).map(([b,{total,color}])=>`<div class="ri"><div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div><span class="rl">${b}</span></div><span class="rr">${fmt(total)}</span></div>`).join(''):'<div class="empty" style="padding:16px">Sin depositos aun</div>';
  document.getElementById('ahist').innerHTML=ahorros.length?[...ahorros].reverse().map(a=>`<div class="gi"><div class="gt"><div><div class="gd" style="display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;border-radius:50%;background:${a.color||'#7c6dfa'};flex-shrink:0"></div>${a.billetera}${a.nota?` · <span style="color:var(--text3);font-weight:400">${a.nota}</span>`:''}</div><div class="gm2">${a.fecha}</div></div><div class="gright"><div class="gmonto ing">+${fmt(a.monto)}</div><button class="bdel" onclick="eliminarAhorro(${a.id})">×</button></div></div></div>`).join(''):'<div class="empty" style="padding:16px">Sin depositos</div>';
  renderAhorrosChart();
}
function setChartMode(m,btn){chartMode=m;['cht-tot','cht-des'].forEach(id=>{document.getElementById(id).style.borderColor='';document.getElementById(id).style.color='';});btn.style.borderColor='var(--accent)';btn.style.color='var(--accent2)';renderAhorrosChart();}
function renderAhorrosChart(){
  const ctx=document.getElementById('achrt');if(!ctx)return;
  if(chartA)chartA.destroy();
  const mls=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);mls.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
  const tc=darkMode?'#9090a8':'#5a5a72',gc=darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)';
  const labels=mls.map(m=>mesLabel(m).split(' ')[0]);
  const baseOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:{family:'Poppins',size:10},boxWidth:8,usePointStyle:true,pointStyle:'circle'}}},scales:{y:{ticks:{color:tc,font:{family:'Poppins',size:9},callback:v=>'$'+Math.round(v/1000)+'k'},grid:{color:gc}},x:{ticks:{color:tc,font:{family:'Poppins',size:9}},grid:{color:gc}}}};
  if(chartMode==='total'){
    let ac=0;const data=mls.map(m=>{ac+=ahorros.filter(a=>a.fecha?.startsWith(m)).reduce((s,a)=>s+a.monto,0);return ac;});
    chartA=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Total ahorrado',data,borderColor:'#7c6dfa',backgroundColor:'rgba(124,109,250,0.08)',fill:true,tension:0.4,pointBackgroundColor:'#7c6dfa',pointRadius:3}]},options:baseOpts});
  } else {
    const bmap={};ahorros.forEach(a=>{if(!bmap[a.billetera])bmap[a.billetera]={color:a.color||'#7c6dfa',items:[]};bmap[a.billetera].items.push(a);});
    chartA=new Chart(ctx,{type:'line',data:{labels,datasets:Object.entries(bmap).map(([b,{color,items}])=>{let ac=0;const data=mls.map(m=>{ac+=items.filter(a=>a.fecha?.startsWith(m)).reduce((s,a)=>s+a.monto,0);return ac;});return{label:b,data,borderColor:color,backgroundColor:'transparent',tension:0.4,pointBackgroundColor:color,pointRadius:3};})},options:baseOpts});
  }
}

// RENDER PRESTAMOS
function renderPrestamos(){
  document.getElementById('mlabel3').textContent=mesLabel(curMes);
  const el=document.getElementById('prest-lista');
  if(!prestamos.length){el.innerHTML='<div class="empty">Sin prestamos registrados</div>';return;}
  const personas={};
  prestamos.forEach(p=>{if(!personas[p.nombre])personas[p.nombre]=[];personas[p.nombre].push(p);});
  el.innerHTML=Object.entries(personas).map(([nombre,lista])=>{
    const totalMes=lista.reduce((a,p)=>a+p.monto_cuota,0);
    const items=lista.map(p=>{
      const tieneCuotas=p.cuotas_total&&p.cuotas_total>0;
      let cuotaAct=1,prog=0;
      if(tieneCuotas){
        const inicio=new Date(p.fecha_inicio+'T12:00:00');
        const ahora=new Date(curMes+'-15T12:00:00');
        const mTransc=Math.max(0,Math.round((ahora-inicio)/(1000*60*60*24*30)));
        cuotaAct=Math.min(mTransc+1,p.cuotas_total);
        prog=Math.round(cuotaAct/p.cuotas_total*100);
      }
      const pagado=isPagado('prest-'+p.id);
      const saldado=pagado&&(!tieneCuotas||(tieneCuotas&&prog>=100));
      return `<div class="prest-item">
        <div class="prest-top">
          <div><div class="prest-desc">${p.descripcion||'Prestamo'}</div>
          <div class="prest-cuota-info">${fmt(p.monto_cuota)}${tieneCuotas?' · Cuota '+cuotaAct+'/'+p.cuotas_total:' · Monto fijo'}</div></div>
          <button class="bdel" onclick="eliminarPrestamo(${p.id})">×</button>
        </div>
        ${tieneCuotas?`<div class="prest-prog"><div class="prest-fill" style="width:${prog}%;background:${saldado?'#3ecf8e':'#7c6dfa'}"></div></div>`:''}
        ${saldado?'<div class="prest-sald">Marcado como saldado este mes</div>':''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <div class="chk-item" style="flex:1;border:none;padding:0" onclick="togglePago('prest-${p.id}')">
            <div class="chk-box${pagado?' done':''}"></div>
            <span class="chk-label${pagado?' done':''}">${tieneCuotas?'Cuota '+cuotaAct+' pagada':'Pagado este mes'}</span>
            <span class="chk-monto">${fmt(p.monto_cuota)}</span>
          </div>
          <button class="btn-adj" onclick="openModalAdj(${p.id})">Ajustar monto</button>
        </div>
      </div>`;
    }).join('');
    return `<div class="persona-card"><div class="persona-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'"><div><div class="persona-nombre">${nombre}</div><div style="font-size:11px;color:var(--text3)">${lista.length} prestamo${lista.length>1?'s':''}</div></div><div class="persona-total">${fmt(totalMes)}/mes</div></div><div class="persona-body">${items}</div></div>`;
  }).join('');
}

// IA
function buildCtx(){
  const gm=movDelMes();
  const gastosM=gm.filter(m=>m.tipo!=='ingreso');
  const ingresosM=gm.filter(m=>m.tipo==='ingreso');
  const ingrExtra=ingresosM.reduce((a,b)=>a+b.monto,0),ingrTotal=cfg.sueldo+ingrExtra;
  const alqArs=cfg.alqUsd*cfg.tc,totalViv=alqArs+cfg.exp;
  const gastAho=ahorros.filter(a=>a.fecha?.startsWith(curMes)).reduce((a,b)=>a+b.monto,0);
  const totalAho=ahorros.reduce((a,b)=>a+b.monto,0);
  const bmap={};ahorros.forEach(a=>{bmap[a.billetera]=(bmap[a.billetera]||0)+a.monto;});
  const listaGastos=gastosM.length?gastosM.map(g=>`- [${g.fecha}] ${g.descripcion}${g.cuotas_total?' (cuota '+g.cuotas_numero+'/'+g.cuotas_total+')':''} | ${CAT_LABEL[g.categoria]||g.categoria} | ${fmt(g.monto)}${g.persona?' | quien: '+(g.persona==='yo'?cfg.nombre1:g.persona==='novia'?cfg.nombre2:'Ambos'):''}${g.nota?' | nota: '+g.nota:''}`).join('\n'):'Sin gastos registrados';
  const listaPrest=prestamos.length?prestamos.map(p=>`- ${p.nombre} | ${p.descripcion||'prestamo'} | ${fmt(p.monto_cuota)}${p.cuotas_total?'/cuota, '+p.cuotas_total+' cuotas totales':' monto fijo'} | inicio: ${p.fecha_inicio} | pagado este mes: ${isPagado('prest-'+p.id)?'SI':'NO'}`).join('\n'):'Sin prestamos';
  return `Eres un asistente financiero personal amigable. IMPORTANTE: responde SIEMPRE en espanol, maximo 5 oraciones claras. Interpreta preguntas de forma natural — busca en nombres, descripciones y notas.

MES: ${mesLabel(curMes)} | Sueldo: ${fmt(cfg.sueldo)} | Extra: ${fmt(ingrExtra)} | Total ingresos: ${fmt(ingrTotal)}
Regla ${cfg.nec}/${cfg.des}/${cfg.aho}: Necesidades gastado ${fmt(totalViv+gastosM.filter(g=>g.categoria==='casa').reduce((a,b)=>a+b.monto,0))} de ${fmt(ingrTotal*cfg.nec/100)} | Deseos gastado ${fmt(gastosM.filter(g=>['pareja','personal'].includes(g.categoria)).reduce((a,b)=>a+b.monto,0))} de ${fmt(ingrTotal*cfg.des/100)} | Ahorro: ${fmt(gastAho)} de ${fmt(ingrTotal*cfg.aho/100)}
Vivienda: ${fmt(totalViv)} | Nombre usuario: ${cfg.nombre1} | Nombre novia: ${cfg.nombre2}

LISTA COMPLETA DE GASTOS DEL MES:
${listaGastos}

PRESTAMOS ACTIVOS:
${listaPrest}

AHORROS: Total ${fmt(totalAho)} | Por billetera: ${Object.entries(bmap).map(([k,v])=>k+' '+fmt(v)).join(', ')||'sin registros'}`;
}

async function sendChat(){
  const inp=document.getElementById('cinput'),msg=inp.value.trim();if(!msg)return;
  inp.value='';addMsg(msg,'u');const th=addMsg('Analizando tus datos...','a th');
  try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEM_KEY}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:buildCtx()+'\n\nPregunta: '+msg}]}],generationConfig:{maxOutputTokens:400,temperature:0.7}})
    });
    if(!r.ok){th.className='cm a';th.textContent='Error de conexion ('+r.status+'). Intenta de nuevo.';return;}
    const d=await r.json();
    const t=d.candidates?.[0]?.content?.parts?.[0]?.text;
    th.className='cm a';th.textContent=t||'No pude generar una respuesta. Intenta reformular la pregunta.';
  }catch(e){th.className='cm a';th.textContent='Error de conexion. Verifica tu internet e intenta de nuevo.';}
  document.getElementById('chat-msgs').scrollTop=9999;
}
function qa(q){document.getElementById('cinput').value=q;sendChat();}
function addMsg(t,c){const el=document.createElement('div');el.className='cm '+c;el.textContent=t;const w=document.getElementById('chat-msgs');w.appendChild(el);w.scrollTop=9999;return el;}

// PDF
function genPDF(){
  const{jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const gm=movDelMes(),gastosM=gm.filter(m=>m.tipo!=='ingreso');
  const ingrExtra=gm.filter(m=>m.tipo==='ingreso').reduce((a,b)=>a+b.monto,0),ingrTotal=cfg.sueldo+ingrExtra;
  const alqArs=cfg.alqUsd*cfg.tc,totalViv=alqArs+cfg.exp;
  const gc2=g=>gastosM.filter(x=>x.categoria===g).reduce((a,b)=>a+b.monto,0);
  const gastAho=ahorros.filter(a=>a.fecha?.startsWith(curMes)).reduce((a,b)=>a+b.monto,0);
  const gastNec=totalViv+gc2('casa'),gastDes=gc2('pareja')+gc2('personal'),totalGast=gastNec+gastDes+gastAho;

  doc.setFillColor(255,255,255);doc.rect(0,0,210,297,'F');
  doc.setFillColor(124,109,250);doc.rect(0,0,210,20,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont('helvetica','bold');doc.text('fin. Finanzas Personales',14,13);
  doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text(mesLabel(curMes).toUpperCase(),160,13);

  let y=28;
  [[fmt(ingrTotal),'Ingresos','#e8f5e9'],[fmt(totalGast),'Gastado','#fff3e0'],[fmt(Math.max(0,ingrTotal-totalGast)),'Disponible','#e3f2fd']].forEach(([v,l,bg],i)=>{
    const x=14+i*62,rgb=bg==='#e8f5e9'?[232,245,233]:bg==='#fff3e0'?[255,243,224]:[227,242,253];
    doc.setFillColor(...rgb);doc.roundedRect(x,y,58,16,2,2,'F');
    doc.setDrawColor(220,220,220);doc.roundedRect(x,y,58,16,2,2,'S');
    doc.setTextColor(100,100,100);doc.setFontSize(7);doc.setFont('helvetica','normal');doc.text(l,x+4,y+6);
    doc.setTextColor(30,30,30);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(v,x+4,y+13);
  });

  y+=24;doc.setFont('helvetica','normal');
  doc.setTextColor(100,100,100);doc.setFontSize(8);doc.text('DISTRIBUCION '+cfg.nec+'/'+cfg.des+'/'+cfg.aho,14,y);y+=5;
  [{l:'Necesidades',p:ingrTotal*cfg.nec/100,g:gastNec},{l:'Deseos',p:ingrTotal*cfg.des/100,g:gastDes},{l:'Ahorro',p:ingrTotal*cfg.aho/100,g:gastAho}].forEach(({l,p,g})=>{
    const pc=Math.min(100,p>0?g/p*100:0);
    const col=pc<70?[62,160,100]:pc<90?[200,130,0]:[200,60,60];
    doc.setFillColor(240,240,240);doc.roundedRect(14,y,182,10,2,2,'F');
    if(pc>0){doc.setFillColor(...col);doc.roundedRect(14,y,Math.max(3,182*pc/100),10,2,2,'F');}
    doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text(l,18,y+7);
    doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');doc.text(fmt(g)+' / '+fmt(p),140,y+7);y+=14;
  });

  y+=2;doc.setTextColor(100,100,100);doc.setFontSize(8);doc.text('POR CATEGORIA',14,y);y+=2;
  doc.autoTable({startY:y,theme:'plain',styles:{font:'helvetica',fontSize:9,textColor:[40,40,40],cellPadding:4},headStyles:{textColor:[100,100,100],fontSize:7,fontStyle:'normal',fillColor:[240,240,240]},head:[['Categoria','Monto']],body:[['Tarjeta Casa',fmt(gc2('casa'))],['Tarjeta Pareja',fmt(gc2('pareja'))],['Tarjeta Personal',fmt(gc2('personal'))],['Alquiler + Expensas',fmt(totalViv)],['Ahorro',fmt(gastAho)]],alternateRowStyles:{fillColor:[248,248,248]},tableLineColor:[220,220,220],tableLineWidth:0.2,margin:{left:14,right:14}});

  if(gm.length>0){
    y=doc.lastAutoTable.finalY+8;
    doc.setTextColor(100,100,100);doc.setFontSize(8);doc.text('MOVIMIENTOS DEL MES',14,y);y+=2;
    const pLabel=p=>p==='yo'?cfg.nombre1:p==='novia'?cfg.nombre2:p==='ambos'?'Ambos':'-';
    doc.autoTable({startY:y,theme:'plain',styles:{font:'helvetica',fontSize:8,textColor:[40,40,40],cellPadding:3},headStyles:{textColor:[100,100,100],fontSize:7,fillColor:[240,240,240]},head:[['Fecha','Descripcion','Cuotas','Quien','Monto']],body:gm.map(g=>[g.fecha,(g.descripcion||'').substring(0,22),g.cuotas_total?(g.cuotas_numero+'/'+g.cuotas_total):'-',pLabel(g.persona),(g.tipo==='ingreso'?'+':'')+fmt(g.monto)]),alternateRowStyles:{fillColor:[248,248,248]},tableLineColor:[220,220,220],tableLineWidth:0.2,margin:{left:14,right:14},columnStyles:{4:{halign:'right',cellWidth:28}}});
  }

  const conPersona=gastosM.filter(g=>g.persona);
  if(conPersona.length>0){
    y=doc.lastAutoTable.finalY+8;
    doc.setTextColor(100,100,100);doc.setFontSize(8);doc.text('DESGLOSE POR PERSONA',14,y);y+=2;
    const byP={};conPersona.forEach(g=>{const k=g.persona==='yo'?cfg.nombre1:g.persona==='novia'?cfg.nombre2:'Ambos';if(!byP[k])byP[k]=0;byP[k]+=g.monto;});
    doc.autoTable({startY:y,theme:'plain',styles:{font:'helvetica',fontSize:9,textColor:[40,40,40],cellPadding:4},headStyles:{textColor:[100,100,100],fontSize:7,fillColor:[240,240,240]},head:[['Persona','Total gastado']],body:Object.entries(byP).map(([k,v])=>[k,fmt(v)]),alternateRowStyles:{fillColor:[248,248,248]},tableLineColor:[220,220,220],tableLineWidth:0.2,margin:{left:14,right:14}});
  }

  doc.setTextColor(160,160,160);doc.setFontSize(7);doc.text('fin. app finanzas personales',14,290);doc.text(new Date().toLocaleDateString('es-AR'),170,290);
  doc.save('finanzas-'+curMes+'.pdf');toast('PDF descargado');
}

function sp(name,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');if(btn)btn.classList.add('active');
  if(name==='resumen')renderResumen();
  if(name==='historial')renderHistorial();
  if(name==='ahorros')renderAhorros();
  if(name==='prestamos')renderPrestamos();
}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

const sv=sessionStorage.getItem('fu');if(sv){U=JSON.parse(sv);initApp();}
