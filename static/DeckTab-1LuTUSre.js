const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["static/EventDeckRecommendationModal-CbFXcKdQ.js","static/rolldown-runtime-XKyaHtl9.js","static/deckRecommendation-D9p1xoTw.js","static/safeStorage-U3aZNXx8.js","static/env-oEuwIDn6.js","static/index-ChxyfaoF.js","static/jsx-runtime-C3cWAN_r.js","static/index-BLrCds56.css","static/dataLoader-BzRJSQZq.js","static/supportCardUtils-C8JX-WGV.js","static/deckUtils-D_LBrpmN.js","static/deckRecommendation-CMdpp-19.css","static/SupportCardPickerModal-B_D939Pw.js","static/EventDeckRecommendationModal-BmYj54mp.css","static/AccountImportButton-CwnH5hh5.js","static/AccountImport-Dd0SbSFp.css","static/AutoTab-DdelcR8T.js","static/InputComponents-B-yY3wiW.js","static/calculator-DvVFE1Ra.js","static/mySekaiTableData-BdmewBqn.js","static/autoSongSelection-CDGoWDNr.js","static/AllSongsTable-CPVDsS9X.js","static/PowerTab-DL7i7IIj.js","static/SkillPushControl-CW5HYhpw.js","static/SkillPushControl-CqbsCqV_.css","static/noteScoreClient-DwVvP4gk.js","static/StandaloneRecommendation-W9JLP7t-.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-XKyaHtl9.js";import{n,t as r}from"./jsx-runtime-C3cWAN_r.js";import{$ as i,A as a,F as o,H as s,K as c,M as l,N as u,O as d,P as f,Q as p,R as m,W as h,X as g,Y as _,Z as v,d as y,et as b,j as ee,m as te,q as x,tt as ne}from"./index-ChxyfaoF.js";import{a as S,i as re,n as ie,o as C,r as w,t as ae}from"./deckUtils-D_LBrpmN.js";import{S as T,n as E,r as D,t as oe,w as se}from"./safeStorage-U3aZNXx8.js";import{i as ce,t as le}from"./supportCardUtils-C8JX-WGV.js";import{t as ue}from"./SupportCardPickerModal-B_D939Pw.js";import{A as de,F as fe,I as pe,M as me,N as he,P as ge,i as _e,j as ve,k as ye,r as O,t as be}from"./deckRecommendation-D9p1xoTw.js";import{h as k,n as xe,t as A,u as Se}from"./env-oEuwIDn6.js";import Ce from"./AccountImportButton-CwnH5hh5.js";var j=t(n()),M=t(ne());function we(){let e=T(y,null),t={};for(let n of Array.isArray(e?.ownedCardIds)?e.ownedCardIds:[]){if(!/^[1-9]\d{0,8}$/.test(String(n)))continue;let r={...e.cardDetails?.[n],...T(`ebc_card_stats_${n}`,{})},i=Number(r.skillLevel);Number.isInteger(i)&&i>=2&&i<=4&&(t[n]=i)}return Object.keys(t).length?t:null}function N(e,t,n={}){let r=new URLSearchParams;if(n.attr&&r.set(`eventAttr`,n.attr),n.unit&&r.set(`eventUnit`,n.unit),n.characters){let e=Object.entries(n.characters).filter(([,e])=>e).map(([e,t])=>Number(e)>=21?`${e}:${t}`:e).join(`,`);e&&r.set(`eventCharacters`,e)}let i=r.toString();return`${e}/${t}${i?`?${i}`:``}`}async function P(e,t,n,r,i=null){let a=Date.now(),o=new AbortController,s=setTimeout(()=>o.abort(),3e4);try{let a=N(e,t,n),s=i?await fetch(a,{method:`POST`,body:JSON.stringify(i),signal:o.signal,cache:`no-store`}):await fetch(a,{signal:o.signal,cache:`no-store`});if(i&&[400,405,411,413].includes(s.status)&&(s=await fetch(a,{signal:o.signal,cache:`no-store`})),!s.ok)return{ok:!1,code:`${r}: D01 (HTTP ${s.status})${s.status===403?` 접근이 차단되었습니다.`:``}`};let c=await s.json();return c?.error?{ok:!1,code:`${r}: D02 (${String(c.error).slice(0,200)})`}:!Array.isArray(c?.skillValues)||c.skillValues.length!==5?{ok:!1,code:`${r}: D02 (덱 정보 없음)`}:[c.totalPower,c.eventBonus,...c.skillValues].every(e=>typeof e==`number`&&Number.isFinite(e)&&e>=0)?{ok:!0,data:c}:{ok:!1,code:`${r}: D02 (종합력·배수·스킬 응답 형식 오류)`}}catch{return{ok:!1,code:`${r}: ${o.signal.aborted?`D04 (30초 응답 시간 초과)`:`D03 (연결 오류 또는 CORS 차단)`}`}}finally{clearTimeout(s),console.info(`[친구코드 불러오기]`,r,i?`스킬 레벨 포함`:`기본`,`${Date.now()-a}ms`)}}async function Te(e,t={},n=()=>{},{skillLevels:r=null}={}){let i=c(),{deckApi:a,deckFallbackApi:o,isKorean:s}=x(i);n(`primary`);let l=await P(a,e,t,s?`한국 서버`:`기본 서버`,s?null:r);if(i!==c())throw Error(`서버가 변경되었습니다. 다시 불러와 주세요.`);if(l.ok)return l.data;if(!o)throw Error(l.code);n(`fallback`);let u=await P(o,e,t,`보조 서버`);if(i!==c())throw Error(`서버가 변경되었습니다. 다시 불러와 주세요.`);if(u.ok)return u.data;throw Error(`${l.code} / ${u.code}`)}function Ee(e){let t=String(e?.message||``);return/404|not found|存在し|見つか|user.*invalid/i.test(t)?`플레이어를 찾지 못했습니다. ${c()===`kr`?`한국`:`일본`} 서버 친구코드인지 확인해 주세요.`:/403/.test(t)?`서버가 접근을 차단했습니다. 잠시 후 다시 시도해 주세요.`:/429/.test(t)?`요청이 많아 잠시 제한되었습니다. 조금 뒤 다시 시도해 주세요.`:/D04|timeout|시간 초과/i.test(t)?`서버 응답이 늦어 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`:/D03|network|fetch/i.test(t)?`서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.`:/D02/.test(t)?`서버에서 올바른 덱 정보를 받지 못했습니다. 친구코드를 확인하거나 잠시 후 다시 시도해 주세요.`:`플레이어 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`}var F=r();function De({value:e,onChange:t}){let{t:n}=i(),[r,a]=(0,j.useState)(String(e));return(0,j.useEffect)(()=>a(String(e)),[e]),(0,F.jsxs)(`div`,{className:`ebc-wl-support-inputs`,children:[(0,F.jsxs)(`label`,{children:[(0,F.jsxs)(`span`,{children:[n(`support.support_bonus`),` `,(0,F.jsx)(`small`,{children:n(`support.recommend_support_theory`,{value:465})})]}),(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`input`,{type:`number`,inputMode:`decimal`,min:`0`,max:465,step:`0.1`,value:r,"aria-label":n(`support.support_bonus`),onFocus:e=>e.target.select(),onChange:e=>{let n=e.target.value;a(n),n!==``&&Number.isFinite(Number(n))&&t(O(n))},onBlur:()=>a(String(e))}),(0,F.jsx)(`b`,{children:`%`})]})]}),(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:n(`support.support_shop_bonus`)}),(0,F.jsxs)(`div`,{className:`ebc-wl-support-readonly`,children:[(0,F.jsx)(`input`,{type:`number`,value:e/2,readOnly:!0,"aria-label":n(`support.support_shop_bonus`)}),(0,F.jsx)(`b`,{children:`%`})]})]})]})}var Oe=({value:e,options:t,onChange:n,assetPath:r,iconOnly:a=!1,extraOptions:o=[],autoOption:s=null})=>{let{t:c}=i(),[l,u]=(0,j.useState)(!1),d=(0,j.useRef)(null),f=[...t,...o],p=f.find(t=>t.key===e)||s,m=!e;(0,j.useEffect)(()=>{let e=e=>{d.current&&!d.current.contains(e.target)&&u(!1)};return l&&document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[l]);let h=e=>{n(e),u(!1)};return(0,F.jsxs)(`div`,{className:`relative`,ref:d,children:[(0,F.jsxs)(`button`,{type:`button`,onClick:()=>u(e=>!e),className:`flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-left shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300`,children:[(0,F.jsxs)(`span`,{className:`flex min-w-0 items-center gap-1.5`,children:[p?.file?(0,F.jsx)(`img`,{src:`/assets/event/${r}/${p.file}`,alt:p.label,className:`${a?`h-6 w-7`:`h-5 w-5`} shrink-0 object-contain`}):(0,F.jsx)(`span`,{className:`truncate text-sm font-bold text-gray-700`,children:p?.label||c(`support.auto`)||`자동`}),p?.file&&(0,F.jsx)(`span`,{className:`truncate text-sm font-bold text-gray-700`,children:p.label}),m&&p&&(0,F.jsxs)(`span`,{className:`shrink-0 text-[10px] font-bold text-gray-400`,children:[`(`,c(`support.auto`)||`자동`,`)`]})]}),(0,F.jsx)(`svg`,{className:`ml-1 h-3 w-3 shrink-0 text-gray-400 transition-transform ${l?`rotate-180`:``}`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,children:(0,F.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2.5`,d:`M19 9l-7 7-7-7`})})]}),l&&(0,F.jsx)(`div`,{className:`absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/10`,children:(0,F.jsxs)(`div`,{className:a?`grid grid-cols-3 gap-1 p-1.5`:``,children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>h(``),className:`${a?`flex h-9 items-center justify-center rounded-md px-1 text-xs`:`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm`} font-bold transition-colors ${e?`text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700`:`bg-indigo-50 text-indigo-700`}`,title:c(`support.auto`)||`자동`,children:c(`support.auto`)||`자동`}),f.map(t=>(0,F.jsxs)(`button`,{type:`button`,onClick:()=>h(t.key),className:`${a?`flex h-9 items-center justify-center rounded-md px-1 text-xs`:`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm`} font-bold transition-colors ${e===t.key?`bg-indigo-50 text-indigo-700`:`text-gray-700 hover:bg-gray-50`}`,title:t.label,children:[t.file?(0,F.jsx)(`img`,{src:`/assets/event/${r}/${t.file}`,alt:t.label,className:`${a?`h-6 w-8`:`h-5 w-5`} object-contain`}):t.label,!a&&t.file&&t.label]},t.key))]})})]})},ke=(0,j.lazy)(()=>_(()=>import(`./EventDeckRecommendationModal-CbFXcKdQ.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),Ae=(0,j.lazy)(()=>_(()=>import(`./AccountImportButton-CwnH5hh5.js`),__vite__mapDeps([14,1,6,5,3,4,7,15]))),I={unit:10,gate:0,attr:10,titlePower:250,characterArea:20,characterRank:51,characterNui:0,multiUnit:0},je=k(A,`api/cards`),Me=[0,1,2,3,4,5],Ne=5,Pe=e=>{if(!e)return 0;if(String(e.type||``).toLowerCase()===`birthday`)return 1200;let t=String(e.rarity||e.cardRarity||``).toLowerCase();return t===`birthday`?1200:t===`4`?1500:t===`3`?900:t===`2`?600:t===`1`?300:0},Fe=.1,Ie=40,Le=[`param1`,`param2`,`param3`],Re={rarity1:150,rarity2:300,rarity3:450,birthday:540,rarity4:600},ze=[{key:`none`,label:`VS`,file:`Virtualsingerlogo.webp`},...ve],Be=de.filter(e=>e.key!==`wl`),Ve=[{key:`rarity4`,label:`★4`,typeBonus:25,masterRankBonus:[10,12.5,15,17.5,20,25],canPickup:!0,memberBonus:20},{key:`birthday`,label:`BN/AN`,typeBonus:25,masterRankBonus:[5,7,9,11,13,15],canPickup:!1},{key:`rarity3`,label:`★3`,typeBonus:25,masterRankBonus:[0,1,2,3,4,5],canPickup:!1},{key:`rarity2`,label:`★2`,typeBonus:25,masterRankBonus:[0,.2,.4,.6,.8,1],canPickup:!1},{key:`rarity1`,label:`★1`,typeBonus:25,masterRankBonus:[0,.1,.2,.3,.4,.5],canPickup:!1}],He=Ve.reduce((e,t)=>(e[t.key]=t,e),{"":{key:``,label:`비움`,typeBonus:0,masterRankBonus:[0,0,0,0,0,0],canPickup:!1}}),L=()=>Array.from({length:Ne},()=>({rarityKey:`rarity4`,masterRank:0,pickup:!1,featured:!0,typeMatched:!0,isAwakened:!0,skillLevel:1,canvas:!1})),R=e=>e&&typeof e==`object`&&!Array.isArray(e),Ue=e=>{let t=L();return Array.isArray(e)?t.map((t,n)=>R(e[n])?{...t,...e[n]}:t):t},We=e=>{let t=Number(se(e,`1`));return Number.isInteger(t)&&t>=1&&t<=3?t:1},Ge=(e,t,n)=>{let r=Number(e);return Number.isFinite(r)?Math.max(t,Math.min(n,r)):``},z=(e,t)=>e===``?``:Ge(e,0,t),Ke=(e,t)=>{if(e===``)return``;let n=Number(String(e).replace(/[^\d]/g,``));return Number.isFinite(n)?Math.max(0,Math.min(t,n)):``},B=e=>{if(e===``)return``;let t=Number(String(e).replace(/[^\d]/g,``));return Number.isFinite(t)?Math.max(0,t):``},qe=e=>{if(e===``)return``;let t=Number(String(e).replace(/[^\d]/g,``));return Number.isFinite(t)?Math.max(0,t):``},Je=e=>Number(e||0).toFixed(1).replace(/\.0$/,``),Ye=e=>{if(e===``)return``;let t=Number(e);return Number.isFinite(t)?String(t):``},V=e=>{if(!e?.card)return 0;let t=e.card.type||e.card.cardRarityType||``;return e.rarityKey===`birthday`||t===`Birthday`||t===`Anniversary`?Re.birthday:Re[e.rarityKey||`rarity${Number(e.card.rarity)||4}`]||Re.rarity4},H=e=>{let t=Math.max(0,Math.floor(Number(e)||0)),n=Math.floor(t/Le.length),r=t%Le.length;return Le.map((e,t)=>n+ +(t<r))},Xe=e=>{if(!e)return H(0);let t=e.params||e.parameters||{},n=Le.map((n,r)=>{let i=e[n]??t[n]??t[`power${r+1}`],a=Math.floor(Number(i)||0);return Math.max(0,a)});return n.reduce((e,t)=>e+t,0)>0?n:H(e.power||e.defaultPower||0)},Ze=(e,t)=>{let n=Math.trunc(Number(t)||0);if(n===0)return e;let r=n<0?-1:1,i=Math.abs(n),a=Math.floor(i/Le.length),o=i%Le.length;return e.map((e,t)=>Math.max(0,e+r*(a+ +(t<o))))},U=e=>e.reduce((e,t)=>e+t,0),W=(e,t)=>{let n=Number(t)||0;return Math.floor(Math.max(0,Number(e)||0)*n/100)},G=(e,t)=>{let n=Number(t)||0,r=Math.trunc(n),i=Number((n-r).toFixed(6));return W(e,r)+(i>0?W(e,i):0)},Qe=(e,t,n,r,i=0)=>W(e,t)+W(e,n)+W(e,i)+G(e,r),K=e=>(e?.type||e?.cardType||``)===`Unit Event Limited`||Number(e?.cardSupplyId)===6,$e=()=>({multiUnit:I.multiUnit,units:ze.reduce((e,t)=>({...e,[t.key]:I.unit}),{}),gates:ze.reduce((e,t)=>({...e,[t.key]:I.gate}),{}),attrs:Be.reduce((e,t)=>({...e,[t.key]:I.attr}),{}),titlePower:I.titlePower,characters:le.reduce((e,t)=>({...e,[t.id]:{area:I.characterArea,rank:I.characterRank,nui:I.characterNui}}),{})}),et=(e={})=>{let t=$e();return{multiUnit:e.multiUnit===void 0||e.multiUnit===``?t.multiUnit:e.multiUnit,titlePower:e.titlePower===void 0||e.titlePower===``?t.titlePower:e.titlePower,units:ze.reduce((n,r)=>{let i=e.units?.[r.key];return{...n,[r.key]:i===void 0||i===``?t.units[r.key]:i}},{}),gates:ze.reduce((n,r)=>{let i=e.gates?.[r.key];return{...n,[r.key]:i===void 0||i===``?t.gates[r.key]:i}},{}),attrs:Be.reduce((n,r)=>{let i=e.attrs?.[r.key];return{...n,[r.key]:i===void 0||i===``?t.attrs[r.key]:i}},{}),characters:le.reduce((n,r)=>{let i=e.characters?.[r.id]||{};return{...n,[r.id]:{...t.characters[r.id],...i,area:i.area===void 0||i.area===``?t.characters[r.id].area+(Number(e.multiUnit)||0):i.area,nui:i.nui===void 0||i.nui===``?t.characters[r.id].nui:i.nui}}},{})}},tt=(e,t)=>{let n=e.filter(e=>e?.card),r=n.map(e=>(e.card.attr||e.card.cardAttr||e.card.attribute||``).toLowerCase()).filter(Boolean),i=n.map(e=>C(e.card)).filter(Boolean),a=r.length===Ne&&new Set(r).size===1,o=Object.values(d),s=n.map(e=>{let t=o.indexOf(C(e.card));return 1<<((ce(e.card)||e.card?.characterId)>20?0:t)|1<<t}),c=n.length===Ne?s.reduce((e,t)=>e&t,63):0,l=c!==0,u=new Set(i).size>1,f=Number(t.multiUnit)||0,p=e.map(e=>{let n=Xe(e?.card),r=U(n),i=Math.max(0,Math.min(5,Number(e?.masterRank)||0)),s=e?.card?(i-5)*V(e):0,l=e?.card&&e.canvas?Pe(e.card):0,d=U(Ze(Ze(n,s),l));if(!e?.card||d<=0)return{rawCardPower:0,masterRankPower:0,canvasPower:0,basePower:0,totalPower:0,areaPercent:0,areaItemBonus:0,characterRankBonus:0,titleBonus:0,furnitureBonus:0,gateBonus:0};let p=ce(e.card)||e.card?.characterId,m=(e.card.attr||e.card.cardAttr||e.card.attribute||``).toLowerCase(),h=C(e.card),g=t.characters?.[p]||{},_=Number(g.rank),v=Math.min(Number.isFinite(_)?_:0,50)*.1,y=Math.max(0,+(Number(g.area||0)-f).toFixed(6)),b=Number(g.nui||0),ee=p>=21,te=ee&&h!==`none`,x;if(ee){if(te)x=Number(t.gates?.[h]||0)*Fe;else{let e=ze.map(e=>Number(t.gates?.[e.key]||0));x=Math.max(...e)*Fe}}else x=Number(t.gates?.[h]||0)*Fe;let ne=ee?[...new Set([`none`,h])]:[h],S=Math.max(0,...ne.map(e=>Number(t.units?.[e]||0))),re=Math.max(0,...ne.map(e=>Number(t.units?.[e]||0)*(c&1<<o.indexOf(e)?2:1)));u&&(re=Math.max(re,S+f));let ie=Number(t.attrs?.[m]||0)*(a?2:1),w=y+f+re+ie,ae=w+v+x,T=Qe(d,y,re,ie,f),E=W(Math.max(0,d-(K(e.card)?Ie:0)),v),D=Math.floor(d*x/100),oe=Math.floor(d*b/100);return{rawCardPower:r,masterRankPower:s,canvasPower:l,basePower:d,totalPower:d+T+E+0+oe+D,areaPercent:ae,areaItemPercent:w,charRankBonus:v,unitBonus:re,attrBonus:ie,gateBonusPercent:x,furniturePercent:b,areaItemBonus:T,characterRankBonus:E,titleBonus:0,furnitureBonus:oe,gateBonus:D}}),m=e=>p.reduce((t,n)=>t+(n[e]||0),0),h=Math.max(0,Math.floor(Number(t.titlePower||0))),g=m(`totalPower`)+h,_=m(`basePower`);return{allSameAttr:a,allSameUnit:l,slotPowers:p,rawCardPower:m(`rawCardPower`),masterRankPower:m(`masterRankPower`),canvasPower:m(`canvasPower`),basePower:_,totalPower:g,areaItemBonus:m(`areaItemBonus`),characterRankBonus:m(`characterRankBonus`),titleBonus:h,furnitureBonus:m(`furnitureBonus`),gateBonus:m(`gateBonus`)}},nt=(e,t)=>{let n=He[e?.rarityKey]||He[``];if(!n.key)return{member:0,character:0,type:0,masterRank:0,total:0};let r=Math.max(0,Math.min(5,Number(e.masterRank)||0)),i=t?30:20,a={member:n.canPickup&&e.pickup?i:0,character:e.featured?25:0,type:e.typeMatched?n.typeBonus:0,masterRank:n.masterRankBonus[r]||0};return{...a,total:Object.values(a).reduce((e,t)=>e+t,0)}},rt=({value:e,options:t,onChange:n,prefix:r,suffix:i=``,hidePrefixOnMobile:a=!1,formatOption:o})=>{let[s,c]=(0,j.useState)(!1),l=(0,j.useRef)(null),u=e=>o?o(e):`${e}${i}`;return(0,j.useEffect)(()=>{if(!s)return;let e=e=>{l.current&&!l.current.contains(e.target)&&c(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[s]),(0,F.jsxs)(`div`,{className:`ebc-select`,ref:l,children:[(0,F.jsxs)(`button`,{type:`button`,className:`ebc-select-button ${s?`open`:``}`,onClick:()=>c(!s),children:[(0,F.jsx)(`span`,{className:`ebc-prefix-label ${a?`hide-on-mobile`:``}`,children:r}),(0,F.jsx)(`strong`,{children:u(e)})]}),s&&(0,F.jsx)(`div`,{className:`ebc-select-menu`,children:t.map(t=>(0,F.jsx)(`button`,{type:`button`,className:t===e?`selected`:``,onClick:()=>{n(t),c(!1)},children:u(t)},t))})]})},it=({value:e,options:t,onChange:n,prefix:r,hidePrefixOnMobile:i=!1})=>{let[a,o]=(0,j.useState)(!1),s=(0,j.useRef)(null),c=t.find(t=>t.key===e)||t[0];return(0,j.useEffect)(()=>{if(!a)return;let e=e=>{s.current&&!s.current.contains(e.target)&&o(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[a]),(0,F.jsxs)(`div`,{className:`ebc-select`,ref:s,children:[(0,F.jsxs)(`button`,{type:`button`,className:`ebc-select-button ${a?`open`:``}`,onClick:()=>o(!a),children:[(0,F.jsx)(`span`,{className:`ebc-prefix-label ${i?`hide-on-mobile`:``}`,children:r}),(0,F.jsx)(`strong`,{children:c.label})]}),a&&(0,F.jsx)(`div`,{className:`ebc-select-menu`,children:t.map(t=>(0,F.jsx)(`button`,{type:`button`,className:t.key===e?`selected`:``,onClick:()=>{n(t.key),o(!1)},children:t.label},t.key||`empty`))})]})},at=({rarityKey:e,masterRank:t=0,skillLevel:n=1,skillText:r=null,emptyText:i=`비움`,previewCharId:a=21,card:o=null,isAwakened:s=!0})=>{let c=(e=>e===`birthday`?4:e===`rarity3`?3:e===`rarity2`?2:e===`rarity1`?1:e?4:0)(e),l=e===`birthday`,u=l?`cardFrame_bd.webp`:c>0&&c<=2?`frame_2star.webp`:`Frame.webp`,d=(o?Number(o.rarity)>2&&o.type!==`Birthday`&&o.type!==`Anniversary`:e===`rarity4`||e===`rarity3`)&&s,f=d?`after_training`:`normal`,p=l?`rairity_birth.webp`:d?`afterstar.webp`:`star_normal.webp`,m=Math.max(0,Math.min(5,Number(t)||0)),h=o?(o.attr||o.cardAttr||o.attribute||`pure`).toLowerCase():null,g=o?k(xe,`face/res0${String(ce(o)||1).padStart(2,`0`)}_no${String(o?.card_image_id||`001`).padStart(3,`0`)}_${f}.webp`):k(xe,`face/res0${String(a).padStart(2,`0`)}_no001_${f}.webp`);return(0,F.jsxs)(`div`,{className:`ebc-preview-card ${e?``:`empty`}`,children:[(0,F.jsx)(`img`,{className:`ebc-card-face`,src:g,alt:``,onError:e=>{e.target.src=k(xe,`face/res021_no001_normal.webp`)}}),(0,F.jsx)(`img`,{className:`ebc-card-frame`,src:`/assets/card_style/${u}`,alt:``}),h&&(0,F.jsx)(`img`,{className:`ebc-card-attribute`,src:`/assets/card_style/${h}.webp`,alt:``}),e&&l&&(0,F.jsx)(`img`,{className:`ebc-card-birthday`,src:`/assets/card_style/${p}`,alt:``}),e&&!l&&(0,F.jsx)(`div`,{className:`ebc-card-stars`,children:Array.from({length:c},(e,t)=>(0,F.jsx)(`img`,{src:`/assets/card_style/${p}`,alt:``},t))}),(0,F.jsx)(`div`,{className:`ebc-skill-badge`,children:e?r||`SLV.${n}`:i}),m>0&&(0,F.jsx)(`img`,{className:`ebc-mastery-badge`,src:`/assets/card_style/masterRank_S_${m}.webp`,alt:``})]})},ot=(e=We(`ebc_active_area_preset`))=>{if(e===1&&se(`ebc_area_preset_1`)===null){let e=se(`ebc_area_settings`);e&&D(`ebc_area_preset_1`,e)}let t=T(`ebc_area_preset_${e}`,null,R);return u(t?et(t):$e(),T(`sekai-game-area-effects-v1`,{}).effects||{})},st=(e,t,n)=>{let r=[];try{Object.values(e.units||{}).every(e=>Number(e)===I.unit)&&r.push(n(`support.unit`)||`유닛`),Object.values(e.attrs||{}).every(e=>Number(e)===I.attr)&&r.push(n(`support.type`)||`타입`),Object.values(e.gates||{}).every(e=>Number(e)===I.gate)&&r.push(n(`support.gate`)||`게이트`);let i=!0,a=!0;for(let t of Object.keys(e.characters||{})){let n=e.characters[t]||{};Number(n.area)-(Number(e.multiUnit)||0)!==I.characterArea&&(i=!1),Number(n.nui)!==I.characterNui&&(a=!1)}i&&r.push(n(`support.character`)||`캐릭터`),a&&r.push(n(`support.nui`)||`누이`),f(e,t,I.characterRank)||r.push(n(`support.character_rank_short`))}catch(e){console.error(e)}return r},ct=({isOpen:e,onClose:t,onApply:n,onLoadSkill:r,initialRecommendation:s=!1})=>{let{t:c,language:u}=i(),[f,p]=(0,j.useState)(()=>T(`ebc_is_world_link`,!1,e=>typeof e==`boolean`)),[m,h]=(0,j.useState)(()=>O(se(`ebc_support_bonus`))),[g,_]=(0,j.useState)(()=>({detailOpen:!1,characters:{},characterOrder:[],...T(`ebc_event_override`,ye,R)})),[b,x]=(0,j.useState)(ye),[ne,S]=(0,j.useState)(!1),ie=(0,j.useRef)(null),C=(0,j.useRef)(!1),[w,ae]=(0,j.useState)(()=>T(`ebc_is_manual_event`,!1,e=>typeof e==`boolean`)),[oe,fe]=(0,j.useState)(()=>We(`ebc_active_preset`)),[ge,xe]=(0,j.useState)(()=>{let e=We(`ebc_active_area_preset`);return se(`ebc_area_snapshot_${e}`)!==null}),[A,Ce]=(0,j.useState)(()=>{let e=We(`ebc_active_preset`);return Ue(T(`ebc_preset_${e}`,null,Array.isArray)||T(`ebc_main_deck_slots`,null,Array.isArray))}),[M,we]=(0,j.useState)(()=>We(`ebc_active_area_preset`)),[N,P]=(0,j.useState)(()=>ot()),[Te,Ee]=(0,j.useState)(!1),[Ne,Pe]=(0,j.useState)(!1),[Fe,Ie]=(0,j.useState)(!1),[Re,Ge]=(0,j.useState)(!1),[V,H]=(0,j.useState)(!1),[Xe,Ze]=(0,j.useState)(``),[U,W]=(0,j.useState)(!1),[G,Qe]=(0,j.useState)({unit:I.unit,gate:I.gate,attr:I.attr,characterArea:I.characterArea,characterRank:I.characterRank,characterNui:I.characterNui}),[K,ct]=(0,j.useState)(null),[q,lt]=(0,j.useState)(`area`),[ut,dt]=(0,j.useState)(()=>{let e=se(`ebc_last_char_id`);return e?Number(e):21}),[J,ft]=(0,j.useState)([]),[pt,mt]=(0,j.useState)(!1),[ht,gt]=(0,j.useState)(``),[_t,vt]=(0,j.useState)(()=>T(`sekai-card-collection-v1`,{}).ownedCardIds||[]),[yt,bt]=(0,j.useState)(null);(0,j.useEffect)(()=>{e||bt(null)},[e]),(0,j.useEffect)(()=>{e&&window.dispatchEvent(new CustomEvent(a))},[e]),(0,j.useEffect)(()=>{if(!e)return;let t=e=>{vt(T(`sekai-card-collection-v1`,{}).ownedCardIds||[]),e?.detail?.kind===`card`&&!w&&Ce(Ue(T(`ebc_preset_${oe}`,T(`ebc_main_deck_slots`,[])))),[`furniture`,`area`,`character`].includes(e?.detail?.kind)&&P(et(T(`ebc_area_preset_${M}`,{})))};return t(),window.addEventListener(te,t),()=>window.removeEventListener(te,t)},[e,w,oe,M]);let xt=v({isOpen:e,onClose:t}),Y=v({isOpen:Te,onClose:()=>Ee(!1)}),St=v({isOpen:U,onClose:()=>W(!1)}),Ct=v({isOpen:Re,onClose:()=>Ge(!1)}),wt=v({isOpen:V,onClose:()=>H(!1)}),Tt=v({isOpen:Ne,onClose:()=>Pe(!1)});(0,j.useEffect)(()=>{let t=!0;return e&&J.length===0&&(mt(!0),fetch(je,{cache:`reload`}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{t&&(ft(Array.isArray(e)?e:[]),mt(!1))}).catch(e=>{console.error(`Failed to load cards:`,e),t&&(gt(`카드 목록을 불러오지 못했습니다.`),mt(!1))})),()=>{t=!1}},[e,J.length]),(0,j.useEffect)(()=>{if(!J.length)return;let e=new Map(J.map(e=>[Number(e.id),e]));Ce(t=>{let n=!1,r=t.map(t=>{if(!t.card?.id)return t;let r=e.get(Number(t.card.id));return!r||!(Le.some(e=>t.card[e]!==r[e])||t.card.power!==r.power)?t:(n=!0,{...t,card:{...t.card,...r}})});return n?r:t})},[J]);let[X,Et]=(0,j.useState)(null);(0,j.useEffect)(()=>{let e=!0;return fetch(k(Se,`mysekaiFixtures.json`),{cache:`no-cache`}).then(e=>e.json()).then(t=>{if(!e)return;let n={1:`一歌`,2:`咲希`,3:`穂波`,4:`志歩`,5:`みのり`,6:`遥`,7:`愛莉`,8:`雫`,9:`こはね`,10:`杏`,11:`彰人`,12:`冬弥`,13:`司`,14:`えむ`,15:`寧々`,16:`類`,17:`奏`,18:`まふゆ`,19:`絵名`,20:`瑞希`,21:`ミク`,22:`リン`,23:`レン`,24:`ルカ`,25:`MEIKO`,26:`KAITO`},r=999,i=-1;for(let e=1;e<=26;e++){let a=n[e];if(!a)continue;let o=t.filter(e=>e.name&&e.name.includes(`${a}のぬいぐるみ`)).length,s=Math.floor(o/3);s<r&&(r=s),s>i&&(i=s)}r===999&&(r=0),i===-1&&(i=0),Et({min:r,max:i})}).catch(e=>console.warn(`Failed to fetch mysekaiFixtures.json`,e)),()=>{e=!1}},[]),(0,j.useEffect)(()=>{E(`ebc_is_world_link`,f)},[f]),(0,j.useEffect)(()=>{D(`ebc_support_bonus`,m)},[m]),(0,j.useEffect)(()=>{E(`ebc_main_deck_slots`,A),E(`ebc_preset_${oe}`,A)},[A,oe]),(0,j.useEffect)(()=>{E(`ebc_area_preset_${M}`,N)},[N,M]),(0,j.useEffect)(()=>{E(`ebc_is_manual_event`,w)},[w]),(0,j.useEffect)(()=>{E(`ebc_event_override`,g)},[g]),(0,j.useEffect)(()=>{if(e&&!w)return S(!1),pe(e=>{x(e);let t=ie.current||e;ie.current=null,_(t),p(t.attr===`wl`),S(!0)},e=>{console.warn(`Failed to auto load event override`,e),S(!0)})},[e,w]);let Dt=(0,j.useCallback)(e=>{_(t=>e===`mix`?{...t,unit:``,detailOpen:!0}:{...t,unit:e,detailOpen:!1,characters:{},characterOrder:[]})},[]),Ot=(0,j.useCallback)(e=>{_(t=>{let n={...t.characters||{}},r=[...t.characterOrder||[]].filter(t=>t!==e);if(n[e])delete n[e];else{if(r.length>=5){let e=r.shift();delete n[e]}n[e]=e>=21?`none`:me[e],r.push(e)}return{...t,characters:n,characterOrder:r}})},[]),kt=(0,j.useCallback)((e,t)=>{_(n=>({...n,characters:{...n.characters||{},[e]:t}}))},[]),At=(0,j.useCallback)(e=>{let t=le.find(t=>t.id===e);return t?t.name:String(e)},[]),jt=(e,t)=>{if(!e||!t)return{typeMatched:!1,featured:!1};let n=e.attr||e.cardAttr||e.attribute||``,r=ce(e),i=t.attr===`wl`,a={"Leo/need":`light_sound`,"MORE MORE JUMP！":`idol`,"Vivid BAD SQUAD":`street`,"ワンダーランズ×ショウタイム":`theme_park`,"25時、ナイトコードで。":`school_refusal`},o=e.supportUnit||e.support_unit||``;a[o]&&(o=a[o]),!o&&r>=21&&(o=a[e.unit]||e.unit||`none`);let s=!1;if(t.characters&&Object.keys(t.characters).length>0){if(t.characters[r]){if(r>=21){let e=t.characters[r];s=e===`none`?o===`none`||!o:o===e||o===`none`||!o}else s=!0}else s=!1}else t.unit&&(s=r>=21?o===t.unit||o===`none`:me[r]===t.unit);return{typeMatched:i?!1:t.attr?n===t.attr:!1,featured:s}},Mt=(0,j.useCallback)((e,t)=>!e||!t||(Number(e.rarity)||0)!==4||w&&(t.attr||t.unit)?!1:(t.eventCardIds||[]).includes(Number(e.id)),[w]);(0,j.useEffect)(()=>{e&&g&&Ce(e=>e.map(e=>{if(!e.card)return e;let t=jt(e.card,g),n=Mt(e.card,g);return e.typeMatched===t.typeMatched&&e.featured===t.featured&&e.pickup===n?e:{...e,typeMatched:t.typeMatched,featured:t.featured,pickup:n}}))},[g,e,w,Mt]);let Z=(e,t)=>{Ce(n=>{let r=[...n],i=r[e],a={...i,...t};if(!w&&i.card&&(`skillLevel`in t||`masterRank`in t)){let e=`ebc_card_stats_${i.card.id}`,n=T(e,{},R);`skillLevel`in t&&(n.skillLevel=t.skillLevel),`masterRank`in t&&(n.masterRank=t.masterRank),E(e,n)}if(Object.prototype.hasOwnProperty.call(t,`rarityKey`)){let e=!!t.rarityKey;if(a.masterRank=e?i.masterRank:0,t.card){let e=jt(t.card,g);if(a.typeMatched=e.typeMatched,a.featured=e.featured,a.pickup=Mt(t.card,g),!w){let e=`ebc_card_stats_${t.card.id}`,n=T(e,{},R);n.skillLevel!==void 0&&(a.skillLevel=n.skillLevel),n.masterRank!==void 0&&(a.masterRank=n.masterRank)}}else e?a.pickup=e&&t.rarityKey===`rarity4`?i.pickup:!1:(a.featured=!1,a.typeMatched=!1,a.pickup=!1)}return a.rarityKey!==`rarity4`&&(a.pickup=!1),r[e]=a,r})},Nt=(e,t)=>{P(e),o(e,t)},Pt=(e,t)=>{Nt({...N,units:{...N.units,[e]:z(t,20)}},[`unit:${Object.keys(d).find(t=>d[t]===e)}`])},Ft=(e,t)=>{P(n=>({...n,gates:{...n.gates,[e]:Ke(t,70)}}))},It=(e,t)=>{Nt({...N,attrs:{...N.attrs,[e]:z(t,20)}},[`attribute:${e}`])},Lt=e=>Nt(ee(N,z(e,20)),[`multiUnit`]),Rt=e=>{P(t=>({...t,titlePower:B(e)}))},zt=(e,t,n)=>{let r={area:40+(Number(N.multiUnit)||0),nui:10},i=t===`rank`?qe(n):z(n,r[t]||30),a={...N,characters:{...N.characters,[e]:{...N.characters?.[e],[t]:i}}};t===`rank`&&i!==``&&l(M),t===`area`?Nt(a,[`character:${e}`]):P(a)},Bt=e=>{let t=new Blob([e],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`area_settings.json`,document.body.appendChild(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),0)},Vt=e=>{if(e===M)return;let t=T(`ebc_area_preset_${e}`,null,R);P(t?et(t):$e()),we(e),D(`ebc_active_area_preset`,String(e))},Ht=()=>{l(M),Nt({...N,units:ze.reduce((e,t)=>({...e,[t.key]:G.unit}),{}),gates:ze.reduce((e,t)=>({...e,[t.key]:G.gate}),{}),attrs:Be.reduce((e,t)=>({...e,[t.key]:G.attr}),{}),characters:le.reduce((e,t)=>({...e,[t.id]:{...N.characters?.[t.id],area:G.characterArea,rank:G.characterRank,nui:G.characterNui}}),{})}),W(!1)},Ut=(0,j.useMemo)(()=>{if(f){let e=new Set;return A.map(t=>{let n=(t.card?.attr||t.card?.attribute||``).toLowerCase(),r=!!n&&!e.has(n);n&&e.add(n);let i={...t,typeMatched:t.rarityKey?r:!1};return{slot:i,rarityOption:He[t.rarityKey]||He[``],bonus:nt(i,f)}})}return A.map(e=>({slot:e,rarityOption:He[e.rarityKey]||He[``],bonus:nt(e,f)}))},[A,f]),Wt=(0,j.useMemo)(()=>Ut.reduce((e,t)=>e+t.bonus.total,0),[Ut])+(f&&Number(m)||0),Q=(0,j.useMemo)(()=>tt(A,N),[A,N]),$=(0,j.useMemo)(()=>st(N,M,c),[N,M,c]),Gt=(0,j.useCallback)(()=>{let e=T(y,{});if(!be(e)){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{type:`error`,duration:2400,message:c(`support.recommend_import_required`)}}));return}let t=!w&&g===b&&f===(b.attr===`wl`);bt({cards:J,collection:e,areaSettings:N,eventOverride:g,isWorldLink:f,supportBonus:m,missingInputs:$,eventControls:t?{}:_e(g,f)})},[J,N,g,b,w,f,m,$,c]);(0,j.useEffect)(()=>{e?s&&!C.current&&(w||ne||!be(T(`sekai-card-collection-v1`,{})))&&(C.current=!0,Gt()):C.current=!1},[e,s,w,ne,Gt]);let Kt=(e,t=J,n={})=>{let r=new Map(t.map(e=>[Number(e.id),e])),i=n.eventOverride||g;n.eventOverride&&(_(i),(w||!ne)&&(ie.current=i));let a=n.isWorldLink??f;p(a),a&&h(O(e.supportBonus)),ae(!1),Ce(Ue(e.members.map(e=>{let t=r.get(e.cardId),n=t?.type===`Birthday`||t?.type===`Anniversary`,a=jt(t,i);return{card:t,rarityKey:n?`birthday`:`rarity${Number(t?.rarity)}`,masterRank:e.masterRank,skillLevel:e.skillLevel,canvas:!0,typeMatched:a.typeMatched,featured:a.featured,pickup:Mt(t,i)}}))),bt(null)},qt=(0,j.useMemo)(()=>[{label:c(`support.base_power`)||`퍼포먼스`,value:Q.basePower||0},{label:c(`support.area_item_bonus`)||`에어리어 아이템보너스`,value:Q.areaItemBonus||0},{label:c(`support.character_rank_bonus`)||`캐릭터 랭크 보너스`,value:Q.characterRankBonus||0},{label:c(`support.title_bonus`)||`칭호 보너스`,value:Q.titleBonus||0},{label:c(`support.furniture_bonus`)||`가구 보너스`,value:Q.furnitureBonus||0},{label:c(`support.gate_bonus`)||`게이트 보너스`,value:Q.gateBonus||0}],[Q,c]),Jt=(0,j.useMemo)(()=>{if(w||!A.every(e=>e.card!=null))return null;let e=re(A).map(e=>e.skillValue);return e[0]+(e[1]+e[2]+e[3]+e[4])*.2},[A,w]);return e?(0,F.jsxs)(`div`,{className:`ebc-backdrop`,onMouseDown:e=>{e.target===e.currentTarget&&t()},children:[(0,F.jsxs)(`div`,{ref:xt,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-main-title`,tabIndex:-1,className:`ebc-modal ${u===`ja`?`lang-ja`:``}`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsxs)(`div`,{className:`ebc-header`,children:[(0,F.jsx)(`h2`,{id:`ebc-main-title`,children:c(`support.deck_simulator`)||`덱 시뮬레이터`}),(0,F.jsx)(j.Suspense,{fallback:null,children:(0,F.jsx)(Ae,{kind:`card`,className:`ebc-optimal-import`})}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-close-btn`,onClick:t,"aria-label":c(`support.close`)||`닫기`,children:`✕`})]}),(0,F.jsxs)(`div`,{className:`ebc-content`,children:[(0,F.jsxs)(`div`,{className:`ebc-config-panel`,children:[(0,F.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`24px`,flexWrap:`wrap`},children:[(0,F.jsxs)(`label`,{className:`ebc-checkbox-label`,style:{margin:0,fontWeight:`bold`,fontSize:`14px`,color:`#334155`,display:`flex`,alignItems:`center`},children:[(0,F.jsx)(`input`,{type:`checkbox`,checked:w,onChange:e=>ae(e.target.checked)}),(0,F.jsx)(`span`,{className:`ebc-checkbox-text`,style:{marginLeft:`8px`,lineHeight:`normal`,transform:`translateY(1px)`},children:c(`support.manual_input`)||`수동 입력`})]}),(0,F.jsxs)(`label`,{className:`ebc-checkbox-label`,style:{margin:0,fontWeight:`bold`,fontSize:`14px`,color:`#334155`,display:`flex`,alignItems:`center`},children:[(0,F.jsx)(`input`,{type:`checkbox`,checked:f,onChange:e=>p(e.target.checked)}),(0,F.jsx)(`span`,{className:`ebc-checkbox-text`,style:{marginLeft:`8px`,lineHeight:`normal`,transform:`translateY(1px)`},children:c(`support.world_link_mode`)})]}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-open-btn ${Te?`active`:``}`,onClick:()=>Ee(e=>!e),children:(0,F.jsx)(`span`,{children:c(`support.area_settings`)||`에어리어`})}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-open-btn ebc-recommend-trigger`,onClick:Gt,children:c(`support.recommend_deck`)})]}),(!w||f)&&(0,F.jsxs)(`div`,{className:`ebc-options-row`,children:[!w&&(()=>{let e=de.find(e=>e.key===b.attr)||null,t=b.unit?ve.find(e=>e.key===b.unit):b.isMix?{key:`mix`,label:c(`support.mix`)||`스까`}:null;return(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`12px`,flex:1,minWidth:`200px`},children:[(0,F.jsxs)(`div`,{style:{flex:1},children:[(0,F.jsx)(`div`,{style:{marginBottom:`4px`,fontSize:`11px`,fontWeight:`bold`,color:`#94a3b8`},children:c(`support.attribute`)||`속성`}),(0,F.jsx)(Oe,{value:g.attr,options:de,assetPath:`attributes`,iconOnly:!0,autoOption:e,onChange:e=>{_(t=>({...t,attr:e})),p(e===`wl`)}})]}),(0,F.jsxs)(`div`,{style:{flex:1},children:[(0,F.jsx)(`div`,{style:{marginBottom:`4px`,fontSize:`11px`,fontWeight:`bold`,color:`#94a3b8`},children:c(`support.unit`)||`유닛`}),(0,F.jsx)(Oe,{value:g.detailOpen?`mix`:g.unit,options:ve,assetPath:`units`,iconOnly:!0,extraOptions:[{key:`mix`,label:c(`support.mix`)||`스까`}],autoOption:t,onChange:Dt})]})]})})(),!w&&g.detailOpen&&(0,F.jsxs)(`div`,{className:`ebc-mix-panel`,children:[(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`8px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`11px`,fontWeight:`bold`,color:`#64748b`},children:c(`support.select_mix_characters`)||`스까 인선 선택`}),(0,F.jsxs)(`span`,{style:{fontSize:`11px`,fontWeight:`bold`,color:`#6366f1`},children:[(g.characterOrder||[]).length,`/5`]})]}),(0,F.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(13, 1fr)`,gap:`3px`,marginBottom:`8px`},children:Array.from({length:26},(e,t)=>{let n=t+1,r=!!g.characters?.[n];return(0,F.jsx)(`button`,{type:`button`,onClick:()=>Ot(n),title:At(n),style:{width:`100%`,aspectRatio:`1/1`,borderRadius:`50%`,border:r?`2px solid #6366f1`:`1px solid #cbd5e1`,overflow:`hidden`,padding:0,background:`#fff`,cursor:`pointer`,transform:r?`scale(1.1)`:`scale(1)`,opacity:r?1:.6,transition:`all 0.1s`,boxSizing:`border-box`},children:(0,F.jsx)(`img`,{src:`/assets/characters/${String(n).padStart(2,`0`)}.webp`,alt:At(n),style:{width:`100%`,height:`100%`,objectFit:`cover`,display:`block`},onError:e=>{e.currentTarget.style.display=`none`}})},n)})}),he.some(e=>g.characters?.[e])&&(0,F.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`4px`,paddingTop:`6px`,borderTop:`1px solid #e2e8f0`},children:he.filter(e=>g.characters?.[e]).map(e=>(0,F.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`4px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`10px`,fontWeight:`bold`,color:`#64748b`,minWidth:`28px`},children:At(e)}),(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`3px`,flexWrap:`wrap`},children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>kt(e,`none`),title:c(`support.virtual_singer`)||`버추얼싱어`,style:{height:`20px`,padding:`0 5px`,border:g.characters?.[e]===`none`?`2px solid #6366f1`:`1px solid #cbd5e1`,borderRadius:`4px`,background:g.characters?.[e]===`none`?`#e0e7ff`:`#fff`,cursor:`pointer`,fontSize:`9px`,fontWeight:`bold`,color:g.characters?.[e]===`none`?`#4f46e5`:`#64748b`,whiteSpace:`nowrap`},children:`VS`},`none`),ve.map(t=>(0,F.jsx)(`button`,{type:`button`,onClick:()=>kt(e,t.key),title:t.label,style:{width:`24px`,height:`20px`,border:g.characters?.[e]===t.key?`2px solid #6366f1`:`1px solid #cbd5e1`,borderRadius:`4px`,background:`#fff`,padding:`1px`,cursor:`pointer`},children:(0,F.jsx)(`img`,{src:`/assets/event/units/${t.file}`,alt:t.label,style:{width:`100%`,height:`100%`,objectFit:`contain`}})},t.key))]})]},e))})]}),f&&(0,F.jsx)(De,{value:m,onChange:h})]})]}),(0,F.jsxs)(`div`,{className:`ebc-deck-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-deck-header`,children:[(0,F.jsxs)(`span`,{className:`ebc-power-total`,children:[(0,F.jsx)(`span`,{children:c(`support.total_power`)||`종합력`}),(0,F.jsx)(`strong`,{children:Q.totalPower.toLocaleString()}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-power-info-btn`,onClick:()=>Pe(!0),"aria-label":c(`support.power_detail`)||`종합력 상세`,children:`i`})]}),$.length>0&&(0,F.jsxs)(`div`,{className:`ebc-missing-inputs`,role:`status`,"aria-label":c(`support.missing_inputs`),children:[$.map(e=>(0,F.jsx)(`span`,{children:e},e)),(0,F.jsx)(`span`,{children:c(`support.missing_inputs`)})]})]}),(0,F.jsx)(`div`,{className:`ebc-deck-grid`,children:Ut.map(({slot:e,bonus:t},n)=>{let r=!!e.rarityKey,i=He[e.rarityKey]?.canPickup,a=Q.slotPowers[n]||{};return(0,F.jsxs)(`div`,{className:`ebc-slot`,children:[(0,F.jsxs)(`div`,{className:`ebc-slot-header`,children:[(0,F.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`4px`},children:(e.card?Number(e.card.rarity)>2&&e.card.type!==`Birthday`&&e.card.type!==`Anniversary`:e.rarityKey===`rarity4`||e.rarityKey===`rarity3`)?(0,F.jsx)(`button`,{type:`button`,className:`ebc-awaken-toggle ${e.isAwakened?`awakened`:`unawakened`}`,onClick:t=>{t.stopPropagation(),Z(n,{isAwakened:!e.isAwakened})},title:e.isAwakened?c(`support.awakened`):c(`support.unawakened`),children:e.isAwakened?c(`support.awakened`):c(`support.unawakened`)}):null}),(0,F.jsxs)(`strong`,{children:[`+`,t.total,`%`]})]}),(0,F.jsx)(`div`,{className:`ebc-preview-wrap`,style:{cursor:`pointer`,transition:`transform 0.1s`},onClick:()=>{let t=e.card;dt(t&&ce(t)||21),ct(n),Ie(!0)},onMouseOver:e=>e.currentTarget.style.transform=`scale(1.05)`,onMouseOut:e=>e.currentTarget.style.transform=`scale(1)`,title:c(`support.select_card`)||`카드 선택`,children:(0,F.jsx)(at,{rarityKey:e.rarityKey,masterRank:e.masterRank,skillLevel:e.skillLevel||1,skillText:String(e.skillLevel||1),emptyText:c(`support.empty`),card:e.card,isAwakened:e.isAwakened!==!1})}),(0,F.jsxs)(`div`,{className:`ebc-slot-power-row`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-canvas-toggle ${e.canvas?`active`:``}`,onClick:()=>Z(n,{canvas:!e.canvas}),disabled:!e.card,style:u===`ja`?{fontSize:`10px`,letterSpacing:`-0.5px`}:void 0,children:c(`support.canvas`)||`캔버스`}),(0,F.jsx)(`span`,{className:`ebc-slot-base-power`,title:`${c(`support.after_area_bonus`)||`에어리어 적용 후`} ${(a.totalPower||0).toLocaleString()} (${Je(a.areaPercent||0)}%)`,children:(0,F.jsx)(`strong`,{children:(a.basePower||0).toLocaleString()})})]}),(0,F.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr 1fr`,gap:`4px`,textAlign:`center`,fontSize:`10px`,fontWeight:`bold`,color:`#64748b`,marginBottom:`2px`,padding:`0 2px`},children:[(0,F.jsx)(`span`,{children:c(`support.rarity`)||`레어`}),(0,F.jsx)(`span`,{children:c(`support.skill`)||`스킬`}),(0,F.jsx)(`span`,{children:c(`support.master_rank`)||`마랭`})]}),(0,F.jsxs)(`div`,{className:`ebc-control-grid`,style:{gridTemplateColumns:`1fr 1fr 1fr`},children:[(0,F.jsx)(it,{value:e.rarityKey,options:Ve,onChange:e=>Z(n,{rarityKey:e})}),(0,F.jsx)(rt,{value:e.skillLevel||1,options:[1,2,3,4],onChange:e=>Z(n,{skillLevel:e})}),(0,F.jsx)(rt,{value:e.masterRank,options:Me,onChange:e=>Z(n,{masterRank:e})})]}),(0,F.jsxs)(`div`,{className:`ebc-toggle-row`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-toggle ${e.typeMatched?`active`:``} ${f?`wl-auto`:``}`,onClick:()=>!f&&Z(n,{typeMatched:!e.typeMatched}),disabled:!r||f,title:f?c(`support.wl_auto_apply`):``,children:c(`support.type`)}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-toggle ${e.featured?`active`:``}`,onClick:()=>Z(n,{featured:!e.featured}),disabled:!r,children:c(`support.featured`)}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-toggle ${e.pickup?`active`:``}`,onClick:()=>Z(n,{pickup:!e.pickup}),disabled:!i,children:c(`support.pickup`)})]}),(0,F.jsxs)(`div`,{className:`ebc-breakdown`,children:[(0,F.jsxs)(`span`,{children:[c(`support.member`),` `,(0,F.jsxs)(`b`,{children:[t.member,`%`]})]}),(0,F.jsxs)(`span`,{children:[c(`support.featured`),` `,(0,F.jsxs)(`b`,{children:[t.character,`%`]})]}),(0,F.jsxs)(`span`,{children:[c(`support.type`),` `,(0,F.jsxs)(`b`,{children:[t.type,`%`]})]}),(0,F.jsxs)(`span`,{children:[c(`support.master_rank`),` `,(0,F.jsxs)(`b`,{children:[t.masterRank,`%`]})]})]})]},n)})}),(0,F.jsx)(`div`,{style:{display:`flex`,justifyContent:`flex-end`,marginBottom:`8px`},children:(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-reset`,style:{background:`#8b5cf6`,color:`#fff`,border:`none`,padding:`6px 12px`,borderRadius:`6px`,fontSize:`13px`,fontWeight:`600`},onClick:()=>{r&&(r(A),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:c(`app.toast.skill_loaded`)||`스킬 정보가 입력되었습니다.`})))},children:c(`support.load_skill`)||`스킬 불러오기`})}),(0,F.jsxs)(`div`,{className:`ebc-deck-toolbar`,children:[(0,F.jsx)(`div`,{className:`ebc-toolbar-presets`,children:[1,2,3].map(e=>(0,F.jsxs)(`button`,{type:`button`,className:`ebc-preset-load-btn ${oe===e?`active`:``}`,onClick:()=>{let t=Ue(T(`ebc_preset_${e}`,null,Array.isArray));fe(e),D(`ebc_active_preset`,String(e)),Ce(t)},title:`${c(`support.preset`)||`프리셋`} ${e}`,children:[`P`,e]},e))}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-reset`,onClick:()=>{window.confirm(c(`support.reset_confirm`)||`현재 설정한 덱을 모두 초기화하시겠습니까?`)&&Ce(L())},children:c(`support.reset`)||`리셋`})]})]})]}),(0,F.jsxs)(`div`,{className:`ebc-footer-wrapper`,children:[f&&(0,F.jsx)(`div`,{className:`ebc-footer-info`,children:c(`support.world_link_mode_desc`)}),(0,F.jsxs)(`div`,{className:`ebc-footer`,children:[(0,F.jsxs)(`div`,{className:`ebc-footer-total`,children:[c(`support.final_event_bonus`),` `,(0,F.jsxs)(`strong`,{children:[Wt.toFixed(1),`%`]}),Jt!==null&&(0,F.jsxs)(`span`,{style:{marginLeft:`12px`,fontSize:`13px`,color:`#64748b`},children:[c(`internal.effective_value`)||`실효치`,`: `,(0,F.jsxs)(`strong`,{children:[Jt.toFixed(1),`%`]})]})]}),(0,F.jsxs)(`div`,{className:`ebc-footer-actions`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-cancel`,onClick:t,children:c(`rank.cancel`)||`취소`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-apply`,style:{background:`#0ea5e9`},onClick:()=>n(Wt,Q.totalPower||null),children:c(`support.apply`)||`적용`})]})]})]})]}),Te&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&Ee(!1)},children:(0,F.jsxs)(`div`,{ref:Y,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-area-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>Ee(!1),"aria-label":c(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-floating-head`,children:[(0,F.jsx)(`h3`,{id:`ebc-area-title`,children:c(`support.area_settings`)||`에어리어`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-totals`,style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`6px`},children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>W(!0),className:`ebc-btn-batch`,children:c(`support.batch_apply`)||`일괄적용`}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>Ge(!0),className:`ebc-btn-save`,children:c(`app.save`)||`저장`}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>{Ze(``),H(!0)},className:`ebc-btn-load`,children:c(`app.load`)||`불러오기`})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`6px`},children:[(0,F.jsx)(`div`,{className:`ebc-toolbar-presets`,style:{margin:0},children:[1,2,3].map(e=>(0,F.jsxs)(`button`,{type:`button`,className:`ebc-preset-load-btn ${M===e?`active`:``}`,onClick:()=>{Vt(e),xe(se(`ebc_area_snapshot_${e}`)!==null)},title:`${c(`support.area_preset`)||`에어리어 프리셋`} ${e}`,children:[`P`,e]},e))}),(0,F.jsxs)(`div`,{className:`ebc-toolbar-snapshot mobile-only`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-save-btn`,onClick:()=>{let e=E(`ebc_area_snapshot_${M}`,N);xe(e),e&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:`P${M} ${c(`support.snapshot_saved`)||`임시저장 완료`}`}))},children:c(`support.snapshot_save`)||`임시저장`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-load-btn ${ge?``:`disabled`}`,disabled:!ge,onClick:()=>{let e=T(`ebc_area_snapshot_${M}`,null,R);e&&Nt(et(e))},children:c(`support.snapshot_load`)||`불러오기`})]})]})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-end`},children:[(0,F.jsxs)(`div`,{className:`ebc-title-power-editor`,children:[(0,F.jsx)(`span`,{children:c(`support.title_bonus`)||`칭호 보너스`}),(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,step:`1`,value:N.titlePower??``,onChange:e=>Rt(e.target.value),onFocus:e=>e.target.select(),"aria-label":`${c(`support.title_bonus`)} ${c(`support.total_power`)}`}),(0,F.jsx)(`b`,{children:c(`support.total_power`)||`종합력`})]})]}),(0,F.jsxs)(`div`,{className:`ebc-toolbar-snapshot pc-only`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-save-btn`,onClick:()=>{let e=E(`ebc_area_snapshot_${M}`,N);xe(e),e&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:`P${M} ${c(`support.snapshot_saved`)||`임시저장 완료`}`}))},children:c(`support.snapshot_save`)||`임시저장`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-load-btn ${ge?``:`disabled`}`,disabled:!ge,onClick:()=>{let e=T(`ebc_area_snapshot_${M}`,null,R);e&&Nt(et(e))},children:c(`support.snapshot_load`)||`불러오기`})]})]})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,children:[(0,F.jsx)(`span`,{children:c(`support.unit_effect`)||`유닛 효과`}),Q.allSameUnit&&(0,F.jsx)(`strong`,{children:`×2`})]}),(0,F.jsxs)(`div`,{className:`ebc-area-unit-header`,children:[(0,F.jsx)(`span`,{}),(0,F.jsx)(`span`,{children:c(`support.area`)||`에어리어`}),(0,F.jsx)(`span`,{children:c(`support.gate`)||`게이트`})]}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid units`,children:ze.map(e=>(0,F.jsxs)(`label`,{className:`ebc-area-game-pill`,children:[(0,F.jsx)(`span`,{className:`ebc-area-pill-media`,children:(0,F.jsx)(`img`,{src:`/assets/event/units/${e.file}`,alt:e.label})}),(0,F.jsxs)(`span`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`20`,step:`0.1`,value:N.units?.[e.key]??``,onChange:t=>Pt(e.key,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.label} ${c(`support.unit_effect`)||`유닛 효과`}`}),(0,F.jsx)(`b`,{children:`%`})]}),(0,F.jsxs)(`span`,{className:`ebc-area-pill-input gate`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`70`,step:`1`,value:N.gates?.[e.key]??``,onChange:t=>Ft(e.key,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.label} ${c(`support.gate`)||`게이트`}`}),(0,F.jsx)(`b`,{children:`Lv`})]})]},e.key))})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsx)(`div`,{className:`ebc-area-game-title`,children:(0,F.jsx)(`span`,{children:c(`support.multi_unit_effect`)})}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input`,style:{maxWidth:180},children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`20`,step:`0.1`,value:N.multiUnit??0,"aria-label":c(`support.multi_unit_effect`),onChange:e=>Lt(e.target.value),onFocus:e=>e.target.select()}),(0,F.jsx)(`b`,{children:`%`})]})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,children:[(0,F.jsx)(`span`,{children:c(`support.type_effect`)||`타입 효과`}),Q.allSameAttr&&(0,F.jsx)(`strong`,{children:`×2`})]}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid attrs`,children:Be.map(e=>(0,F.jsxs)(`label`,{className:`ebc-area-game-pill attr`,children:[(0,F.jsx)(`span`,{className:`ebc-area-pill-media icon`,children:(0,F.jsx)(`img`,{src:`/assets/event/attributes/${e.file}`,alt:e.label})}),(0,F.jsxs)(`span`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`20`,step:`0.1`,value:N.attrs?.[e.key]??``,onChange:t=>It(e.key,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.label} ${c(`support.type_effect`)||`타입 효과`}`}),(0,F.jsx)(`b`,{children:`%`})]})]},e.key))})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,style:{display:`flex`,flexDirection:`column`,gap:`8px`,alignItems:`stretch`},children:[$.length>0&&(0,F.jsxs)(`div`,{className:`mobile-only`,style:{textAlign:`left`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:c(`support.input_prompt`)||` 정보를 입력하세요`})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,alignItems:`center`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`area`?`active`:``}`,onClick:()=>lt(`area`),children:c(`support.area`)||`에어리어`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`nui`?`active`:``}`,onClick:()=>lt(`nui`),children:c(`support.nui`)||`누이`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`rank`?`active`:``}`,onClick:()=>lt(`rank`),children:c(`support.character_rank_short`)||`캐랭`}),$.length>0&&(0,F.jsxs)(`div`,{className:`pc-only`,style:{marginLeft:`4px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:c(`support.input_prompt`)||` 정보를 입력하세요`})]})]}),(0,F.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`},children:X&&(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#6366f1`,fontWeight:`bold`},children:X.min===X.max?(c(`support.current_nui_single`)||`현재 누이 {{val}}세트`).replace(`{{val}}`,X.min):(c(`support.current_nui`)||`현재 누이 {{min}}~{{max}}세트`).replace(`{{min}}`,X.min).replace(`{{max}}`,X.max)})})]})]}),(0,F.jsx)(`div`,{className:`ebc-area-character-grid`,children:le.map(e=>{let t=N.characters?.[e.id]||{};return(0,F.jsxs)(`div`,{className:`ebc-area-character-pill`,children:[(0,F.jsx)(`div`,{className:`ebc-area-character-face`,children:(0,F.jsx)(`img`,{src:`/assets/stamps/${String(e.id).padStart(2,`0`)}.webp`,alt:e.name})}),(0,F.jsxs)(`div`,{className:`ebc-area-character-fields`,children:[q===`area`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:c(`support.area`)||`에어리어`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:40+(Number(N.multiUnit)||0),step:`0.1`,value:t.area??``,onChange:t=>zt(e.id,`area`,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.name} ${c(`support.area`)||`에어리어`}`}),(0,F.jsx)(`b`,{children:`%`})]})]}),q===`rank`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:c(`support.character_rank_short`)||`캐랭`}),(0,F.jsx)(`input`,{type:`text`,inputMode:`numeric`,value:Ye(t.rank),onChange:t=>zt(e.id,`rank`,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.name} ${c(`support.character_rank_short`)||`캐랭`}`})]}),q===`nui`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:c(`support.nui`)||`누이`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`10`,step:`0.1`,value:t.nui??``,onChange:t=>zt(e.id,`nui`,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.name} ${c(`support.nui`)||`누이`}`}),(0,F.jsx)(`b`,{children:`%`})]})]})]})]},e.id)})})]})]}),(0,F.jsx)(`div`,{className:`ebc-area-floating-footer`,children:(0,F.jsx)(`button`,{type:`button`,onClick:()=>Ee(!1),children:c(`support.close`)||`닫기`})})]})}),U&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&W(!1)},children:(0,F.jsxs)(`div`,{ref:St,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-batch-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>W(!1),"aria-label":c(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,children:[(0,F.jsx)(`div`,{className:`ebc-area-floating-head`,children:(0,F.jsx)(`h3`,{id:`ebc-batch-title`,children:c(`support.batch_apply`)||`일괄 적용`})}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-body`,children:[(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsx)(`div`,{className:`ebc-area-game-title`,children:(0,F.jsx)(`span`,{children:c(`support.unit_gate_effect`)||`유닛 / 게이트 효과`})}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid units`,style:{gridTemplateColumns:`1fr`},children:(0,F.jsxs)(`div`,{className:`ebc-area-game-pill unit`,children:[(0,F.jsx)(`div`,{className:`ebc-area-pill-media`,children:(0,F.jsx)(`img`,{src:`/assets/event/units/Lnlogo.webp`,alt:`Leo/need`})}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`30`,step:`0.1`,value:G.unit??``,onChange:e=>Qe(t=>({...t,unit:z(e.target.value,30)}))}),(0,F.jsx)(`b`,{children:`%`})]}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input gate`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`70`,step:`1`,value:G.gate??``,"aria-label":c(`support.gate`),onChange:e=>Qe(t=>({...t,gate:Ke(e.target.value,70)}))}),(0,F.jsx)(`b`,{children:`LV`})]})]})})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsx)(`div`,{className:`ebc-area-game-title`,children:(0,F.jsx)(`span`,{children:`타입 효과`})}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid attrs`,style:{gridTemplateColumns:`1fr`},children:(0,F.jsxs)(`div`,{className:`ebc-area-game-pill attr`,children:[(0,F.jsx)(`div`,{className:`ebc-area-pill-media`,children:(0,F.jsx)(`img`,{src:`/assets/event/attributes/cool.webp`,alt:`Cool`})}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`30`,step:`0.1`,value:G.attr??``,onChange:e=>Qe(t=>({...t,attr:z(e.target.value,30)}))}),(0,F.jsx)(`b`,{children:`%`})]})]})})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,style:{display:`flex`,flexDirection:`column`,gap:`8px`,alignItems:`stretch`},children:[$.length>0&&(0,F.jsxs)(`div`,{className:`mobile-only`,style:{textAlign:`left`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:c(`support.input_prompt`)||` 정보를 입력하세요`})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,alignItems:`center`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`area`?`active`:``}`,onClick:()=>lt(`area`),children:c(`support.area`)||`에어리어`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`nui`?`active`:``}`,onClick:()=>lt(`nui`),children:c(`support.nui`)||`누이`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`rank`?`active`:``}`,onClick:()=>lt(`rank`),children:c(`support.character_rank_short`)||`캐랭`}),$.length>0&&(0,F.jsxs)(`div`,{className:`pc-only`,style:{marginLeft:`4px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:c(`support.input_prompt`)||` 정보를 입력하세요`})]})]}),(0,F.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`},children:X&&(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#6366f1`,fontWeight:`bold`},children:X.min===X.max?(c(`support.current_nui_single`)||`현재 누이 {{val}}세트`).replace(`{{val}}`,X.min):(c(`support.current_nui`)||`현재 누이 {{min}}~{{max}}세트`).replace(`{{min}}`,X.min).replace(`{{max}}`,X.max)})})]})]}),(0,F.jsx)(`div`,{className:`ebc-area-character-grid`,style:{gridTemplateColumns:`1fr`},children:(0,F.jsxs)(`div`,{className:`ebc-area-character-pill`,children:[(0,F.jsx)(`div`,{className:`ebc-area-character-face`,children:(0,F.jsx)(`img`,{src:`/assets/stamps/01.webp`,alt:`Miku`})}),(0,F.jsxs)(`div`,{className:`ebc-area-character-fields`,children:[q===`area`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:c(`support.area`)||`에어리어`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:40+(Number(N.multiUnit)||0),step:`0.1`,value:G.characterArea??``,onChange:e=>Qe(t=>({...t,characterArea:z(e.target.value,40+(Number(N.multiUnit)||0))}))}),(0,F.jsx)(`b`,{children:`%`})]})]}),q===`rank`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:c(`support.character_rank_short`)||`캐랭`}),(0,F.jsx)(`input`,{type:`text`,inputMode:`numeric`,value:Ye(G.characterRank),onChange:e=>Qe(t=>({...t,characterRank:qe(e.target.value)}))})]}),q===`nui`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:c(`support.nui`)||`누이`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`10`,step:`0.1`,value:G.characterNui??``,onChange:e=>Qe(t=>({...t,characterNui:z(e.target.value,10)}))}),(0,F.jsx)(`b`,{children:`%`})]})]})]})]})})]})]})]}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-footer`,style:{gap:`12px`},children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>W(!1),children:c(`support.close`)||`닫기`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-apply`,onClick:Ht,children:c(`support.batch_apply`)||`일괄적용`})]})]})}),Re&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&Ge(!1)},children:(0,F.jsxs)(`div`,{ref:Ct,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-save-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),style:{maxWidth:`400px`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>Ge(!1),"aria-label":c(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,style:{padding:`24px 24px 0`},children:[(0,F.jsx)(`div`,{className:`ebc-area-floating-head`,children:(0,F.jsx)(`h3`,{id:`ebc-save-title`,children:c(`support.save_area_settings`)||`에어리어 설정 저장`})}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-body`,style:{padding:`0 0 16px`},children:[(0,F.jsx)(`p`,{style:{fontSize:`13px`,color:`#555`,marginBottom:`8px`},children:c(`support.save_area_desc`)||`현재 설정을 텍스트로 복사하거나 파일로 다운로드합니다.`}),(0,F.jsx)(`textarea`,{readOnly:!0,value:JSON.stringify(N),style:{width:`100%`,height:`150px`,fontSize:`11px`,fontFamily:`inherit`,borderRadius:`8px`,border:`1px solid #ccc`,padding:`8px`,boxSizing:`border-box`,whiteSpace:`pre-wrap`,wordBreak:`break-all`,resize:`none`}})]})]}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-footer`,style:{display:`flex`,flexDirection:`column`,gap:`12px`,padding:`16px 24px 20px`,background:`linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%)`,borderBottomLeftRadius:`12px`,borderBottomRightRadius:`12px`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`10px`,width:`100%`},children:[(0,F.jsx)(`button`,{type:`button`,style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},onClick:()=>{navigator.clipboard.writeText(JSON.stringify(N)).then(()=>alert(`복사되었습니다.`))},children:c(`support.text_copy`)||`텍스트 복사`}),(0,F.jsx)(`button`,{type:`button`,style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},onClick:()=>Bt(JSON.stringify(N)),children:c(`support.file_download`)||`파일 다운로드`})]}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>Ge(!1),style:{width:`100%`,minWidth:0,height:`48px`,padding:`0`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`},children:c(`support.close`)||`닫기`})]})]})}),V&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&H(!1)},children:(0,F.jsxs)(`div`,{ref:wt,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-load-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),style:{maxWidth:`400px`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>H(!1),"aria-label":c(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,style:{padding:`24px 24px 0`},children:[(0,F.jsx)(`div`,{className:`ebc-area-floating-head`,children:(0,F.jsx)(`h3`,{id:`ebc-load-title`,children:c(`support.load_area_settings`)||`에어리어 설정 불러오기`})}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-body`,style:{padding:`0 0 16px`},children:[(0,F.jsx)(`p`,{style:{fontSize:`13px`,color:`#555`,marginBottom:`8px`},children:c(`support.load_area_desc`)||`복사한 텍스트를 아래에 붙여넣거나 파일을 업로드하세요.`}),(0,F.jsx)(`textarea`,{value:Xe,onChange:e=>Ze(e.target.value),placeholder:c(`support.paste_json_placeholder`)||`여기에 텍스트를 붙여넣으세요...`,style:{width:`100%`,height:`150px`,fontSize:`11px`,fontFamily:`inherit`,borderRadius:`8px`,border:`1px solid #ccc`,padding:`8px`,boxSizing:`border-box`,whiteSpace:`pre-wrap`,wordBreak:`break-all`,resize:`none`}})]})]}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-footer`,style:{display:`flex`,flexDirection:`column`,gap:`12px`,padding:`16px 24px 20px`,background:`linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%)`,borderBottomLeftRadius:`12px`,borderBottomRightRadius:`12px`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`10px`,width:`100%`},children:[(0,F.jsxs)(`label`,{style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,display:`flex`,alignItems:`center`,justifyContent:`center`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`},children:[(0,F.jsx)(`span`,{style:{whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},children:c(`support.file_upload`)||`파일 업로드`}),(0,F.jsx)(`input`,{type:`file`,accept:`.json`,style:{display:`none`},onChange:e=>{let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=e=>Ze(e.target.result),n.readAsText(t)}})]}),(0,F.jsx)(`button`,{type:`button`,style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},onClick:()=>{try{let e=JSON.parse(Xe);e&&e.characters?(Nt(et(e)),alert(`불러왔습니다.`),H(!1)):alert(`올바른 설정 데이터가 아닙니다.`)}catch{alert(`JSON 파싱 오류입니다. 텍스트를 확인해주세요.`)}},children:c(`support.apply`)||`적용`})]}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>H(!1),style:{width:`100%`,minWidth:0,height:`48px`,padding:`0`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`},children:c(`support.close`)||`닫기`})]})]})}),Ne&&(0,F.jsx)(`div`,{className:`ebc-power-detail-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&Pe(!1)},children:(0,F.jsxs)(`div`,{ref:Tt,role:`dialog`,"aria-modal":`true`,"aria-label":c(`support.total_power`)||`종합력`,tabIndex:-1,className:`ebc-power-detail-modal`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-power-detail-close`,onClick:()=>Pe(!1),"aria-label":c(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-power-detail-body`,children:[(0,F.jsxs)(`div`,{className:`ebc-power-detail-total`,children:[(0,F.jsx)(`span`,{children:c(`support.total_power`)||`종합력`}),(0,F.jsx)(`strong`,{children:Q.totalPower.toLocaleString()})]}),(0,F.jsx)(`div`,{className:`ebc-power-detail-box`,children:qt.map(e=>(0,F.jsxs)(`div`,{className:`ebc-power-detail-row`,children:[(0,F.jsx)(`span`,{children:e.label}),(0,F.jsx)(`i`,{"aria-hidden":`true`}),(0,F.jsx)(`strong`,{children:e.value.toLocaleString()})]},e.label))})]}),(0,F.jsx)(`div`,{className:`ebc-power-detail-footer`,children:(0,F.jsx)(`button`,{type:`button`,onClick:()=>Pe(!1),children:c(`support.close`)||`닫기`})})]})}),(0,F.jsx)(ue,{isOpen:Fe,isMain:!0,activeIndex:K===null?0:K,onClose:()=>Ie(!1),onClear:()=>{K!==null&&Z(K,{card:null,rarityKey:``}),Ie(!1)},onSelectCard:e=>{if(K!==null){let t=e.type===`Birthday`||e.type===`Anniversary`?`birthday`:`rarity${e.rarity}`;Z(K,{card:e,rarityKey:t})}Ie(!1)},selectedCharId:null,pickerCharId:ut,setPickerCharId:e=>{dt(e),D(`ebc_last_char_id`,String(e))},cards:J,ownedCardIds:_t,cardsLoading:pt,cardsError:ht,unitMemberIds:[],activeSlotCardId:K===null?null:A[K]?.card?.id,eventOverride:g,isManualEvent:w,showSkillBadge:!0}),yt&&(0,F.jsx)(j.Suspense,{fallback:(0,F.jsx)(`p`,{role:`status`,children:c(`support.recommend_loading`)}),children:(0,F.jsx)(ke,{request:yt,onClose:()=>bt(null),onApply:Kt,missingInputs:$,onSupportBonusChange:h,onAreaChange:(e,t)=>{P(e),o(e),t&&l(M)}})}),(0,F.jsx)(`style`,{children:`
                .ebc-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    background: rgba(15, 23, 42, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .ebc-modal {
                    width: 100%;
                    max-width: 880px;
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    max-height: calc(100vh - 40px);
                    max-height: calc(100dvh - 40px);
                }
                .ebc-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 2px solid #f1f5f9;
                    background: #f8fafc;
                }
                .ebc-header h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                    color: #1e293b;
                }
                .ebc-close-btn {
                    background: transparent;
                    border: none;
                    font-size: 20px;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    transition: background 0.15s;
                }
                .ebc-close-btn:hover {
                    background: #e2e8f0;
                    color: #334155;
                }
                .ebc-content {
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .ebc-area-open-btn {
                    min-height: 34px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #334155;
                    padding: 4px 10px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 900;
                    transition: all 0.15s;
                }
                .ebc-area-open-btn.active {
                    border-color: #0ea5e9;
                    background: #e0f2fe;
                    color: #0369a1;
                }
                .ebc-area-floating-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                    background: rgba(31, 35, 60, 0.28);
                }
                .ebc-area-floating-modal {
                    position: relative;
                    width: min(960px, 100%);
                    max-height: min(calc(100vh - 32px), 820px);
                    max-height: min(calc(100dvh - 32px), 820px);
                    border-radius: 18px;
                    background: #f0f0f8;
                    box-shadow: 0 24px 60px rgba(31, 35, 60, 0.28), inset 0 0 0 1px rgba(255,255,255,0.72);
                    color: #474967;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .ebc-area-floating-close {
                    position: absolute;
                    top: 12px;
                    right: 18px;
                    z-index: 3;
                    width: 44px;
                    height: 44px;
                    border: none;
                    background: transparent;
                    color: #474967;
                    font-size: 48px;
                    line-height: 38px;
                    font-weight: 900;
                    text-shadow: 0 2px 4px rgba(31, 35, 60, 0.15);
                    cursor: pointer;
                }
                .ebc-area-floating-scroll {
                    padding: 34px 44px 26px;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #535577 #d7d8e7;
                }
                .ebc-area-floating-scroll::-webkit-scrollbar {
                    width: 10px;
                }
                .ebc-area-floating-scroll::-webkit-scrollbar-track {
                    background: #d7d8e7;
                    border-radius: 999px;
                }
                .ebc-area-floating-scroll::-webkit-scrollbar-thumb {
                    background: #535577;
                    border-radius: 999px;
                }
                .ebc-area-floating-head {
                    margin-bottom: 22px;
                }
                .ebc-area-floating-head h3 {
                    margin: 0 0 10px;
                    font-size: 28px;
                    font-weight: 1000;
                    color: #3f415f;
                    letter-spacing: 0;
                    border-bottom: 3px solid #a9abc1;
                    padding: 0 0 10px 6px;
                }
                .ebc-area-floating-totals {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding-left: 6px;
                    font-size: 12px;
                    font-weight: 900;
                    color: #686a87;
                }
                .ebc-area-floating-totals span,
                .ebc-area-floating-totals button {
                    height: 30px;
                    border: none;
                    border-radius: 999px;
                    background: #ffffff;
                    box-shadow: 0 2px 6px rgba(31, 35, 60, 0.10);
                    display: inline-flex;
                    align-items: center;
                    padding: 0 12px;
                }
                .ebc-area-floating-totals strong {
                    margin-left: 6px;
                    color: #3f415f;
                }
                .ebc-area-floating-totals button {
                    cursor: pointer;
                    color: #000000;
                    font-weight: 1000;
                }
                .ebc-area-floating-totals button.ebc-btn-save,
                .ebc-area-floating-totals button.ebc-btn-load {
                    border-radius: 6px;
                }
                .ebc-title-power-editor {
                    display: inline-grid;
                    grid-template-columns: auto 150px;
                    align-items: center;
                    gap: 10px;
                    margin: 10px 0 0 6px;
                    color: #555776;
                    font-size: 13px;
                    font-weight: 1000;
                }
                .ebc-title-power-editor label {
                    height: 34px;
                    border-radius: 10px;
                    background: #ffffff;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 4px;
                    padding: 0 8px;
                    box-shadow: inset 0 0 0 1px rgba(71,73,103,0.05);
                }
                .ebc-title-power-editor input {
                    min-width: 0;
                    width: 100%;
                    border: none;
                    background: transparent;
                    color: #555776;
                    font-size: 18px;
                    font-weight: 900;
                    text-align: center;
                    outline: none;
                    letter-spacing: 0;
                }
                .ebc-title-power-editor b {
                    color: #555776;
                    font-size: 12px;
                    font-weight: 900;
                }
                .ebc-area-game-section {
                    margin-top: 26px;
                }
                .ebc-area-game-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #3f415f;
                    font-size: 25px;
                    font-weight: 1000;
                    letter-spacing: 0;
                    border-bottom: 3px solid #a9abc1;
                    padding: 0 0 8px 6px;
                    margin-bottom: 18px;
                }
                .ebc-area-game-title strong {
                    border-radius: 999px;
                    background: #e4f9ef;
                    color: #18a66a;
                    font-size: 14px;
                    padding: 4px 10px;
                    box-shadow: inset 0 0 0 1px rgba(24,166,106,0.16);
                }
                .ebc-area-game-grid {
                    display: grid;
                    gap: 12px 14px;
                }
                .ebc-area-game-grid.units {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .ebc-area-game-grid.attrs {
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                }
                .ebc-area-unit-header {
                    width: calc((100% - 28px) / 3);
                    min-width: 260px;
                    display: grid;
                    grid-template-columns: minmax(70px, 1fr) minmax(92px, 102px) minmax(78px, 88px);
                    gap: 8px;
                    align-items: center;
                    padding: 0 9px 4px;
                    color: #777993;
                    font-size: 12px;
                    font-weight: 1000;
                    text-align: center;
                }
                .ebc-area-game-pill {
                    min-width: 0;
                    height: 50px;
                    border-radius: 14px;
                    background: #dedfeb;
                    display: grid;
                    grid-template-columns: minmax(70px, 1fr) minmax(92px, 102px) minmax(78px, 88px);
                    gap: 8px;
                    align-items: center;
                    padding: 0 9px;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.52);
                }
                .ebc-area-game-pill.attr {
                    grid-template-columns: 44px minmax(106px, 118px);
                    gap: 8px;
                    justify-content: center;
                }
                .ebc-area-pill-media {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ebc-area-pill-media img {
                    max-width: 112px;
                    max-height: 38px;
                    object-fit: contain;
                    filter: drop-shadow(0 1px 1px rgba(31,35,60,0.18));
                }
                .ebc-area-pill-media.icon img {
                    width: 42px;
                    height: 42px;
                }
                .ebc-area-pill-input {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    min-width: 0;
                    height: 34px;
                    border-radius: 10px;
                    background: #ffffff;
                    padding: 0 9px;
                    box-sizing: border-box;
                    overflow: hidden;
                    box-shadow: inset 0 0 0 1px rgba(71,73,103,0.05);
                    color: #555776;
                    font-size: 22px;
                    font-weight: 900;
                }
                .ebc-area-pill-input input {
                    flex: 1 1 auto;
                    width: 0;
                    min-width: 0;
                    height: 100%;
                    border: none;
                    background: transparent;
                    color: #555776;
                    font-size: 22px;
                    font-weight: 900;
                    text-align: center;
                    outline: none;
                    padding: 0;
                    box-sizing: border-box;
                    letter-spacing: 0;
                }
                .ebc-area-floating-modal input[type="number"] {
                    appearance: textfield;
                    -moz-appearance: textfield;
                }
                .ebc-area-floating-modal input[type="number"]::-webkit-outer-spin-button,
                .ebc-area-floating-modal input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .ebc-area-pill-input b {
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: baseline;
                    justify-content: center;
                    min-width: 18px;
                    font-size: 18px;
                    font-weight: 900;
                    text-align: center;
                    line-height: 1;
                    white-space: nowrap;
                }
                .ebc-area-pill-input.gate {
                    padding: 0 8px;
                }
                .ebc-area-pill-input.gate input {
                    font-size: 18px;
                }
                .ebc-area-pill-input.gate b {
                    min-width: 24px;
                    font-size: 12px;
                }
                .ebc-area-character-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    align-items: center;
                }
                .ebc-area-character-pill {
                    min-width: 0;
                    width: 100%;
                    box-sizing: border-box;
                    border-radius: 28px;
                    background: #dedfeb;
                    padding: 3px 14px 3px 3px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    height: fit-content;
                }
                .ebc-area-character-face {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                }
                .ebc-area-character-face img {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    object-fit: cover;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 1px 4px rgba(31,35,60,0.15);
                    flex: 0 0 auto;
                }
                .ebc-area-character-fields {
                    display: flex;
                    flex: 1 1 auto;
                    min-width: 0;
                }
                .ebc-area-character-pill label {
                    flex: 1 1 auto;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 2px;
                    min-width: 0;
                    height: auto;
                    margin: 0;
                }
                .ebc-area-character-pill label > span {
                    display: none;
                }
                .ebc-area-character-input,
                .ebc-area-character-pill label > input {
                    width: 100%;
                    min-width: 0;
                    height: 44px;
                    border-radius: 16px;
                    background: transparent;
                    box-sizing: border-box;
                    overflow: hidden;
                    box-shadow: none;
                    margin: 0;
                }
                .ebc-area-character-input {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                    padding: 0 6px;
                }
                .ebc-area-character-pill input {
                    width: 100%;
                    min-width: 0;
                    height: 44px;
                    line-height: 44px;
                    border: none;
                    border-radius: 16px;
                    background: transparent;
                    color: #555776;
                    font-size: 22px;
                    font-weight: 700;
                    text-align: center;
                    outline: none;
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    letter-spacing: 0;
                    -moz-appearance: textfield;
                    -webkit-appearance: none;
                    appearance: none;
                }
                .ebc-area-character-input input {
                    flex: 1 1 auto;
                    width: 0;
                    min-width: 0;
                    background: transparent;
                    text-align: center;
                }
                .ebc-area-character-input b {
                    flex: 0 0 auto;
                    color: #555776;
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 44px;
                    white-space: nowrap;
                }
                .ebc-char-tab {
                    background: transparent;
                    border: none;
                    font-size: 13px;
                    font-weight: 800;
                    color: #777993;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                }
                .ebc-char-tab.active {
                    background: #dedfeb;
                    color: #474967;
                }
                    line-height: 1;
                    white-space: nowrap;
                }
                .ebc-area-floating-footer {
                    padding: 18px 24px 22px;
                    display: flex;
                    justify-content: center;
                    background: linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%);
                    box-shadow: 0 -10px 18px rgba(240,240,248,0.88);
                }
                .ebc-area-floating-footer button {
                    min-width: 220px;
                    height: 56px;
                    border: none;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #474967;
                    font-size: 22px;
                    font-weight: 1000;
                    box-shadow: 0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08);
                    cursor: pointer;
                }
                .ebc-power-detail-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2250;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 22px;
                    background: rgba(31, 35, 60, 0.36);
                    backdrop-filter: blur(2px);
                }
                .ebc-power-detail-modal {
                    position: relative;
                    width: min(820px, 100%);
                    min-height: min(640px, calc(100vh - 48px));
                    min-height: min(640px, calc(100dvh - 48px));
                    border-radius: 18px;
                    background: #f0f0f8;
                    box-shadow: 0 24px 60px rgba(31, 35, 60, 0.32), inset 0 0 0 1px rgba(255,255,255,0.72);
                    color: #474967;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .ebc-power-detail-close {
                    position: absolute;
                    top: 16px;
                    right: 20px;
                    z-index: 2;
                    width: 46px;
                    height: 46px;
                    border: none;
                    background: transparent;
                    color: #474967;
                    font-size: 52px;
                    line-height: 40px;
                    font-weight: 1000;
                    text-shadow: 0 2px 4px rgba(31, 35, 60, 0.15);
                    cursor: pointer;
                }
                .ebc-power-detail-body {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 34px;
                    padding: 76px 42px 34px;
                }
                .ebc-power-detail-total {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    color: #3f415f;
                    font-size: 24px;
                    font-weight: 1000;
                    letter-spacing: 0;
                }
                .ebc-power-detail-total strong {
                    color: #555776;
                    font-size: 30px;
                    font-weight: 800;
                    letter-spacing: 3px;
                }
                .ebc-power-detail-box {
                    width: min(520px, 100%);
                    border-radius: 12px;
                    background: #dedfeb;
                    padding: 22px 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .ebc-power-detail-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 1px minmax(96px, auto);
                    align-items: center;
                    gap: 24px;
                    color: #555776;
                    font-size: 21px;
                    font-weight: 1000;
                    letter-spacing: 0;
                }
                .ebc-power-detail-row i {
                    width: 1px;
                    height: 28px;
                    background: #a9abc1;
                }
                .ebc-power-detail-row strong {
                    color: #555776;
                    font-size: 23px;
                    font-weight: 700;
                    text-align: right;
                    letter-spacing: 1px;
                }
                .ebc-power-detail-footer {
                    padding: 18px 24px 24px;
                    display: flex;
                    justify-content: center;
                    background: linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%);
                }
                .ebc-power-detail-footer button {
                    min-width: 220px;
                    height: 56px;
                    border: none;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #474967;
                    font-size: 22px;
                    font-weight: 1000;
                    box-shadow: 0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08);
                    cursor: pointer;
                }
                .ebc-wl-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .ebc-checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-weight: 800;
                    color: #334155;
                    font-size: 15px;
                }
                .ebc-checkbox-label input {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                    accent-color: #6366f1;
                }
                .ebc-support-bonus-inline {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ebc-support-bonus-inline label {
                    font-weight: 700;
                    color: #475569;
                    font-size: 14px;
                }
                .ebc-input-wrapper {
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 0 8px;
                    width: 100px;
                    height: 32px;
                }
                .ebc-support-input {
                    border: none;
                    background: transparent;
                    width: 100%;
                    font-weight: 800;
                    color: #1e293b;
                    outline: none;
                    text-align: center;
                    box-sizing: border-box;
                }
                .ebc-input-suffix {
                    color: #64748b;
                    font-weight: 700;
                    margin-left: 4px;
                }
                .ebc-deck-section {
                    background: #eef0fa;
                    border-radius: 14px;
                    padding: 14px 16px 16px;
                    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.28);
                }
                .ebc-deck-header {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .ebc-power-total {
                    min-height: 34px;
                    color: #525575;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 10px;
                    padding: 0;
                    font-size: 18px;
                    font-weight: 900;
                    text-align: left;
                }
                .ebc-power-total strong {
                    color: #525575;
                    font-size: 19px;
                    font-weight: 700;
                    letter-spacing: 2px;
                }
                .ebc-power-info-btn {
                    width: 30px;
                    height: 30px;
                    border: none;
                    border-radius: 50%;
                    background: #ffffff;
                    color: #525575;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 1000;
                    line-height: 1;
                    box-shadow: 0 2px 7px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.06);
                    cursor: pointer;
                }
                .ebc-power-info-btn:hover {
                    background: #f8fafc;
                    transform: translateY(-1px);
                }
                .ebc-deck-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 8px 16px;
                    gap: 12px;
                    margin-top: 16px;
                }
                .ebc-toolbar-presets {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .ebc-preset-load-btn {
                    background: #ffffff;
                    color: #64748b;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 5px 14px;
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.15s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .ebc-preset-load-btn.active {
                    background: #6366f1;
                    color: #ffffff;
                    border-color: #4f46e5;
                    box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
                }
                .ebc-preset-load-btn:hover {
                    background: #f1f5f9;
                    color: #334155;
                }
                .ebc-preset-load-btn.active:hover {
                    background: #4f46e5;
                    color: #ffffff;
                }
                .ebc-btn-reset {
                    background: #fef2f2;
                    color: #ef4444;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    padding: 5px 14px;
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.15s;
                    box-shadow: 0 1px 2px rgba(239, 68, 68, 0.05);
                }
                .ebc-btn-reset:hover {
                    background: #fee2e2;
                    border-color: #fca5a5;
                }
                .ebc-toolbar-snapshot.mobile-only {
                    display: none;
                }
                .ebc-toolbar-snapshot.pc-only {
                    display: flex;
                }
                .ebc-toolbar-snapshot {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .ebc-snapshot-save-btn {
                    background: #f0fdf4;
                    color: #16a34a;
                    border: 1px solid #bbf7d0;
                    border-radius: 6px;
                    padding: 5px 12px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .ebc-snapshot-save-btn:hover {
                    background: #dcfce7;
                    border-color: #86efac;
                }
                .ebc-snapshot-load-btn {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #bfdbfe;
                    border-radius: 6px;
                    padding: 5px 12px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .ebc-snapshot-load-btn:hover:not(:disabled) {
                    background: #dbeafe;
                    border-color: #93c5fd;
                }
                .ebc-snapshot-load-btn:disabled,
                .ebc-snapshot-load-btn.disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .ebc-deck-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 12px;
                }
                .ebc-slot {
                    border: none;
                    border-radius: 8px;
                    padding: 0;
                    background: transparent;
                    box-shadow: none;
                }
                .ebc-slot-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 13px;
                    font-weight: 900;
                    color: #64748b;
                }
                .ebc-awaken-toggle {
                    font-size: 10px;
                    padding: 1px 4px;
                    border-radius: 4px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    color: #475569;
                    cursor: pointer;
                    line-height: 1.2;
                }
                .ebc-awaken-toggle.awakened {
                    background: #ecfdf5;
                    border-color: #10b981;
                    color: #059669;
                }
                .ebc-awaken-toggle.unawakened {
                    background: #fef2f2;
                    border-color: #ef4444;
                    color: #dc2626;
                }
                .ebc-awaken-toggle:hover {
                    filter: brightness(0.95);
                }
                .ebc-slot-header strong {
                    color: #059669;
                }
                .ebc-preview-wrap {
                    width: 100%;
                    aspect-ratio: 1/1;
                    margin-bottom: 6px;
                }
                .ebc-preview-card {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 4px;
                    background: #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 2px 7px rgba(31,35,60,0.16);
                }
                .ebc-preview-card.empty .ebc-card-face { filter: grayscale(0.5); opacity: 0.5; }
                .ebc-card-face, .ebc-card-frame { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
                .ebc-card-frame { z-index: 2; }
                .ebc-card-attribute { position: absolute; top: 2%; left: 2%; z-index: 3; width: 22%; height: 22%; object-fit: contain; }
                .ebc-card-stars { position: absolute; bottom: 18%; left: 5%; z-index: 3; width: 74%; display: flex; gap: 1%; }
                .ebc-card-stars img { width: 13%; object-fit: contain; }
                .ebc-card-birthday { position: absolute; bottom: 18%; left: 4%; z-index: 3; width: 22%; height: auto; }
                .ebc-skill-badge { position: absolute; left: 0; bottom: 0; height: 19%; width: 100%; z-index: 1; display: flex; align-items: center; padding-left: 7%; border-radius: 0 0 6px 6px; background: rgba(45,48,84,0.9); color: #fff; font-size: 13px; font-weight: 900; transform: translateY(-4%); }
                .ebc-mastery-badge { position: absolute; right: 4%; bottom: 3%; z-index: 6; width: 30%; height: auto; }
                .ebc-slot-power-row {
                    display: grid;
                    grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
                    gap: 6px;
                    align-items: center;
                    margin-bottom: 8px;
                    min-height: 28px;
                }
                .ebc-canvas-toggle {
                    height: 28px;
                    border: 1px solid #cbd5e1;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 900;
                    cursor: pointer;
                    padding: 0 4px;
                }
                .ebc-canvas-toggle.active {
                    border-color: #0ea5e9;
                    background: #e0f2fe;
                    color: #0369a1;
                }
                .ebc-canvas-toggle:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }
                .ebc-slot-power-row .ebc-slot-base-power {
                    min-width: 0;
                    overflow: hidden;
                    height: 28px;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #525575;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 4px;
                    padding: 0 8px;
                    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.20);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0;
                }
                .ebc-slot-base-power strong {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .ebc-control-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 4px; }
                .ebc-toggle-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 6px; }
                
                .ebc-select { position: relative; }
                .ebc-select-button { width: 100%; height: 26px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; display: flex; align-items: center; justify-content: center; padding: 0 4px; font-size: 11px; font-weight: 800; cursor: pointer; color: #334155; }
                .ebc-select-button span { display: none; }
                .ebc-select-button.open { border-color: #6366f1; color: #4f46e5; }
                .ebc-select-menu { position: absolute; z-index: 100; left: 0; top: calc(100% + 4px); background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 4px; min-width: 100%; text-align: center; }
                .ebc-select-menu button { display: block; width: 100%; height: 26px; border: none; background: transparent; font-size: 12px; font-weight: 800; color: #334155; border-radius: 4px; cursor: pointer; text-align: center; padding: 0 8px; }
                .ebc-select-menu button:hover, .ebc-select-menu button.selected { background: #e0e7ff; color: #4f46e5; }
                
                .ebc-toggle { height: 26px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #475569; font-size: 11px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .ebc-toggle.active { border-color: #10b981; background: #ecfdf5; color: #059669; }
                .ebc-toggle:disabled { opacity: 0.5; cursor: not-allowed; background: #f8fafc; }
                .ebc-toggle.wl-auto { opacity: 1; cursor: default; }
                .ebc-toggle.wl-auto.active { border-color: #0ea5e9; background: #e0f2fe; color: #0284c7; }
                
                .ebc-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 9px; font-weight: 800; color: #64748b; }
                .ebc-breakdown span { display: flex; justify-content: space-between; background: #f8fafc; padding: 3px 4px; border-radius: 4px; }
                .ebc-breakdown b { color: #334155; }
                
                .ebc-footer-wrapper {
                    background: #f8fafc;
                    border-top: 2px solid #f1f5f9;
                }
                .ebc-footer-info {
                    padding: 12px 20px 0;
                    font-size: 13px;
                    color: #0ea5e9;
                    font-weight: 800;
                }
                .ebc-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
                .ebc-footer-total { font-size: 16px; font-weight: 800; color: #334155; }
                .ebc-footer-total strong { font-size: 24px; color: #4f46e5; margin-left: 8px; }
                .ebc-footer-actions { display: flex; gap: 8px; }
                .ebc-btn-cancel, .ebc-btn-apply { height: 40px; padding: 0 20px; border-radius: 8px; font-size: 15px; font-weight: 800; cursor: pointer; border: none; }
                .ebc-btn-cancel { background: #e2e8f0; color: #475569; }
                .ebc-btn-cancel:hover { background: #cbd5e1; }
                .ebc-btn-apply { background: #6366f1; color: #fff; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
                .ebc-btn-apply:hover { background: #4f46e5; }
                
                @media (max-width: 768px) {
                    .ebc-backdrop { padding: 12px; }
                    .ebc-modal { border-radius: 8px; max-height: calc(100vh - 20px); max-height: calc(100dvh - 20px); }
                    .ebc-deck-section { padding: 12px; }
                    .ebc-deck-header { align-items: flex-start; flex-direction: column; }
                    .ebc-deck-grid { grid-template-columns: repeat(3, 1fr); }
                    .ebc-area-floating-backdrop { padding: 10px; }
                    .ebc-area-floating-modal { max-height: calc(100vh - 16px); max-height: calc(100dvh - 16px); border-radius: 14px; }
                    .ebc-area-floating-scroll { padding: 28px 22px 18px; }
                    .ebc-area-floating-head h3,
                    .ebc-area-game-title { font-size: 22px; }
                    .ebc-area-game-grid.units,
                    .ebc-area-game-grid.attrs { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                    .ebc-area-unit-header { width: calc((100% - 12px) / 2); min-width: 0; }
                    .ebc-area-unit-header { width: calc((100% - 12px) / 2); min-width: 0; }
                    .ebc-power-detail-modal { min-height: min(560px, calc(100vh - 32px)); min-height: min(560px, calc(100dvh - 32px)); border-radius: 14px; }
                    .ebc-power-detail-body { padding: 62px 24px 24px; gap: 24px; }
                    .ebc-power-detail-total { font-size: 22px; gap: 12px; }
                    .ebc-power-detail-total strong { font-size: 27px; letter-spacing: 2px; }
                    .ebc-power-detail-row { font-size: 18px; gap: 18px; grid-template-columns: minmax(0, 1fr) 1px minmax(82px, auto); }
                    .ebc-power-detail-row strong { font-size: 19px; }
                    .ebc-footer { flex-direction: column; gap: 12px; }
                    .ebc-footer-total, .ebc-footer-actions { width: 100%; text-align: center; justify-content: center; }
                    .ebc-btn-cancel, .ebc-btn-apply { flex: 1; }
                    .lang-ja .ebc-slot-header { font-size: 10px; letter-spacing: -0.5px; white-space: nowrap; overflow: hidden; }
                    .lang-ja .ebc-toggle { font-size: 9px; padding: 0 2px; letter-spacing: -0.5px; }
                    .lang-ja .ebc-breakdown { font-size: 8px; letter-spacing: -0.5px; }
                    .lang-ja .ebc-breakdown span { white-space: nowrap; overflow: hidden; }
                    .lang-ja .ebc-select-button { font-size: 10px; padding: 0 4px; }
                    .lang-ja .ebc-prefix-label { font-size: 9px; }
                    .lang-ja .ebc-awaken-toggle { font-size: 9px; letter-spacing: -0.5px; padding: 1px 2px; }
                }
                @media (max-width: 480px) {
                    .ebc-backdrop { padding: 4px; }
                    .ebc-modal { border-radius: 6px; max-height: calc(100vh - 8px); max-height: calc(100dvh - 8px); }
                    .ebc-deck-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
                    .ebc-deck-section { padding: 8px; border-radius: 10px; }
                    .ebc-power-total { min-height: 34px; gap: 6px; padding: 0; font-size: 14px; }
                    .ebc-power-total strong { font-size: 15px; }
                    .ebc-power-info-btn { width: 26px; height: 26px; font-size: 17px; }
                    .ebc-slot { padding: 4px; }
                    .ebc-area-floating-backdrop { padding: 4px; }
                    .ebc-area-floating-scroll { padding: 24px 12px 12px; }
                    .ebc-area-floating-close { top: 8px; right: 10px; font-size: 38px; width: 34px; height: 34px; line-height: 30px; }
                    .ebc-area-floating-head { padding-right: 36px; }
                    .ebc-area-floating-head h3,
                    .ebc-area-game-title { font-size: 19px; border-bottom-width: 2px; }
                    .ebc-area-floating-totals { gap: 6px; font-size: 10px; }
                    .ebc-area-floating-totals span,
                    .ebc-area-floating-totals button { height: 26px; padding: 0 8px; }
                    .ebc-title-power-editor { grid-template-columns: 1fr; align-items: stretch; width: calc(100% - 6px); gap: 5px; font-size: 12px; }
                    .ebc-title-power-editor label { height: 30px; }
                    .ebc-title-power-editor input { font-size: 16px; }
                    .ebc-area-game-grid.units { grid-template-columns: 1fr; gap: 8px; }
                    .ebc-area-game-grid.attrs { grid-template-columns: repeat(2, 1fr); gap: 8px; }
                    .ebc-area-unit-header { width: 100%; min-width: 0; grid-template-columns: minmax(74px, 1fr) minmax(80px, 92px) minmax(66px, 76px); gap: 5px; padding: 0 9px 3px; }
                    .ebc-area-game-pill { height: 46px; border-radius: 13px; grid-template-columns: minmax(74px, 1fr) minmax(80px, 92px) minmax(66px, 76px); gap: 5px; }
                    .ebc-area-game-pill.attr { grid-template-columns: 42px minmax(96px, 112px); gap: 6px; }
                    .ebc-area-pill-media img { max-height: 30px; }
                    .ebc-area-pill-media.icon img { width: 34px; height: 34px; }
                    .ebc-area-pill-input { height: 30px; padding: 0 7px; gap: 3px; }
                    .ebc-area-pill-input input { font-size: 18px; }
                    .ebc-area-pill-input b { font-size: 15px; min-width: 15px; }
                    .ebc-area-pill-input.gate { padding: 0 6px; }
                    .ebc-area-pill-input.gate input { font-size: 15px; }
                    .ebc-area-pill-input.gate b { font-size: 10px; min-width: 20px; }
                    .ebc-area-character-grid { grid-template-columns: repeat(4, 1fr); gap: 4px; align-items: start; justify-items: stretch; }
                    .ebc-area-character-pill { width: 100%; padding: 1px 4px 1px 1px; gap: 4px; border-radius: 14px; }
                    .ebc-area-character-face { min-width: 20px; flex: 0 0 auto; }
                    .ebc-area-character-face img { width: 20px; height: 20px; }
                    .ebc-area-character-input, .ebc-area-character-pill label > input { height: 20px; }
                    .ebc-area-character-pill input { font-size: 10px; font-weight: 700; height: 20px; line-height: 20px; }
                    .ebc-area-character-input b { font-size: 10px; font-weight: 700; line-height: 20px; }
                    .ebc-area-floating-footer { padding: 12px 14px 14px; flex-wrap: wrap; }
                    .ebc-power-detail-backdrop { padding: 8px; }
                    .ebc-power-detail-modal { min-height: min(500px, calc(100vh - 24px)); min-height: min(500px, calc(100dvh - 24px)); border-radius: 14px; }
                    .ebc-power-detail-close { top: 8px; right: 10px; font-size: 38px; width: 34px; height: 34px; line-height: 30px; }
                    .ebc-power-detail-body { padding: 48px 12px 18px; gap: 18px; }
                    .ebc-power-detail-total { font-size: 17px; gap: 8px; }
                    .ebc-power-detail-total strong { font-size: 21px; letter-spacing: 1px; }
                    .ebc-power-detail-box { padding: 16px 14px; gap: 12px; border-radius: 10px; }
                    .ebc-power-detail-row { font-size: 14px; gap: 10px; grid-template-columns: minmax(0, 1fr) 1px minmax(68px, auto); }
                    .ebc-power-detail-row i { height: 22px; }
                    .ebc-power-detail-row strong { font-size: 15px; letter-spacing: 0; }
                    .ebc-power-detail-footer { padding: 12px 14px 14px; }
                    .ebc-power-detail-footer button { min-width: 180px; height: 46px; font-size: 18px; }
                    .ebc-canvas-toggle { font-size: 9px; }
                    .ebc-slot-power-row .ebc-slot-base-power { font-size: 10px; padding: 0 5px; }
                    .ebc-breakdown { font-size: 8px; }
                    .ebc-toolbar-snapshot.pc-only { display: none !important; }
                    .ebc-toolbar-snapshot.mobile-only { display: flex !important; }
                    .ebc-prefix-label.hide-on-mobile { display: none; }
                    .lang-ja .ebc-slot-header { font-size: 9px; }
                    .lang-ja .ebc-toggle { font-size: 8px; letter-spacing: -1px; }
                    .lang-ja .ebc-prefix-label { font-size: 8px; letter-spacing: -0.5px; }
                    .lang-ja .ebc-select-button { font-size: 9px; padding: 0 3px; }
                    .lang-ja .ebc-breakdown { font-size: 7px; }
                }
            `})]}):null},q=e({default:()=>bt}),lt=(0,j.lazy)(()=>_(()=>import(`./AutoTab-DdelcR8T.js`),__vite__mapDeps([16,1,6,17,5,3,4,7,18,8,19,20,21]))),ut=(0,j.lazy)(()=>_(()=>import(`./PowerTab-DL7i7IIj.js`),__vite__mapDeps([22,1,6,19,5,3,4,7,21,18,8,20,23,24,17,25]))),dt=(0,j.lazy)(()=>_(()=>import(`./StandaloneRecommendation-W9JLP7t-.js`),__vite__mapDeps([26,1,6,5,3,4,7,2,8,9,10,11]))),J=[1,2,3,4],ft=()=>(0,F.jsx)(`div`,{className:`flex justify-center py-6 text-sm font-medium text-gray-400`,children:`불러오는 중...`}),pt=`deck-input-control w-28 text-center bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500`,mt=`deck-loaded-control w-28 text-center rounded-lg px-2 py-1.5 font-medium cursor-pointer transition-colors`,ht=({children:e,className:t=``})=>(0,F.jsx)(`div`,{className:`deck-input-section ${t}`,children:e}),gt=({label:e,extraHeader:t})=>(0,F.jsxs)(`div`,{className:`deck-input-header`,children:[(0,F.jsx)(`div`,{className:`deck-input-label-cell`}),(0,F.jsx)(`div`,{className:`deck-input-center-cell`,children:(0,F.jsx)(`span`,{className:`font-bold text-gray-700`,children:e})}),(0,F.jsx)(`div`,{className:`deck-input-side-cell deck-input-header-side`,children:t&&(0,F.jsx)(`span`,{className:`font-bold text-xs text-indigo-600`,children:t})})]}),_t=({label:e,side:t,children:n})=>(0,F.jsxs)(`div`,{className:`deck-input-row`,children:[(0,F.jsx)(`div`,{className:`deck-input-label-cell`,children:(0,F.jsx)(`label`,{className:`whitespace-nowrap font-bold text-gray-700`,children:e})}),(0,F.jsx)(`div`,{className:`deck-input-center-cell`,children:n}),(0,F.jsx)(`div`,{className:`deck-input-side-cell`,children:t&&(0,F.jsx)(`div`,{className:`deck-input-side-content`,children:t})})]}),vt=({value:e,onChange:t})=>{let[n,r]=(0,j.useState)(!1),i=(0,j.useRef)(null);return(0,j.useEffect)(()=>{let e=e=>{i.current&&!i.current.contains(e.target)&&r(!1)},t=()=>r(!1);return n&&(document.addEventListener(`mousedown`,e),window.addEventListener(`scroll`,t,{capture:!0}),window.addEventListener(`resize`,t)),()=>{document.removeEventListener(`mousedown`,e),window.removeEventListener(`scroll`,t,{capture:!0}),window.removeEventListener(`resize`,t)}},[n]),(0,F.jsxs)(`div`,{className:`relative inline-block`,ref:i,children:[(0,F.jsxs)(`button`,{type:`button`,onClick:()=>r(e=>!e),className:`min-w-[60px] h-[28px] inline-flex items-center justify-center gap-0.5 rounded-md border border-blue-200 bg-blue-50 px-1.5 text-xs font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-300`,children:[(0,F.jsxs)(`span`,{children:[`SLv.`,e]}),(0,F.jsx)(`svg`,{className:`w-2.5 h-2.5 text-blue-400 transition-transform ${n?`rotate-180`:``}`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,children:(0,F.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2.5`,d:`M19 9l-7 7-7-7`})})]}),n&&(0,F.jsx)(`div`,{className:`absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded-lg bg-white shadow-xl ring-1 ring-black/10 overflow-hidden animate-fade-in`,children:(0,F.jsx)(`div`,{className:`p-1`,children:J.map(n=>(0,F.jsxs)(`button`,{type:`button`,onClick:()=>{t(n),r(!1)},className:`block w-[60px] rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${Number(e)===n?`bg-blue-500 text-white`:`text-gray-700 hover:bg-blue-50 hover:text-blue-700`}`,children:[`SLv.`,n]},n))})})]})},yt=(e,t=`loading`)=>window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,type:t,duration:t===`loading`?0:t===`error`?7e3:3e3}}));function bt({surveyData:e,setSurveyData:t,subPath:n}){let{user:r,updateFriendCode:a}=m(),{isKorean:o}=h(),c=o?`savedFriendCode_kr`:`savedFriendCode`,{t:l,language:u}=i(),d=b(),f=e=>e===`auto`?`auto`:`power`,[_,v]=(0,j.useState)(e.activeDeckNum||1);(0,j.useEffect)(()=>{e.activeDeckNum&&e.activeDeckNum!==_&&v(e.activeDeckNum)},[e.activeDeckNum,_]);let[y,ee]=(0,j.useState)(f(n)),[te,x]=(0,j.useState)(!1),[ne,C]=(0,j.useState)(!1),[T,E]=(0,j.useState)(!1),[ce,le]=(0,j.useState)(null),[ue,_e]=(0,j.useState)(``),[O,be]=(0,j.useState)({attr:``,unit:``,detailOpen:!1,characters:{},characterOrder:[]}),[k,xe]=(0,j.useState)(ye),A=(0,j.useRef)({first:null,second:null}),[Se,N]=(0,j.useState)(()=>se(c,``)),[P,De]=(0,j.useState)(!1);(0,j.useEffect)(()=>{r&&!o&&(r.saveFriendCode?(De(!0),r.friendCode&&(N(r.friendCode),D(c,r.friendCode))):De(!1))},[r,o,c]),(0,j.useEffect)(()=>{Se?D(c,Se):oe(c)},[Se,c]),(0,j.useEffect)(()=>()=>{A.current.first&&cancelAnimationFrame(A.current.first),A.current.second&&cancelAnimationFrame(A.current.second)},[]);let ke=e=>{A.current.first&&cancelAnimationFrame(A.current.first),A.current.second&&cancelAnimationFrame(A.current.second),A.current.first=requestAnimationFrame(()=>{A.current.second=requestAnimationFrame(()=>{window.scrollTo(0,e),A.current={first:null,second:null}})})},[Ae,I]=(0,j.useState)(!1),[je,Me]=(0,j.useState)(``),[Ne,Pe]=(0,j.useState)(()=>({[f(n)]:!0}));(0,j.useEffect)(()=>{ee(f(n))},[n]),(0,j.useEffect)(()=>{Pe(e=>e[y]?e:{...e,[y]:!0})},[y]),(0,j.useEffect)(()=>{let e=!1,t=null,n=null,r=null,i=async()=>{if(!e)try{await fe()}catch(e){console.warn(`Failed to load current event info`,e)}},a=()=>{e||(`requestIdleCallback`in window?t=window.requestIdleCallback(i,{timeout:8e3}):n=window.setTimeout(i,2e3))},o=()=>{e||(r=window.setTimeout(a,1500))};return document.readyState===`complete`?o():window.addEventListener(`load`,o,{once:!0}),()=>{e=!0,window.removeEventListener(`load`,o),t!==null&&`cancelIdleCallback`in window&&window.cancelIdleCallback(t),n!==null&&window.clearTimeout(n),r!==null&&window.clearTimeout(r)}},[]),(0,j.useEffect)(()=>{if(te)return pe(xe,e=>{console.warn(`Failed to load current event info`,e)})},[te]);let Fe=e=>{let t=String(e).padStart(2,`0`);return p.find(e=>e.image===t)},Ie=e=>{let t=Fe(e);return t?u===`ja`?t.nameJa:u===`en`?t.nameEn:t.nameKo:String(e)},Le=()=>{let e=Object.keys(O.characters||{}).length>0;return{attr:O.attr,unit:O.unit,characters:e?O.characters:{}}},Re=e=>{be(t=>e===`mix`?{...t,unit:``,detailOpen:!0}:{...t,unit:e,detailOpen:!1,characters:{},characterOrder:[]})},ze=e=>{be(t=>{let n={...t.characters||{}},r=[...t.characterOrder||[]].filter(t=>t!==e);if(n[e])delete n[e];else{if(r.length>=5){let e=r.shift();delete n[e]}n[e]=e>=21?t.unit||ve[0].key:me[e],r.push(e)}return{...t,characters:n,characterOrder:r}})},Be=(e,t)=>{be(n=>({...n,characters:{...n.characters||{},[e]:t}}))},[Ve,He]=(0,j.useState)(``),L=`deck${_}`,R=e.unifiedDecks?.[L]?.isManualInternalEdit||!1,Ue=!!e.unifiedDecks?.[L]?.isManualTotalPowerEdit,We=!!e.unifiedDecks?.[L]?.isManualEventBonusEdit,Ge=e.unifiedDecks?.[L]?.isDetailedInput||!1,z=e.unifiedDecks?.[L]?.detailedSkills||{encore:``,member1:``,member2:``,member3:``,member4:``},Ke=()=>e.unifiedDecks?.[`deck${_}`]||{};(0,j.useEffect)(()=>{let t=e.unifiedDecks?.[L]?.internalValue;He(t??``)},[e.unifiedDecks,L]),(0,j.useEffect)(()=>{let n=e.unifiedDecks;n&&n.deck1&&n.deck2&&n.deck3||t(e=>{let t=e.unifiedDecks||{},n={totalPower:``,skillLeader:``,skillMember2:``,skillMember3:``,skillMember4:``,skillMember5:``,eventBonus:``,internalValue:``,isManualInternalEdit:!1,detailedSkills:{encore:``,member1:``,member2:``,member3:``,member4:``},isDetailedInput:!1};return{...e,unifiedDecks:{deck1:t.deck1||{totalPower:S(e.autoDeck,`totalPower`,``),skillLeader:S(e.autoDeck,`skillLeader`,``),skillMember2:S(e.autoDeck,`skillMember2`,``),skillMember3:S(e.autoDeck,`skillMember3`,``),skillMember4:S(e.autoDeck,`skillMember4`,``),skillMember5:S(e.autoDeck,`skillMember5`,``),eventBonus:S(e.autoDeck,`eventBonus`,``),internalValue:``,isManualInternalEdit:!1,detailedSkills:{encore:``,member1:``,member2:``,member3:``,member4:``},isDetailedInput:!1},deck2:t.deck2||{...n},deck3:t.deck3||{...n},activeDeck:e.activeDeckNum||1}}})},[]);let B=e.unifiedDecks?.[`deck${_}`]||{},{totalPower:qe,skillLeader:Je,skillMember2:Ye,skillMember3:V,skillMember4:H,skillMember5:Xe,eventBonus:Ze}=B,U=B.useBloomFes||!1,W=B.bloomLevels||{leader:0,member2:0,member3:0,member4:0,member5:0},G=e=>{t(t=>{let n=t.unifiedDecks?.[`deck${_}`],r={...n,useBloomFes:e,bloomLevels:n?.bloomLevels||{leader:0,member2:0,member3:0,member4:0,member5:0}},i=w(r),a=Math.floor(i/10)*10,o=String(a);return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...r,internalValue:o,isManualInternalEdit:!1}}}})},Qe=(e,n)=>{t(t=>{let r=t.unifiedDecks?.[`deck${_}`],i={...r,bloomLevels:{...r?.bloomLevels,[e]:n}},a=w(i),o=Math.floor(a/10)*10;return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...i,internalValue:String(o),isManualInternalEdit:!1}}}})},K=(e,n)=>{t(t=>{let r=t.unifiedDecks?.[`deck${_}`]||{},i={...r.loadedSkillLevels||{},[e]:n},a=r[`skill${e===`leader`?`Leader`:e.charAt(0).toUpperCase()+e.slice(1)}`];n!==null&&r.loadedSkillRanges?.[e]&&(a=r.loadedSkillRanges[e][n]);let o=e===`leader`?`skillLeader`:`skill${e.charAt(0).toUpperCase()+e.slice(1)}`,s={...r,loadedSkillLevels:i,[o]:a},c=w(s),l=Math.floor(c/10)*10;return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...s,internalValue:String(l),isManualInternalEdit:!1}},autoDeck:s,internalValue:String(l),isManualInternalEdit:!1}})},$e=e=>{if(!U)return null;let t=W[e];if(!t||!ae[t])return null;let[n,r]=ae[t],i={leader:{val:g(Je,120),bloomLevel:W.leader},member2:{val:g(Ye,100),bloomLevel:W.member2},member3:{val:g(V,100),bloomLevel:W.member3},member4:{val:g(H,100),bloomLevel:W.member4},member5:{val:g(Xe,100),bloomLevel:W.member5}},a=0,o=1/0;return Object.entries(i).forEach(([t,n])=>{if(t===e)return;let r=n.val;n.bloomLevel&&ae[n.bloomLevel]&&(r=ae[n.bloomLevel][1]),a=Math.max(a,r),o=Math.min(o,r)}),{min:Math.min(n+Math.floor(o*.5),r),max:Math.min(n+Math.floor(a*.5),r)}},et=e=>e>=80?150:e>=70?140:e>=65?130:120,tt=e=>{if(!B.loadedBloomFesOriginalMembers?.[e])return null;let t={leader:Number(Je)||0,member2:Number(Ye)||0,member3:Number(V)||0,member4:Number(H)||0,member5:Number(Xe)||0},n=t[e];if(!n)return null;let r=et(n),i=1/0,a=0;return Object.entries(t).forEach(([t,n])=>{t!==e&&(i=Math.min(i,n||0),a=Math.max(a,n||0))}),i===1/0&&(i=0),{min:Math.min(n+Math.floor(i*.5),r),max:Math.min(n+Math.floor(a*.5),r)}},nt=e=>{let t=B.loadedVSBloomFesMembers?.[e];if(!t)return null;let n={leader:Number(Je)||0,member2:Number(Ye)||0,member3:Number(V)||0,member4:Number(H)||0,member5:Number(Xe)||0}[e];if(!n)return null;let r=t.unitBonus??0,i=Math.min(n+r,n+60);return{min:i,max:i}},rt=e=>{let t=$e(e)||tt(e)||nt(e);if(t)return t;if(B.loadedSkillLevels?.[e]){let t={leader:Number(Je),member2:Number(Ye),member3:Number(V),member4:Number(H),member5:Number(Xe)}[e]||0;return{min:t,max:t,isLoaded:!0}}return null},it=()=>{let e=(e,t,n)=>{let r=$e(e)||tt(e)||nt(e);if(r)return{min:r.min,max:r.max};let i=Number(t)||n;return{min:i,max:i}},t=e(`leader`,Je,120),n=e(`member2`,Ye,100),r=e(`member3`,V,100),i=e(`member4`,H,100),a=e(`member5`,Xe,100),o=t.min+n.min+r.min+i.min+a.min,s=t.max+n.max+r.max+i.max+a.max,c=Math.floor(t.min+(n.min+r.min+i.min+a.min)*.2),l=Math.floor(t.max+(n.max+r.max+i.max+a.max)*.2);return{minEffective:c,maxEffective:l,minInternalSum:o,maxInternalSum:s,leaderMin:t.min,leaderMax:t.max,hasRange:c!==l}},at=e=>{le(e),t(t=>{let n=t.unifiedDecks?.[`deck${_}`]||{},r={...n.loadedBloomFesOriginalMembers||{}};delete r[e];let i={...n.loadedVSBloomFesMembers||{}};delete i[e];let a={...n.loadedSkillLevels||{}};delete a[e];let o={...n,loadedBloomFesOriginalMembers:r,loadedVSBloomFesMembers:i,loadedSkillLevels:a},s=w(o),c=Math.floor(s/10)*10;return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...o,internalValue:String(c),isManualInternalEdit:!1}}}})},ot=()=>{t(e=>{let t={...e.unifiedDecks?.[`deck${_}`]||{},totalPower:``,skillLeader:``,skillMember2:``,skillMember3:``,skillMember4:``,skillMember5:``,eventBonus:``,isManualTotalPowerEdit:!1,isManualEventBonusEdit:!1,loadedSkillRanges:void 0,loadedSkillLevels:void 0,loadedBloomFesOriginalMembers:void 0,loadedVSBloomFesMembers:void 0,internalValue:``,isManualInternalEdit:!1};return{...e,unifiedDecks:{...e.unifiedDecks,[`deck${_}`]:t},autoDeck:t,power:``,effi:``,internalValue:``,isManualInternalEdit:!1}})},st=!!(B.loadedSkillRanges&&Object.keys(B.loadedSkillRanges).length>0),q=st&&!!qe&&!Ue,J=st&&!!Ze&&!We,bt=st&&(q||J||Object.values(B.loadedSkillLevels||{}).some(e=>e!=null)||Object.keys(B.loadedBloomFesOriginalMembers||{}).length>0||Object.keys(B.loadedVSBloomFesMembers||{}).length>0),xt=Object.values(B.loadedSkillLevels||{}).some(e=>e!=null),Y=(e,n,r=!0)=>{t(t=>{let i=t.unifiedDecks?.[`deck${_}`]||{},a=e.startsWith(`skill`)||e===`skillLeader`,o=i.loadedSkillLevels;if(a&&o){let t=e===`skillLeader`?`leader`:e.replace(`skill`,``).toLowerCase();i[e]!==n&&o[t]&&(o={...o,[t]:null})}let s={...i,[e]:n,...e===`totalPower`?{isManualTotalPowerEdit:r}:{},...e===`eventBonus`?{isManualEventBonusEdit:r}:{},...o?{loadedSkillLevels:o}:{}},c=w(s),l=Math.floor(c/10)*10,u=t.unifiedDecks?.[`deck${_}`]?.isManualInternalEdit||!1,d=!a&&u,f=d&&s.internalValue||String(l);return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...s,internalValue:f,isManualInternalEdit:d}},autoDeck:s,power:String(g(s.totalPower,293231)/1e4),effi:String(g(s.eventBonus,250)),internalValue:f,isManualInternalEdit:d}})};(0,j.useEffect)(()=>{e.unifiedDecks?.[`deck${_}`]&&t(e=>{let t=e.unifiedDecks?.[`deck${_}`];if(!t)return e;let n=ie(t);return{...e,activeDeckNum:_,autoDeck:{...t},power:String(g(t.totalPower,293231)/1e4),effi:String(g(t.eventBonus,250)),internalValue:t?.internalValue||(n?String(n):``),isManualInternalEdit:t?.isManualInternalEdit||!1,detailedSkills:t?.detailedSkills||{encore:``,member1:``,member2:``,member3:``,member4:``},isDetailedInput:t?.isDetailedInput||!1}})},[_]);let St=e=>{t(t=>{let n=typeof e==`function`?e(t):e,r=n.unifiedDecks?.[`deck${_}`]||B,i=ie(r),a=n.unifiedDecks?.[L],o=t.unifiedDecks?.[L],s=a||B;if(a===o&&o)return{...n,internalValue:a.internalValue,autoDeck:a,power:String(g(a.totalPower,293231)/1e4),effi:String(g(a.eventBonus,250))};let c=a?.internalValue!==o?.internalValue,l=a?.isManualInternalEdit??n.isManualInternalEdit??R,u=c&&a?a.internalValue:l?n.internalValue:String(i);return{...n,unifiedDecks:{...n.unifiedDecks,[`deck${_}`]:{...s,internalValue:u,isManualInternalEdit:l,detailedSkills:n.detailedSkills??z,isDetailedInput:n.isDetailedInput??Ge}},power:String(g(r.totalPower,293231)/1e4),effi:String(g(r.eventBonus,250)),internalValue:u,autoDeck:r}})},Ct=async()=>{if(Ae)return;if(!/^\d+$/.test(Se.trim())){Me(`숫자로 된 친구코드를 입력해 주세요.`);return}Me(``),I(!0),x(!1);let e=_,n=`deck${e}`;yt(`플레이어 데이터를 불러오는 중…`),r&&P&&!o&&a(Se,!0).catch(console.error);try{let r=o?null:we(),{totalPower:i,skillValues:a,eventBonus:s,loadedSkillRanges:c,loadedSkillLevels:l,loadedBloomFesOriginalMembers:u,loadedVSBloomFesMembers:d}=await Te(Se.trim(),Le(),e=>yt(e===`fallback`?`플레이어 데이터를 불러오는 중… 보조 서버로 재시도하고 있습니다.`:`플레이어 데이터를 불러오는 중…`),{skillLevels:r});yt(`플레이어 데이터를 화면에 반영하는 중…`);let f=performance.now();(0,M.flushSync)(()=>{v(e),t(t=>{let r=t.unifiedDecks?.[n]||{},o={...r,totalPower:i??r.totalPower,skillLeader:a[0],skillMember2:a[1],skillMember3:a[2],skillMember4:a[3],skillMember5:a[4],eventBonus:s,isManualTotalPowerEdit:i==null&&!!r.isManualTotalPowerEdit,isManualEventBonusEdit:!1,loadedSkillRanges:c,loadedSkillLevels:l,loadedBloomFesOriginalMembers:u,loadedVSBloomFesMembers:d},f=w(o),p=Math.floor(f/10)*10;return{...t,activeDeckNum:e,unifiedDecks:{...t.unifiedDecks,[n]:{...o,internalValue:String(p),isManualInternalEdit:!1}},autoDeck:o,power:String(g(o.totalPower,293231)/1e4),effi:String(g(o.eventBonus,250)),internalValue:String(p),isManualInternalEdit:!1}}),I(!1)}),console.info(`[친구코드 불러오기] 화면 반영`,`${Math.round(performance.now()-f)}ms`),yt(`플레이어 데이터 불러오기 완료 · 덱 ${e}`,`success`)}catch(e){I(!1),console.error(`Failed to load friend data`,e),yt(Ee(e),`error`)}},wt=de.find(e=>e.key===k.attr)||null,Tt=k.unit?ve.find(e=>e.key===k.unit):k.isMix?{key:`mix`,label:`스까`}:null,X=e=>U?(0,F.jsx)(s,{value:W[e]||0,onChange:t=>Qe(e,Number(t)),ariaLabel:l(`auto.bloom_fes_awakening`),buttonClassName:`!h-8 !min-w-[60px] !rounded-md !border-gray-200 !bg-gray-50 !px-6 !text-sm`,options:[{value:0,label:l(`auto.bloom_level_none`)||`X`},{value:1,label:l(`auto.bloom_level_1`)||`LV.1`},{value:2,label:l(`auto.bloom_level_2`)||`LV.2`},{value:3,label:l(`auto.bloom_level_3`)||`LV.3`},{value:4,label:l(`auto.bloom_level_4`)||`LV.4`}]}):null,Et=e=>B.loadedSkillLevels?.[e]?(0,F.jsx)(vt,{value:B.loadedSkillLevels[e],onChange:t=>K(e,t)}):null,Dt=(e,t,n,r)=>{let i=rt(e);if(i){let t=!!(B.loadedSkillLevels?.[e]||B.loadedBloomFesOriginalMembers?.[e]||B.loadedVSBloomFesMembers?.[e]);return(0,F.jsx)(`div`,{className:`${mt} ${t?`bg-indigo-50 text-indigo-700 hover:bg-indigo-100`:`bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}`,onClick:()=>t&&at(e),title:t?`클릭하여 직접 입력`:void 0,children:i.min===i.max?`${i.min}%`:`${i.min}~${i.max}%`})}return(0,F.jsx)(`input`,{type:`number`,value:t??``,onChange:e=>{let t=e.target.value;t!==``&&Number(t)>160&&(t=`160`),Y(n,t===``?``:Number(t))},onFocus:e=>{e.target.select(),le(null)},className:pt,placeholder:r,autoFocus:ce===e})},Ot=e=>(0,F.jsxs)(F.Fragment,{children:[!rt(e)&&(0,F.jsx)(`span`,{className:`text-gray-600`,children:`%`}),X(e),Et(e)]});return(0,F.jsxs)(`div`,{id:`deck-tab-content`,children:[(0,F.jsxs)(`div`,{className:`flex justify-center gap-2 mb-4 items-center`,children:[[1,2,3].map(e=>(0,F.jsxs)(`button`,{disabled:Ae,onClick:()=>{v(e),t(t=>({...t,activeDeckNum:e}))},className:`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${_===e?`bg-indigo-500 text-white shadow-md`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`,children:[l(`deck.deck_label`)||`덱`,` `,e]},e)),u===`ko`&&(0,F.jsxs)(`div`,{className:`relative`,children:[(0,F.jsx)(`button`,{onClick:()=>{!te&&ge()&&xe(ge()),x(e=>!e)},type:`button`,disabled:Ae,className:`deck-friend-load-button px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${te?`active`:``}`,children:l(`app.load`)||`불러오기`}),te&&(0,F.jsxs)(`div`,{className:`absolute top-full right-0 z-50 mt-2 w-64 max-w-[calc(100vw-1rem)] translate-x-4 rounded-lg border border-gray-200 bg-white p-3 shadow-xl md:left-1/2 md:right-auto md:w-64 md:-translate-x-1/2`,children:[(0,F.jsxs)(`div`,{className:`mb-2 flex items-center gap-2 whitespace-nowrap`,children:[(0,F.jsx)(`span`,{className:`text-sm font-bold text-gray-700`,children:`친구코드 입력`}),(0,F.jsxs)(`span`,{className:`text-[10px] font-bold text-red-500`,children:[`* `,o?`한국`:`일본`,` 서버에서만 동작`]}),!o&&(0,F.jsx)(Ce,{iconOnly:!0,kind:`card`,onOpen:()=>x(!1)})]}),(O.attr===`wl`||!O.attr&&k.attr===`wl`)&&(0,F.jsx)(`div`,{className:`mb-2 text-left text-xs font-bold text-red-500`,children:`* 월드 링크 서폿덱 미반영`}),(0,F.jsxs)(`div`,{className:`mb-2 grid grid-cols-2 gap-2`,children:[(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`div`,{className:`mb-1 text-left text-xs font-bold text-gray-600`,children:`속성`}),(0,F.jsx)(Oe,{value:O.attr,options:de,assetPath:`attributes`,iconOnly:!0,autoOption:wt,onChange:e=>be(t=>({...t,attr:e}))})]}),(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`div`,{className:`mb-1 text-left text-xs font-bold text-gray-600`,children:`유닛`}),(0,F.jsx)(Oe,{value:O.detailOpen?`mix`:O.unit,options:ve,assetPath:`units`,iconOnly:!0,extraOptions:[{key:`mix`,label:`스까`}],autoOption:Tt,onChange:Re})]})]}),(0,F.jsx)(`input`,{type:`text`,value:Se,disabled:Ae,onChange:e=>N(e.target.value),placeholder:`예: 3939393939393939`,className:`w-full border border-gray-300 rounded px-2 py-1 mb-2 text-sm focus:outline-none focus:border-blue-500`,style:{width:`100%`}}),r&&!o&&(0,F.jsx)(`div`,{className:`mb-3`,children:(0,F.jsxs)(`label`,{className:`flex items-center gap-1.5 cursor-pointer`,children:[(0,F.jsx)(`input`,{type:`checkbox`,checked:P,onChange:e=>{let t=e.target.checked;De(t),t||a(null,!1).catch(console.error)},className:`w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500`}),(0,F.jsx)(`span`,{className:`text-xs font-bold text-gray-700`,children:`계정에 저장`})]})}),(0,F.jsx)(`div`,{className:`mb-3 text-left text-[10px] font-bold text-red-500`,children:o?`스킬 레벨은 수동 입력해 주세요.`:l(`deck.imported_skill_levels`)}),O.detailOpen&&(0,F.jsxs)(`div`,{className:`mb-3 rounded-lg border border-gray-200 bg-gray-50 p-2`,children:[(0,F.jsxs)(`div`,{className:`mb-1 text-right text-[10px] font-bold text-gray-400`,children:[(O.characterOrder||[]).length,`/5`]}),(0,F.jsx)(`div`,{className:`mb-2 grid grid-cols-7 gap-1`,children:[...Array(26)].map((e,t)=>{let n=t+1,r=Fe(n),i=!!O.characters?.[n];return(0,F.jsxs)(`button`,{type:`button`,onClick:()=>ze(n),className:`h-8 w-8 overflow-hidden rounded-full border transition-all ${i?`ring-2 ring-indigo-500 ring-offset-1 scale-105`:`border-gray-200 opacity-70`}`,title:Ie(n),children:[(0,F.jsx)(`img`,{src:`/assets/characters/${String(n).padStart(2,`0`)}.webp`,alt:Ie(n),className:`h-full w-full object-cover`,onError:e=>{e.currentTarget.style.display=`none`}}),!r&&(0,F.jsx)(`span`,{className:`text-[10px]`,children:n})]},n)})}),he.some(e=>O.characters?.[e])&&(0,F.jsx)(`div`,{className:`space-y-1`,children:he.filter(e=>O.characters?.[e]).map(e=>(0,F.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,F.jsx)(`span`,{className:`w-10 text-left text-[10px] font-bold text-gray-500`,children:Ie(e)}),(0,F.jsx)(`div`,{className:`flex flex-wrap gap-1`,children:ve.map(t=>(0,F.jsx)(`button`,{type:`button`,onClick:()=>Be(e,t.key),className:`h-6 w-7 rounded border bg-white p-0.5 ${O.characters?.[e]===t.key?`ring-2 ring-indigo-500`:`border-gray-200`}`,title:t.label,children:(0,F.jsx)(`img`,{src:`/assets/event/units/${t.file}`,alt:t.label,className:`h-full w-full object-contain`})},t.key))})]},e))})]}),je&&(0,F.jsx)(`p`,{role:`alert`,className:`mb-2 text-xs text-red-600 whitespace-pre-wrap`,children:je}),(0,F.jsx)(`button`,{type:`button`,onClick:Ct,disabled:Ae,className:`w-full bg-blue-500 text-white rounded py-1.5 text-sm font-medium hover:bg-blue-600 disabled:opacity-50`,children:Ae?`불러오는 중...`:`불러오기`})]})]})]}),(0,F.jsxs)(ht,{className:xt?`deck-input-loaded-skills`:``,children:[(0,F.jsx)(_t,{label:l(`auto.total_power`),children:q?(0,F.jsx)(`div`,{className:`${mt} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`,onClick:()=>{_e(`totalPower`),Y(`totalPower`,``)},title:`클릭하여 직접 입력`,children:qe}):(0,F.jsx)(`input`,{type:`number`,value:qe??``,onChange:e=>{let t=e.target.value;t!==``&&Number(t)>55e4&&(t=`550000`),Y(`totalPower`,t===``?``:Number(t))},onBlur:e=>{let t=e.target.value;if(t===``)return;let n=Number(t);n>0&&n<=55?Y(`totalPower`,n*1e4):n>=100&&n<=550?Y(`totalPower`,n*1e3):n>=1e3&&n<=5500?Y(`totalPower`,n*100):n>=1e4&&n<=55e3&&Y(`totalPower`,n*10)},placeholder:`293231`,onFocus:e=>e.target.select(),className:pt,autoFocus:ue===`totalPower`})}),(0,F.jsx)(gt,{label:l(`auto.member_skills`),extraHeader:U?l(`auto.bloom_skill`)||`블룸각전`:null}),(0,F.jsx)(_t,{label:l(`auto.leader`),side:Ot(`leader`),children:Dt(`leader`,Je,`skillLeader`,`120`)}),[{label:l(`auto.member_2`),val:Ye,key:`skillMember2`,bloomKey:`member2`},{label:l(`auto.member_3`),val:V,key:`skillMember3`,bloomKey:`member3`},{label:l(`auto.member_4`),val:H,key:`skillMember4`,bloomKey:`member4`},{label:l(`auto.member_5`),val:Xe,key:`skillMember5`,bloomKey:`member5`}].map((e,t)=>(0,F.jsx)(_t,{label:e.label,side:Ot(e.bloomKey),children:Dt(e.bloomKey,e.val,e.key,`100`)},t)),(0,F.jsx)(_t,{label:l(`auto.event_bonus`),side:(0,F.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[!J&&(0,F.jsx)(`span`,{className:`text-gray-600`,children:`%`}),(0,F.jsxs)(`div`,{className:`flex flex-col items-start gap-1`,children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>E(!0),className:`deck-simulator-open-button inline-flex items-center justify-center h-5 px-2 rounded-full transition-colors text-[10px] font-bold`,children:l(`support.recommend_deck`)}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>C(!0),className:`deck-simulator-open-button inline-flex items-center justify-center h-5 px-2 rounded-full transition-colors text-[10px] font-bold`,title:l(`support.deck_simulator`)||`덱 시뮬레이터`,children:l(`support.deck_sim_btn`)||`덱시뮬`})]})]}),children:J?(0,F.jsxs)(`div`,{className:`${mt} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`,onClick:()=>{_e(`eventBonus`),Y(`eventBonus`,Ze)},title:`클릭하여 직접 입력`,children:[Ze,(0,F.jsx)(`span`,{className:`text-xs ml-0.5`,children:`%`})]}):(0,F.jsx)(`input`,{type:`number`,value:Ze??``,onChange:e=>{let t=e.target.value;Y(`eventBonus`,t===``?``:Number(t))},placeholder:`250`,onFocus:e=>e.target.select(),className:pt,autoFocus:ue===`eventBonus`})}),(0,F.jsx)(`div`,{className:`deck-input-actions`,children:(0,F.jsxs)(`div`,{className:`flex items-center justify-center gap-3`,children:[(0,F.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,F.jsx)(`span`,{className:`text-xs font-medium transition-colors duration-200 ${U?`text-indigo-600`:`text-gray-400`}`,children:l(`auto.bloom_fes_awakening`)||`블룸페스 각전`}),(0,F.jsx)(`button`,{role:`switch`,"aria-checked":U,onClick:()=>G(!U),className:`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${U?`bg-gradient-to-r from-indigo-500 to-purple-500`:`bg-gray-200`}`,children:(0,F.jsx)(`span`,{className:`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${U?`translate-x-4`:`translate-x-0`}`})})]}),bt&&(0,F.jsx)(`button`,{onClick:ot,title:`불러온 값 초기화`,className:`deck-loaded-reset-button flex items-center justify-center w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 hover:text-red-600 transition-all duration-150 shadow-sm hover:shadow`,children:(0,F.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2.5`,strokeLinecap:`round`,strokeLinejoin:`round`,className:`w-3.5 h-3.5`,children:[(0,F.jsx)(`path`,{d:`M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8`}),(0,F.jsx)(`path`,{d:`M3 3v5h5`})]})})]})})]}),(0,F.jsx)(`div`,{className:`flex justify-center gap-2 mb-2 mt-1`,children:[{key:`power`,label:l(`deck.power`)||`이벤포`,urlPath:`ep`},{key:`auto`,label:l(`deck.auto`)||`오토`,urlPath:`auto`}].map(e=>(0,F.jsx)(`button`,{onClick:()=>{let t=window.scrollY;ee(e.key),d(`/event/${e.urlPath}`,{replace:!0,preventScrollReset:!0}),ke(t)},className:`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${y===e.key?`bg-indigo-500 text-white shadow-md`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`,children:e.label},e.key))}),y===`power`&&!e.isComparisonMode&&(()=>{let e=it();return(0,F.jsxs)(`div`,{className:`flex flex-col items-center mb-4 mt-2`,children:[(0,F.jsxs)(`div`,{className:`flex flex-col items-center gap-1 mb-2`,children:[(0,F.jsxs)(`div`,{className:`flex items-center gap-4 text-base font-medium`,children:[(0,F.jsxs)(`div`,{children:[(0,F.jsxs)(`span`,{className:`text-gray-500`,children:[l(`deck.my_internal_value`),`: `]}),(0,F.jsx)(`span`,{className:`text-blue-600 font-bold`,children:e.hasRange?`${e.minEffective}~${e.maxEffective}%`:`${e.minEffective}%`})]}),(0,F.jsxs)(`div`,{children:[(0,F.jsxs)(`span`,{className:`text-gray-500`,children:[l(`internal.internal_sum`),`: `]}),(0,F.jsxs)(`span`,{className:`text-blue-600 font-bold`,children:[e.leaderMin,`/`,e.minInternalSum]})]})]}),(0,F.jsxs)(`div`,{className:`text-[10px] text-gray-400`,children:[`(`,l(`deck.formula_explanation`),`)`]})]}),(0,F.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,F.jsx)(`span`,{className:`text-sm font-medium text-gray-600`,children:l(`power.internal_value`)||`방 실효치`}),(0,F.jsx)(`input`,{type:`number`,value:Ve,onChange:e=>{let n=e.target.value;He(n),t(e=>{let t={...e};return t.unifiedDecks={...e.unifiedDecks,[L]:{...e.unifiedDecks?.[L],internalValue:n,isManualInternalEdit:!0}},t.internalValue=n,t.isManualInternalEdit=!0,t})},onFocus:e=>e.target.select(),className:`w-20 text-center border rounded px-2 py-1 text-sm font-bold ${R?`text-blue-600 border-blue-300`:`text-gray-700 border-gray-300`}`,placeholder:String(ie(Ke()))}),(0,F.jsx)(`span`,{className:`text-sm text-gray-500`,children:`%`})]})]})})(),(0,F.jsx)(`div`,{className:`deck-results-container`,children:(0,F.jsxs)(j.Suspense,{fallback:(0,F.jsx)(ft,{}),children:[Ne.auto&&(0,F.jsx)(`div`,{style:{display:y===`auto`?`block`:`none`},children:(0,F.jsx)(lt,{surveyData:e,setSurveyData:St,hideInputs:!0})}),Ne.power&&(0,F.jsx)(`div`,{style:{display:y===`power`?`block`:`none`},children:(0,F.jsx)(ut,{surveyData:e,setSurveyData:St,hideInputs:!0})})]})}),ne&&(0,F.jsx)(ct,{isOpen:ne,onClose:()=>C(!1),onApply:(e,t)=>{t!=null&&Y(`totalPower`,Math.round(t),!1),Y(`eventBonus`,Number(e.toFixed(1)),!1),C(!1)},onLoadSkill:e=>{if(e&&e.length===5){let n={},r={},i=[],a=[`leader`,`member2`,`member3`,`member4`,`member5`],o=re(e);e.forEach((e,t)=>{let s=a[t],c=Number(e.skillLevel)||1;n[s]=c;let{ranges:l,skillValue:u}=o[t];r[s]=l,i.push(u)}),t(e=>{let t=e.unifiedDecks?.[`deck${_}`]||{};return{...e,unifiedDecks:{...e.unifiedDecks,[`deck${_}`]:{...t,skillLeader:i[0],skillMember2:i[1],skillMember3:i[2],skillMember4:i[3],skillMember5:i[4],loadedSkillLevels:n,loadedSkillRanges:r,loadedBloomFesOriginalMembers:{},loadedVSBloomFesMembers:{},useBloomFes:!1}}}})}}}),T&&(0,F.jsx)(j.Suspense,{fallback:(0,F.jsx)(`p`,{role:`status`,children:l(`support.recommend_loading`)}),children:(0,F.jsx)(dt,{onClose:()=>E(!1),onApply:e=>{t(t=>{let n=`deck${_}`,r={...t.unifiedDecks?.[n],...e};return{...t,unifiedDecks:{...t.unifiedDecks,[n]:r},autoDeck:r,power:String(e.totalPower/1e4),effi:String(e.eventBonus),internalValue:e.internalValue,isManualInternalEdit:!1}}),E(!1)}})})]})}export{bt as default,ot as i,st as n,We as r,q as t};