const SKEY='millionGoalApp.v1';
let state = JSON.parse(localStorage.getItem(SKEY) || '{}');
state.payments ??= [];
state.watchlist ??= [
  {ticker:'VWRA', note:'Global diversified ETF idea to research', trend:'Research'},
  {ticker:'CSPX', note:'S&P 500 ETF idea to research', trend:'Research'},
  {ticker:'ES3', note:'Singapore STI ETF idea to research', trend:'Research'}
];
const $=id=>document.getElementById(id);
const money=n=>'S$'+Number(n||0).toLocaleString('en-SG',{maximumFractionDigits:0});
function save(){localStorage.setItem(SKEY,JSON.stringify(state));render();}
function monthsUntilYear(y){const now=new Date();return Math.max(1,(Number(y||now.getFullYear()+10)-now.getFullYear())*12-now.getMonth());}
function fv(current, monthly, annualPct, months){let r=(Number(annualPct||0)/100)/12; if(!r) return current+monthly*months; return current*Math.pow(1+r,months)+monthly*((Math.pow(1+r,months)-1)/r);}
function calc(){
 const income=+state.income||0, expenses=+state.expenses||0, cash=+state.cash||0, inv=+state.investments||0;
 const surplus=income-expenses, net=cash+inv, goal=+state.goal||1000000, months=monthsUntilYear(state.targetYear);
 const projected=fv(net, Math.max(0,surplus), +state.returnRate||0, months);
 const needRate=(+state.returnRate||0)/100/12;
 let monthlyNeed = needRate ? ((goal - net*Math.pow(1+needRate,months))*needRate)/(Math.pow(1+needRate,months)-1) : (goal-net)/months;
 return {income,expenses,surplus,net,goal,months,projected,monthlyNeed:Math.max(0,monthlyNeed)};
}
function render(){
 ['income','expenses','cash','investments','targetRate','returnRate','goal','targetYear'].forEach(id=>{if(state[id]!==undefined) $(id).value=state[id]});
 const c=calc(); const pct=Math.min(100,(c.net/c.goal)*100);
 $('netWorthHero').textContent=money(c.net); $('goalGapHero').textContent=money(Math.max(0,c.goal-c.net))+' to go';
 $('progressBar').style.width=pct+'%'; $('progressText').textContent=pct.toFixed(1)+'% funded';
 $('surplus').textContent=money(c.surplus); $('rate').textContent=c.income?((c.surplus/c.income)*100).toFixed(1)+'%':'0%'; $('projection').textContent=money(c.projected);
 $('monthlyNeed').textContent=`To hit ${money(c.goal)} by ${state.targetYear||'your target year'}, aim to invest/save about ${money(c.monthlyNeed)} per month.`;
 let nudge='Start by saving your setup. Then add all recurring payments so nothing surprises you.';
 if(c.income){const actual=(c.surplus/c.income)*100, target=+state.targetRate||40; nudge=actual>=target?`Great: your current savings rate is above your ${target}% target. Automate the surplus before lifestyle spending creeps in.`:`Your savings rate is below your ${target}% target. Try trimming ${money(((target-actual)/100)*c.income)} monthly or raising income/investments.`}
 if(c.projected<c.goal && c.income)nudge += ` At this pace, projected net worth is ${money(c.projected)}, so the gap is ${money(c.goal-c.projected)}.`;
 $('nudgeBox').textContent=nudge;
 renderPayments(); renderWatchlist();
}
function renderPayments(){
 $('payments').innerHTML=state.payments.sort((a,b)=>new Date(a.date)-new Date(b.date)).map((p,i)=>{
  const d=Math.ceil((new Date(p.date)-new Date())/86400000); const cls=d<0?'late':d<=7?'soon':'ok'; const label=d<0?`${Math.abs(d)} days late`:d===0?'Due today':`${d} days left`;
  return `<div class="payment"><strong>${p.name}</strong><span>${money(p.amount)}</span><span class="badge ${cls}">${label}</span><button onclick="delPayment(${i})">Done/Delete</button></div>`
 }).join('') || '<p class="muted">No payments yet.</p>';
}
function renderWatchlist(){
 $('watchlist').innerHTML=state.watchlist.map((w,i)=>`<div class="ticker"><strong>${w.ticker.toUpperCase()}</strong><span>${w.note||''}</span><span class="badge ok">${w.trend||'Research'}</span><button onclick="removeTicker(${i})">Remove</button></div>`).join('');
}
window.delPayment=i=>{state.payments.splice(i,1);save()}; window.removeTicker=i=>{state.watchlist.splice(i,1);save()};
$('saveSetup').onclick=()=>{['income','expenses','cash','investments','targetRate','returnRate','goal','targetYear'].forEach(id=>state[id]=$(id).value);save();};
$('addPayment').onclick=()=>{if(!$('paymentName').value||!$('paymentDate').value)return alert('Add payment name and date.');state.payments.push({name:$('paymentName').value,amount:+$('paymentAmount').value||0,date:$('paymentDate').value});$('paymentName').value=$('paymentAmount').value=$('paymentDate').value='';save();};
$('addTicker').onclick=()=>{if(!$('ticker').value)return;state.watchlist.push({ticker:$('ticker').value,note:$('watchNote').value,trend:'Research'});$('ticker').value=$('watchNote').value='';save();};
$('enableAlerts').onclick=async()=>{ if(!('Notification' in window)) return alert('Notifications not supported.'); await Notification.requestPermission(); alert('Alerts enabled. Keep this app open for browser reminders.');};
setInterval(()=>{ if(Notification.permission!=='granted')return; state.payments.forEach(p=>{const d=Math.ceil((new Date(p.date)-new Date())/86400000); const key='alerted_'+p.name+p.date; if(d>=0&&d<=3&&!state[key]){new Notification('Payment reminder',{body:`${p.name} ${money(p.amount)} due in ${d} day(s).`});state[key]=true;localStorage.setItem(SKEY,JSON.stringify(state));}})},60000);
$('exportData').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='million-goal-finance-data.json';a.click();};
$('importData').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{state=JSON.parse(r.result);save()};r.readAsText(f);};
$('resetData').onclick=()=>{if(confirm('Reset all local data?')){localStorage.removeItem(SKEY);location.reload();}};
render();
