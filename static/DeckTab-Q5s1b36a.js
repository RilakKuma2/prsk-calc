const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["static/EventDeckRecommendationModal-s-p6l62m.js","static/rolldown-runtime-XKyaHtl9.js","static/deckRecommendation-rwknDEUq.js","static/uiText-Bwtvy_xM.js","static/env-oEuwIDn6.js","static/index-BPs15Ff3.js","static/index-s9Y1Y4es.css","static/dataLoader-B79xY9d4.js","static/characterMapping-C4VH99pp.js","static/supportCardUtils-C8JX-WGV.js","static/deckUtils-BUNB__JJ.js","static/deckRecommendation-CMdpp-19.css","static/CardFilterBar-Dbi9RVRF.js","static/SupportCardPickerModal-CTwbnZ65.js","static/EventDeckRecommendationModal-BmYj54mp.css","static/AccountImportButton-DzLqZGDr.js","static/AccountImport-Dd0SbSFp.css","static/AutoTab-BqYDyuPp.js","static/InputComponents-Dv0ngIth.js","static/calculator-CbhDfzCU.js","static/mySekaiTableData-BdmewBqn.js","static/AllSongsTable-CaXr6jbX.js","static/autoSongSelection-DTMYuPAR.js","static/PowerTab-DYT6nN9G.js","static/SkillPushControl-Cslq1lYH.js","static/SkillPushControl-BnSwpZN7.css","static/noteScoreClient-DwVvP4gk.js","static/StandaloneRecommendation-Bid2E3HS.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-XKyaHtl9.js";import{A as n,O as r,P as i,a,c as o,i as s,l as c,s as l,t as u}from"./uiText-Bwtvy_xM.js";import{$ as d,F as f,G as p,I as m,L as h,N as g,P as ee,Q as _,R as te,V as ne,X as v,Y as y,_ as b,at as x,et as re,it as ie,j as S,m as ae,nt as oe,q as se,rt as C,tt as ce}from"./index-BPs15Ff3.js";import{i as le,n as ue,o as w,r as de,s as fe,t as pe}from"./deckUtils-BUNB__JJ.js";import{i as me,t as he}from"./supportCardUtils-C8JX-WGV.js";import{t as ge}from"./SupportCardPickerModal-CTwbnZ65.js";import{A as _e,D as ve,F as ye,I as be,M as xe,N as Se,O as Ce,P as we,i as T,j as E,k as D,r as Te,t as O}from"./deckRecommendation-rwknDEUq.js";import{h as k,n as A,t as j,u as Ee}from"./env-oEuwIDn6.js";import De from"./AccountImportButton-DzLqZGDr.js";var M=t(i()),N=t(x());function Oe(){let e=r(ae,null),t={};for(let n of Array.isArray(e?.ownedCardIds)?e.ownedCardIds:[]){if(!/^[1-9]\d{0,8}$/.test(String(n)))continue;let i={...e.cardDetails?.[n],...r(`ebc_card_stats_${n}`,{})},a=Number(i.skillLevel);Number.isInteger(a)&&a>=2&&a<=4&&(t[n]=a)}return Object.keys(t).length?t:null}function ke(e,t,n={}){let r=new URLSearchParams;if(n.attr&&r.set(`eventAttr`,n.attr),n.unit&&r.set(`eventUnit`,n.unit),n.characters){let e=Object.entries(n.characters).filter(([,e])=>e).map(([e,t])=>Number(e)>=21?`${e}:${t}`:e).join(`,`);e&&r.set(`eventCharacters`,e)}let i=r.toString();return`${e}/${t}${i?`?${i}`:``}`}async function P(e,t,n,r,i=null){let a=Date.now(),o=new AbortController,s=setTimeout(()=>o.abort(),3e4);try{let a=ke(e,t,n),s=i?await fetch(a,{method:`POST`,body:JSON.stringify(i),signal:o.signal,cache:`no-store`}):await fetch(a,{signal:o.signal,cache:`no-store`});if(i&&[400,405,411,413].includes(s.status)&&(s=await fetch(a,{signal:o.signal,cache:`no-store`})),!s.ok)return{ok:!1,code:`${r}: D01 (HTTP ${s.status})${s.status===403?` 접근이 차단되었습니다.`:``}`};let c=await s.json();return c?.error?{ok:!1,code:`${r}: D02 (${String(c.error).slice(0,200)})`}:!Array.isArray(c?.skillValues)||c.skillValues.length!==5?{ok:!1,code:`${r}: D02 (덱 정보 없음)`}:[c.totalPower,c.eventBonus,...c.skillValues].every(e=>typeof e==`number`&&Number.isFinite(e)&&e>=0)?{ok:!0,data:c}:{ok:!1,code:`${r}: D02 (종합력·배수·스킬 응답 형식 오류)`}}catch{return{ok:!1,code:`${r}: ${o.signal.aborted?`D04 (30초 응답 시간 초과)`:`D03 (연결 오류 또는 CORS 차단)`}`}}finally{clearTimeout(s),console.info(`[친구코드 불러오기]`,r,i?`스킬 레벨 포함`:`기본`,`${Date.now()-a}ms`)}}async function Ae(e,t={},n=()=>{},{skillLevels:r=null}={}){let i=y(),{deckApi:a,deckFallbackApi:o,isKorean:s}=v(i);n(`primary`);let c=await P(a,e,t,s?`한국 서버`:`기본 서버`,s?null:r);if(i!==y())throw Error(`서버가 변경되었습니다. 다시 불러와 주세요.`);if(c.ok)return c.data;if(!o)throw Error(c.code);n(`fallback`);let l=await P(o,e,t,`보조 서버`);if(i!==y())throw Error(`서버가 변경되었습니다. 다시 불러와 주세요.`);if(l.ok)return l.data;throw Error(`${c.code} / ${l.code}`)}function je(e){let t=String(e?.message||``);return/404|not found|存在し|見つか|user.*invalid/i.test(t)?`플레이어를 찾지 못했습니다. ${y()===`kr`?`한국`:`일본`} 서버 친구코드인지 확인해 주세요.`:/403/.test(t)?`서버가 접근을 차단했습니다. 잠시 후 다시 시도해 주세요.`:/429/.test(t)?`요청이 많아 잠시 제한되었습니다. 조금 뒤 다시 시도해 주세요.`:/D04|timeout|시간 초과/i.test(t)?`서버 응답이 늦어 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`:/D03|network|fetch/i.test(t)?`서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.`:/D02/.test(t)?`서버에서 올바른 덱 정보를 받지 못했습니다. 친구코드를 확인하거나 잠시 후 다시 시도해 주세요.`:`플레이어 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`}var F=C();function Me({value:e,onChange:t}){let{t:n}=oe(),[r,i]=(0,M.useState)(String(e));return(0,M.useEffect)(()=>i(String(e)),[e]),(0,F.jsxs)(`div`,{className:`ebc-wl-support-inputs`,children:[(0,F.jsxs)(`label`,{children:[(0,F.jsxs)(`span`,{children:[n(`support.support_bonus`),` `,(0,F.jsx)(`small`,{children:n(`support.recommend_support_theory`,{value:465})})]}),(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`input`,{type:`number`,inputMode:`decimal`,min:`0`,max:465,step:`0.1`,value:r,"aria-label":n(`support.support_bonus`),onFocus:e=>e.target.select(),onChange:e=>{let n=e.target.value;i(n),n!==``&&Number.isFinite(Number(n))&&t(Te(n))},onBlur:()=>i(String(e))}),(0,F.jsx)(`b`,{children:`%`})]})]}),(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:n(`support.support_shop_bonus`)}),(0,F.jsxs)(`div`,{className:`ebc-wl-support-readonly`,children:[(0,F.jsx)(`input`,{type:`number`,value:e/2,readOnly:!0,"aria-label":n(`support.support_shop_bonus`)}),(0,F.jsx)(`b`,{children:`%`})]})]})]})}var Ne=({value:e,options:t,onChange:n,assetPath:r,iconOnly:i=!1,extraOptions:o=[],autoOption:s=null})=>{let{t:c}=oe(),l=a(),[u,d]=(0,M.useState)(!1),f=(0,M.useRef)(null),p=[...t,...o],m=p.find(t=>t.key===e)||s,h=!e;(0,M.useEffect)(()=>{let e=e=>{f.current&&!f.current.contains(e.target)&&d(!1)};return u&&document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[u]);let g=e=>{n(e),d(!1)};return(0,F.jsxs)(`div`,{className:`relative`,ref:f,children:[(0,F.jsxs)(`button`,{type:`button`,onClick:()=>d(e=>!e),className:`flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-left shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300`,children:[(0,F.jsxs)(`span`,{className:`flex min-w-0 items-center gap-1.5`,children:[m?.file?(0,F.jsx)(`img`,{src:`/assets/event/${r}/${m.file}`,alt:l(m.label),className:`${i?`h-6 w-7`:`h-5 w-5`} shrink-0 object-contain`}):(0,F.jsx)(`span`,{className:`truncate text-sm font-bold text-gray-700`,children:l(m?.label)||c(`support.auto`)}),m?.file&&(0,F.jsx)(`span`,{className:`truncate text-sm font-bold text-gray-700`,children:l(m.label)}),h&&m&&(0,F.jsxs)(`span`,{className:`shrink-0 text-[10px] font-bold text-gray-400`,children:[`(`,c(`support.auto`)||`자동`,`)`]})]}),(0,F.jsx)(`svg`,{className:`ml-1 h-3 w-3 shrink-0 text-gray-400 transition-transform ${u?`rotate-180`:``}`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,children:(0,F.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2.5`,d:`M19 9l-7 7-7-7`})})]}),u&&(0,F.jsx)(`div`,{className:`absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/10`,children:(0,F.jsxs)(`div`,{className:i?`grid grid-cols-3 gap-1 p-1.5`:``,children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>g(``),className:`${i?`flex h-9 items-center justify-center rounded-md px-1 text-xs`:`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm`} font-bold transition-colors ${e?`text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700`:`bg-indigo-50 text-indigo-700`}`,title:c(`support.auto`)||`자동`,children:c(`support.auto`)||`자동`}),p.map(t=>(0,F.jsxs)(`button`,{type:`button`,onClick:()=>g(t.key),className:`${i?`flex h-9 items-center justify-center rounded-md px-1 text-xs`:`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm`} font-bold transition-colors ${e===t.key?`bg-indigo-50 text-indigo-700`:`text-gray-700 hover:bg-gray-50`}`,title:l(t.label),children:[t.file?(0,F.jsx)(`img`,{src:`/assets/event/${r}/${t.file}`,alt:l(t.label),className:`${i?`h-6 w-8`:`h-5 w-5`} object-contain`}):l(t.label),!i&&t.file&&l(t.label)]},t.key))]})})]})},Pe=(0,M.lazy)(()=>_(()=>import(`./EventDeckRecommendationModal-s-p6l62m.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]))),Fe=(0,M.lazy)(()=>_(()=>import(`./AccountImportButton-DzLqZGDr.js`),__vite__mapDeps([15,1,3,5,4,6,16]))),I={unit:10,gate:0,attr:10,titlePower:250,characterArea:20,characterRank:51,characterNui:0,multiUnit:0},Ie=k(j,`api/cards`),Le=[0,1,2,3,4,5],Re=5,ze=e=>{if(!e)return 0;if(String(e.type||``).toLowerCase()===`birthday`)return 1200;let t=String(e.rarity||e.cardRarity||``).toLowerCase();return t===`birthday`?1200:t===`4`?1500:t===`3`?900:t===`2`?600:t===`1`?300:0},Be=.1,Ve=40,He=[`param1`,`param2`,`param3`],Ue={rarity1:150,rarity2:300,rarity3:450,birthday:540,rarity4:600},L=[{key:`none`,label:`VS`,file:`Virtualsingerlogo.webp`},..._e],R=Ce.filter(e=>!D.includes(e.key)),We=[{key:`rarity4`,label:`★4`,typeBonus:25,masterRankBonus:[10,12.5,15,17.5,20,25],canPickup:!0,memberBonus:20},{key:`birthday`,label:`BN/AN`,typeBonus:25,masterRankBonus:[5,7,9,11,13,15],canPickup:!1},{key:`rarity3`,label:`★3`,typeBonus:25,masterRankBonus:[0,1,2,3,4,5],canPickup:!1},{key:`rarity2`,label:`★2`,typeBonus:25,masterRankBonus:[0,.2,.4,.6,.8,1],canPickup:!1},{key:`rarity1`,label:`★1`,typeBonus:25,masterRankBonus:[0,.1,.2,.3,.4,.5],canPickup:!1}],Ge=We.reduce((e,t)=>(e[t.key]=t,e),{"":u({key:``,typeBonus:0,masterRankBonus:[0,0,0,0,0,0],canPickup:!1},`비움`)}),Ke=()=>Array.from({length:Re},()=>({rarityKey:`rarity4`,masterRank:0,pickup:!1,featured:!0,typeMatched:!0,isAwakened:!0,skillLevel:1,canvas:!1})),z=e=>e&&typeof e==`object`&&!Array.isArray(e),qe=e=>{let t=Ke();return Array.isArray(e)?t.map((t,n)=>z(e[n])?{...t,...e[n]}:t):t},Je=e=>{let t=Number(n(e,`1`));return Number.isInteger(t)&&t>=1&&t<=3?t:1},B=(e,t,n)=>{let r=Number(e);return Number.isFinite(r)?Math.max(t,Math.min(n,r)):``},V=(e,t)=>e===``?``:B(e,0,t),Ye=(e,t)=>{if(e===``)return``;let n=Number(String(e).replace(/[^\d]/g,``));return Number.isFinite(n)?Math.max(0,Math.min(t,n)):``},Xe=e=>{if(e===``)return``;let t=Number(String(e).replace(/[^\d]/g,``));return Number.isFinite(t)?Math.max(0,t):``},Ze=e=>{if(e===``)return``;let t=Number(String(e).replace(/[^\d]/g,``));return Number.isFinite(t)?Math.max(0,t):``},Qe=e=>Number(e||0).toFixed(1).replace(/\.0$/,``),$e=e=>{if(e===``)return``;let t=Number(e);return Number.isFinite(t)?String(t):``},et=e=>{if(!e?.card)return 0;let t=e.card.type||e.card.cardRarityType||``;return e.rarityKey===`birthday`||t===`Birthday`||t===`Anniversary`?Ue.birthday:Ue[e.rarityKey||`rarity${Number(e.card.rarity)||4}`]||Ue.rarity4},H=e=>{let t=Math.max(0,Math.floor(Number(e)||0)),n=Math.floor(t/He.length),r=t%He.length;return He.map((e,t)=>n+ +(t<r))},U=e=>{if(!e)return H(0);let t=e.params||e.parameters||{},n=He.map((n,r)=>{let i=e[n]??t[n]??t[`power${r+1}`],a=Math.floor(Number(i)||0);return Math.max(0,a)});return n.reduce((e,t)=>e+t,0)>0?n:H(e.power||e.defaultPower||0)},tt=(e,t)=>{let n=Math.trunc(Number(t)||0);if(n===0)return e;let r=n<0?-1:1,i=Math.abs(n),a=Math.floor(i/He.length),o=i%He.length;return e.map((e,t)=>Math.max(0,e+r*(a+ +(t<o))))},W=e=>e.reduce((e,t)=>e+t,0),G=(e,t)=>{let n=Number(t)||0;return Math.floor(Math.max(0,Number(e)||0)*n/100)},K=(e,t)=>{let n=Number(t)||0,r=Math.trunc(n),i=Number((n-r).toFixed(6));return G(e,r)+(i>0?G(e,i):0)},nt=(e,t,n,r,i=0)=>G(e,t)+G(e,n)+G(e,i)+K(e,r),q=e=>(e?.type||e?.cardType||``)===`Unit Event Limited`||Number(e?.cardSupplyId)===6,rt=()=>({multiUnit:I.multiUnit,units:L.reduce((e,t)=>({...e,[t.key]:I.unit}),{}),gates:L.reduce((e,t)=>({...e,[t.key]:I.gate}),{}),attrs:R.reduce((e,t)=>({...e,[t.key]:I.attr}),{}),titlePower:I.titlePower,characters:he.reduce((e,t)=>({...e,[t.id]:{area:I.characterArea,rank:I.characterRank,nui:I.characterNui}}),{})}),it=(e={})=>{let t=rt();return{multiUnit:e.multiUnit===void 0||e.multiUnit===``?t.multiUnit:e.multiUnit,titlePower:e.titlePower===void 0||e.titlePower===``?t.titlePower:e.titlePower,units:L.reduce((n,r)=>{let i=e.units?.[r.key];return{...n,[r.key]:i===void 0||i===``?t.units[r.key]:i}},{}),gates:L.reduce((n,r)=>{let i=e.gates?.[r.key];return{...n,[r.key]:i===void 0||i===``?t.gates[r.key]:i}},{}),attrs:R.reduce((n,r)=>{let i=e.attrs?.[r.key];return{...n,[r.key]:i===void 0||i===``?t.attrs[r.key]:i}},{}),characters:he.reduce((n,r)=>{let i=e.characters?.[r.id]||{};return{...n,[r.id]:{...t.characters[r.id],...i,area:i.area===void 0||i.area===``?t.characters[r.id].area+(Number(e.multiUnit)||0):i.area,nui:i.nui===void 0||i.nui===``?t.characters[r.id].nui:i.nui}}},{})}},at=(e,t)=>{let n=e.filter(e=>e?.card),r=n.map(e=>(e.card.attr||e.card.cardAttr||e.card.attribute||``).toLowerCase()).filter(Boolean),i=n.map(e=>fe(e.card)).filter(Boolean),a=r.length===Re&&new Set(r).size===1,o=Object.values(S),s=n.map(e=>{let t=o.indexOf(fe(e.card));return 1<<((me(e.card)||e.card?.characterId)>20?0:t)|1<<t}),c=n.length===Re?s.reduce((e,t)=>e&t,63):0,l=c!==0,u=new Set(i).size>1,d=Number(t.multiUnit)||0,f=e.map(e=>{let n=U(e?.card),r=W(n),i=Math.max(0,Math.min(5,Number(e?.masterRank)||0)),s=e?.card?(i-5)*et(e):0,l=e?.card&&e.canvas?ze(e.card):0,f=W(tt(tt(n,s),l));if(!e?.card||f<=0)return{rawCardPower:0,masterRankPower:0,canvasPower:0,basePower:0,totalPower:0,areaPercent:0,areaItemBonus:0,characterRankBonus:0,titleBonus:0,furnitureBonus:0,gateBonus:0};let p=me(e.card)||e.card?.characterId,m=(e.card.attr||e.card.cardAttr||e.card.attribute||``).toLowerCase(),h=fe(e.card),g=t.characters?.[p]||{},ee=Number(g.rank),_=Math.min(Number.isFinite(ee)?ee:0,50)*.1,te=Math.max(0,+(Number(g.area||0)-d).toFixed(6)),ne=Number(g.nui||0),v=p>=21,y=v&&h!==`none`,b;if(v){if(y)b=Number(t.gates?.[h]||0)*Be;else{let e=L.map(e=>Number(t.gates?.[e.key]||0));b=Math.max(...e)*Be}}else b=Number(t.gates?.[h]||0)*Be;let x=v?[...new Set([`none`,h])]:[h],re=Math.max(0,...x.map(e=>Number(t.units?.[e]||0))),ie=Math.max(0,...x.map(e=>Number(t.units?.[e]||0)*(c&1<<o.indexOf(e)?2:1)));u&&(ie=Math.max(ie,re+d));let S=Number(t.attrs?.[m]||0)*(a?2:1),ae=te+d+ie+S,oe=ae+_+b,se=nt(f,te,ie,S,d),C=G(Math.max(0,f-(q(e.card)?Ve:0)),_),ce=Math.floor(f*b/100),le=Math.floor(f*ne/100);return{rawCardPower:r,masterRankPower:s,canvasPower:l,basePower:f,totalPower:f+se+C+0+le+ce,areaPercent:oe,areaItemPercent:ae,charRankBonus:_,unitBonus:ie,attrBonus:S,gateBonusPercent:b,furniturePercent:ne,areaItemBonus:se,characterRankBonus:C,titleBonus:0,furnitureBonus:le,gateBonus:ce}}),p=e=>f.reduce((t,n)=>t+(n[e]||0),0),m=Math.max(0,Math.floor(Number(t.titlePower||0))),h=p(`totalPower`)+m,g=p(`basePower`);return{allSameAttr:a,allSameUnit:l,slotPowers:f,rawCardPower:p(`rawCardPower`),masterRankPower:p(`masterRankPower`),canvasPower:p(`canvasPower`),basePower:g,totalPower:h,areaItemBonus:p(`areaItemBonus`),characterRankBonus:p(`characterRankBonus`),titleBonus:m,furnitureBonus:p(`furnitureBonus`),gateBonus:p(`gateBonus`)}},ot=(e,t,n=!1)=>{let r=Ge[e?.rarityKey]||Ge[``];if(!r.key)return{member:0,character:0,type:0,masterRank:0,total:0};let i=Math.max(0,Math.min(5,Number(e.masterRank)||0)),a=t?30:20,o={member:r.canPickup&&e.pickup?a:0,character:e.featured?n?50:25:0,type:e.typeMatched?r.typeBonus:0,masterRank:r.masterRankBonus[i]||0};return{...o,total:Object.values(o).reduce((e,t)=>e+t,0)}},st=({value:e,options:t,onChange:n,prefix:r,suffix:i=``,hidePrefixOnMobile:a=!1,formatOption:o})=>{let[s,c]=(0,M.useState)(!1),l=(0,M.useRef)(null),u=e=>o?o(e):`${e}${i}`;return(0,M.useEffect)(()=>{if(!s)return;let e=e=>{l.current&&!l.current.contains(e.target)&&c(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[s]),(0,F.jsxs)(`div`,{className:`ebc-select`,ref:l,children:[(0,F.jsxs)(`button`,{type:`button`,className:`ebc-select-button ${s?`open`:``}`,onClick:()=>c(!s),children:[(0,F.jsx)(`span`,{className:`ebc-prefix-label ${a?`hide-on-mobile`:``}`,children:r}),(0,F.jsx)(`strong`,{children:u(e)})]}),s&&(0,F.jsx)(`div`,{className:`ebc-select-menu`,children:t.map(t=>(0,F.jsx)(`button`,{type:`button`,className:t===e?`selected`:``,onClick:()=>{n(t),c(!1)},children:u(t)},t))})]})},ct=({value:e,options:t,onChange:n,prefix:r,hidePrefixOnMobile:i=!1})=>{let[a,o]=(0,M.useState)(!1),s=(0,M.useRef)(null),c=t.find(t=>t.key===e)||t[0];return(0,M.useEffect)(()=>{if(!a)return;let e=e=>{s.current&&!s.current.contains(e.target)&&o(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[a]),(0,F.jsxs)(`div`,{className:`ebc-select`,ref:s,children:[(0,F.jsxs)(`button`,{type:`button`,className:`ebc-select-button ${a?`open`:``}`,onClick:()=>o(!a),children:[(0,F.jsx)(`span`,{className:`ebc-prefix-label ${i?`hide-on-mobile`:``}`,children:r}),(0,F.jsx)(`strong`,{children:c.label})]}),a&&(0,F.jsx)(`div`,{className:`ebc-select-menu`,children:t.map(t=>(0,F.jsx)(`button`,{type:`button`,className:t.key===e?`selected`:``,onClick:()=>{n(t.key),o(!1)},children:t.label},t.key||`empty`))})]})},lt=({rarityKey:e,masterRank:t=0,skillLevel:n=1,skillText:r=null,emptyText:i=s(`비움`),previewCharId:a=21,card:o=null,isAwakened:c=!0})=>{let l=(e=>e===`birthday`?4:e===`rarity3`?3:e===`rarity2`?2:e===`rarity1`?1:e?4:0)(e),u=e===`birthday`,d=u?`cardFrame_bd.webp`:l>0&&l<=2?`frame_2star.webp`:`Frame.webp`,f=(o?Number(o.rarity)>2&&o.type!==`Birthday`&&o.type!==`Anniversary`:e===`rarity4`||e===`rarity3`)&&c,p=f?`after_training`:`normal`,m=u?`rairity_birth.webp`:f?`afterstar.webp`:`star_normal.webp`,h=Math.max(0,Math.min(5,Number(t)||0)),g=o?(o.attr||o.cardAttr||o.attribute||`pure`).toLowerCase():null,ee=o?k(A,`face/res0${String(me(o)||1).padStart(2,`0`)}_no${String(o?.card_image_id||`001`).padStart(3,`0`)}_${p}.webp`):k(A,`face/res0${String(a).padStart(2,`0`)}_no001_${p}.webp`);return(0,F.jsxs)(`div`,{className:`ebc-preview-card ${e?``:`empty`}`,children:[(0,F.jsx)(`img`,{className:`ebc-card-face`,src:ee,alt:``,onError:e=>{e.target.src=k(A,`face/res021_no001_normal.webp`)}}),(0,F.jsx)(`img`,{className:`ebc-card-frame`,src:`/assets/card_style/${d}`,alt:``}),g&&(0,F.jsx)(`img`,{className:`ebc-card-attribute`,src:`/assets/card_style/${g}.webp`,alt:``}),e&&u&&(0,F.jsx)(`img`,{className:`ebc-card-birthday`,src:`/assets/card_style/${m}`,alt:``}),e&&!u&&(0,F.jsx)(`div`,{className:`ebc-card-stars`,children:Array.from({length:l},(e,t)=>(0,F.jsx)(`img`,{src:`/assets/card_style/${m}`,alt:``},t))}),(0,F.jsx)(`div`,{className:`ebc-skill-badge`,children:e?r||`SLV.${n}`:i}),h>0&&(0,F.jsx)(`img`,{className:`ebc-mastery-badge`,src:`/assets/card_style/masterRank_S_${h}.webp`,alt:``})]})},ut=(e=Je(`ebc_active_area_preset`))=>{if(e===1&&n(`ebc_area_preset_1`)===null){let e=n(`ebc_area_settings`);e&&c(`ebc_area_preset_1`,e)}let t=r(`ebc_area_preset_${e}`,null,z);return m(t?it(t):rt(),r(`sekai-game-area-effects-v1`,{}).effects||{})},dt=(e,t,n)=>{let r=[];try{Object.values(e.units||{}).every(e=>Number(e)===I.unit)&&r.push(n(`support.unit`)||`유닛`),Object.values(e.attrs||{}).every(e=>Number(e)===I.attr)&&r.push(n(`support.type`)||`타입`),Object.values(e.gates||{}).every(e=>Number(e)===I.gate)&&r.push(n(`support.gate`)||`게이트`);let i=!0,a=!0;for(let t of Object.keys(e.characters||{})){let n=e.characters[t]||{};Number(n.area)-(Number(e.multiUnit)||0)!==I.characterArea&&(i=!1),Number(n.nui)!==I.characterNui&&(a=!1)}i&&r.push(n(`support.character`)||`캐릭터`),a&&r.push(n(`support.nui`)||`누이`),h(e,t,I.characterRank)||r.push(n(`support.character_rank_short`))}catch(e){console.error(e)}return r},ft=({isOpen:e,onClose:t,onApply:i,onLoadSkill:s,initialRecommendation:l=!1})=>{let{t:u,language:d}=oe(),p=a(),[m,h]=(0,M.useState)(()=>r(`ebc_is_world_link`,!1,e=>typeof e==`boolean`)),[_,ne]=(0,M.useState)(()=>Te(n(`ebc_support_bonus`))),[v,y]=(0,M.useState)(()=>({detailOpen:!1,characters:{},characterOrder:[],...r(`ebc_event_override`,ve,z)})),[x,ie]=(0,M.useState)(ve),[se,C]=(0,M.useState)(!1),ce=(0,M.useRef)(null),ue=(0,M.useRef)(!1),[w,de]=(0,M.useState)(()=>r(`ebc_is_manual_event`,!1,e=>typeof e==`boolean`)),[fe,pe]=(0,M.useState)(()=>Je(`ebc_active_preset`)),[ye,we]=(0,M.useState)(()=>{let e=Je(`ebc_active_area_preset`);return n(`ebc_area_snapshot_${e}`)!==null}),[D,A]=(0,M.useState)(()=>{let e=Je(`ebc_active_preset`);return qe(r(`ebc_preset_${e}`,null,Array.isArray)||r(`ebc_main_deck_slots`,null,Array.isArray))}),[j,De]=(0,M.useState)(()=>Je(`ebc_active_area_preset`)),[N,Oe]=(0,M.useState)(()=>ut()),[ke,P]=(0,M.useState)(!1),[Ae,je]=(0,M.useState)(!1),[Re,ze]=(0,M.useState)(!1),[Be,Ve]=(0,M.useState)(!1),[Ue,B]=(0,M.useState)(!1),[et,H]=(0,M.useState)(``),[U,tt]=(0,M.useState)(!1),[W,G]=(0,M.useState)({unit:I.unit,gate:I.gate,attr:I.attr,characterArea:I.characterArea,characterRank:I.characterRank,characterNui:I.characterNui}),[K,nt]=(0,M.useState)(null),[q,ft]=(0,M.useState)(`area`),[pt,mt]=(0,M.useState)(()=>{let e=n(`ebc_last_char_id`);return e?Number(e):21}),[J,ht]=(0,M.useState)([]),[Y,gt]=(0,M.useState)(!1),[_t,vt]=(0,M.useState)(``),[yt,bt]=(0,M.useState)(()=>r(`sekai-card-collection-v1`,{}).ownedCardIds||[]),[xt,St]=(0,M.useState)(null);(0,M.useEffect)(()=>{e||St(null)},[e]),(0,M.useEffect)(()=>{e&&window.dispatchEvent(new CustomEvent(g))},[e]),(0,M.useEffect)(()=>{if(!e)return;let t=e=>{bt(r(`sekai-card-collection-v1`,{}).ownedCardIds||[]),e?.detail?.kind===`card`&&!w&&A(qe(r(`ebc_preset_${fe}`,r(`ebc_main_deck_slots`,[])))),[`furniture`,`area`,`character`].includes(e?.detail?.kind)&&Oe(it(r(`ebc_area_preset_${j}`,{})))};return t(),window.addEventListener(b,t),()=>window.removeEventListener(b,t)},[e,w,fe,j]);let Ct=re({isOpen:e,onClose:t}),wt=re({isOpen:ke,onClose:()=>P(!1)}),Tt=re({isOpen:U,onClose:()=>tt(!1)}),Et=re({isOpen:Be,onClose:()=>Ve(!1)}),Dt=re({isOpen:Ue,onClose:()=>B(!1)}),Ot=re({isOpen:Ae,onClose:()=>je(!1)});(0,M.useEffect)(()=>{let t=!0;return e&&J.length===0&&(gt(!0),fetch(Ie,{cache:`reload`}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{t&&(ht(Array.isArray(e)?e:[]),gt(!1))}).catch(e=>{console.error(`Failed to load cards:`,e),t&&(vt(p(`카드 목록을 불러오지 못했습니다.`)),gt(!1))})),()=>{t=!1}},[e,J.length]),(0,M.useEffect)(()=>{if(!J.length)return;let e=new Map(J.map(e=>[Number(e.id),e]));A(t=>{let n=!1,r=t.map(t=>{if(!t.card?.id)return t;let r=e.get(Number(t.card.id));return!r||!(He.some(e=>t.card[e]!==r[e])||t.card.power!==r.power)?t:(n=!0,{...t,card:{...t.card,...r}})});return n?r:t})},[J]);let[X,kt]=(0,M.useState)(null);(0,M.useEffect)(()=>{let e=!0;return fetch(k(Ee,`mysekaiFixtures.json`),{cache:`no-cache`}).then(e=>e.json()).then(t=>{if(!e)return;let n={1:`一歌`,2:`咲希`,3:`穂波`,4:`志歩`,5:`みのり`,6:`遥`,7:`愛莉`,8:`雫`,9:`こはね`,10:`杏`,11:`彰人`,12:`冬弥`,13:`司`,14:`えむ`,15:`寧々`,16:`類`,17:`奏`,18:`まふゆ`,19:`絵名`,20:`瑞希`,21:`ミク`,22:`リン`,23:`レン`,24:`ルカ`,25:`MEIKO`,26:`KAITO`},r=999,i=-1;for(let e=1;e<=26;e++){let a=n[e];if(!a)continue;let o=t.filter(e=>e.name&&e.name.includes(`${a}のぬいぐるみ`)).length,s=Math.floor(o/3);s<r&&(r=s),s>i&&(i=s)}r===999&&(r=0),i===-1&&(i=0),kt({min:r,max:i})}).catch(e=>console.warn(`Failed to fetch mysekaiFixtures.json`,e)),()=>{e=!1}},[]),(0,M.useEffect)(()=>{o(`ebc_is_world_link`,m)},[m]),(0,M.useEffect)(()=>{c(`ebc_support_bonus`,_)},[_]),(0,M.useEffect)(()=>{o(`ebc_main_deck_slots`,D),o(`ebc_preset_${fe}`,D)},[D,fe]),(0,M.useEffect)(()=>{o(`ebc_area_preset_${j}`,N)},[N,j]),(0,M.useEffect)(()=>{o(`ebc_is_manual_event`,w)},[w]),(0,M.useEffect)(()=>{o(`ebc_event_override`,v)},[v]),(0,M.useEffect)(()=>{if(e&&!w)return C(!1),be(e=>{ie(e);let t=ce.current||e;ce.current=null,y(t),h(t.attr===`wl`),C(!0)},e=>{console.warn(`Failed to auto load event override`,e),C(!0)})},[e,w]);let At=(0,M.useCallback)(e=>{y(t=>e===`mix`?{...t,unit:``,detailOpen:!0}:{...t,unit:e,detailOpen:!1,characters:{},characterOrder:[]})},[]),jt=(0,M.useCallback)(e=>{y(t=>{let n={...t.characters||{}},r=[...t.characterOrder||[]].filter(t=>t!==e);if(n[e])delete n[e];else{if(r.length>=5){let e=r.shift();delete n[e]}n[e]=e>=21?`none`:xe[e],r.push(e)}return{...t,characters:n,characterOrder:r}})},[]),Mt=(0,M.useCallback)((e,t)=>{y(n=>({...n,characters:{...n.characters||{},[e]:t}}))},[]),Nt=(0,M.useCallback)(e=>{let t=he.find(t=>t.id===e);return t?t.name:String(e)},[]),Pt=(e,t)=>{if(!e||!t)return{typeMatched:!1,featured:!1};let n=e.attr||e.cardAttr||e.attribute||``,r=me(e),i=t.attr===`wl`,a=t.attr===`memories`,o={"Leo/need":`light_sound`,"MORE MORE JUMP！":`idol`,"Vivid BAD SQUAD":`street`,"ワンダーランズ×ショウタイム":`theme_park`,"25時、ナイトコードで。":`school_refusal`},s=e.supportUnit||e.support_unit||``;o[s]&&(s=o[s]),!s&&r>=21&&(s=o[e.unit]||e.unit||`none`);let c=!1;if(t.characters&&Object.keys(t.characters).length>0){if(t.characters[r]){if(r>=21){let e=t.characters[r];c=e===`none`?s===`none`||!s:s===e||s===`none`||!s}else c=!0}else c=!1}else t.unit&&(c=a?r>=21?t.unit===E.key&&(s===`none`||!s):xe[r]===t.unit:r>=21?s===t.unit||s===`none`:xe[r]===t.unit);return{typeMatched:i?!1:a?!!n:t.attr?n===t.attr:!1,featured:c}},Ft=(0,M.useCallback)((e,t)=>!e||!t||(Number(e.rarity)||0)!==4||w&&(t.attr||t.unit)?!1:(t.eventCardIds||[]).includes(Number(e.id)),[w]);(0,M.useEffect)(()=>{e&&v&&A(e=>e.map(e=>{if(!e.card)return e;let t=Pt(e.card,v),n=Ft(e.card,v);return e.typeMatched===t.typeMatched&&e.featured===t.featured&&e.pickup===n?e:{...e,typeMatched:t.typeMatched,featured:t.featured,pickup:n}}))},[v,e,w,Ft]);let Z=(e,t)=>{A(n=>{let i=[...n],a=i[e],s={...a,...t};if(!w&&a.card&&(`skillLevel`in t||`masterRank`in t)){let e=`ebc_card_stats_${a.card.id}`,n=r(e,{},z);`skillLevel`in t&&(n.skillLevel=t.skillLevel),`masterRank`in t&&(n.masterRank=t.masterRank),o(e,n)}if(Object.prototype.hasOwnProperty.call(t,`rarityKey`)){let e=!!t.rarityKey;if(s.masterRank=e?a.masterRank:0,t.card){let e=Pt(t.card,v);if(s.typeMatched=e.typeMatched,s.featured=e.featured,s.pickup=Ft(t.card,v),!w){let e=`ebc_card_stats_${t.card.id}`,n=r(e,{},z);n.skillLevel!==void 0&&(s.skillLevel=n.skillLevel),n.masterRank!==void 0&&(s.masterRank=n.masterRank)}}else e?s.pickup=e&&t.rarityKey===`rarity4`?a.pickup:!1:(s.featured=!1,s.typeMatched=!1,s.pickup=!1)}return s.rarityKey!==`rarity4`&&(s.pickup=!1),i[e]=s,i})},It=(e,t)=>{Oe(e),te(e,t)},Lt=(e,t)=>{It({...N,units:{...N.units,[e]:V(t,20)}},[`unit:${Object.keys(S).find(t=>S[t]===e)}`])},Rt=(e,t)=>{Oe(n=>({...n,gates:{...n.gates,[e]:Ye(t,70)}}))},zt=(e,t)=>{It({...N,attrs:{...N.attrs,[e]:V(t,20)}},[`attribute:${e}`])},Bt=e=>It(ee(N,V(e,20)),[`multiUnit`]),Vt=e=>{Oe(t=>({...t,titlePower:Xe(e)}))},Ht=(e,t,n)=>{let r={area:40+(Number(N.multiUnit)||0),nui:10},i=t===`rank`?Ze(n):V(n,r[t]||30),a={...N,characters:{...N.characters,[e]:{...N.characters?.[e],[t]:i}}};t===`rank`&&i!==``&&f(j),t===`area`?It(a,[`character:${e}`]):Oe(a)},Ut=e=>{let t=new Blob([e],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`area_settings.json`,document.body.appendChild(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),0)},Wt=e=>{if(e===j)return;let t=r(`ebc_area_preset_${e}`,null,z);Oe(t?it(t):rt()),De(e),c(`ebc_active_area_preset`,String(e))},Gt=()=>{f(j),It({...N,units:L.reduce((e,t)=>({...e,[t.key]:W.unit}),{}),gates:L.reduce((e,t)=>({...e,[t.key]:W.gate}),{}),attrs:R.reduce((e,t)=>({...e,[t.key]:W.attr}),{}),characters:he.reduce((e,t)=>({...e,[t.id]:{...N.characters?.[t.id],area:W.characterArea,rank:W.characterRank,nui:W.characterNui}}),{})}),tt(!1)},Kt=!w&&!m&&v?.attr===`memories`,qt=(0,M.useMemo)(()=>{if(m){let e=new Set;return D.map(t=>{let n=(t.card?.attr||t.card?.attribute||``).toLowerCase(),r=!!n&&!e.has(n);n&&e.add(n);let i={...t,typeMatched:t.rarityKey?r:!1};return{slot:i,rarityOption:Ge[t.rarityKey]||Ge[``],bonus:ot(i,m)}})}return D.map(e=>({slot:e,rarityOption:Ge[e.rarityKey]||Ge[``],bonus:ot(e,m,Kt)}))},[D,m,Kt]),Jt=(0,M.useMemo)(()=>qt.reduce((e,t)=>e+t.bonus.total,0),[qt])+(m&&Number(_)||0),Q=(0,M.useMemo)(()=>at(D,N),[D,N]),$=(0,M.useMemo)(()=>dt(N,j,u),[N,j,u]),Yt=(0,M.useCallback)(()=>{let e=r(ae,{});if(!O(e)){window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{type:`error`,duration:2400,message:u(`support.recommend_import_required`)}}));return}let t=!w&&v===x&&m===(x.attr===`wl`);St({cards:J,collection:e,areaSettings:N,eventOverride:v,isWorldLink:m,supportBonus:_,missingInputs:$,eventControls:t?{}:T(v,m)})},[J,N,v,x,w,m,_,$,u]);(0,M.useEffect)(()=>{e?l&&!ue.current&&(w||se||!O(r(`sekai-card-collection-v1`,{})))&&(ue.current=!0,Yt()):ue.current=!1},[e,l,w,se,Yt]);let Xt=(e,t=J,n={})=>{let r=new Map(t.map(e=>[Number(e.id),e])),i=n.eventOverride||v;n.eventOverride&&(y(i),(w||!se)&&(ce.current=i));let a=n.isWorldLink??m;h(a),a&&ne(Te(e.supportBonus)),de(!1),A(qe(e.members.map(e=>{let t=r.get(e.cardId),n=t?.type===`Birthday`||t?.type===`Anniversary`,a=Pt(t,i);return{card:t,rarityKey:n?`birthday`:`rarity${Number(t?.rarity)}`,masterRank:e.masterRank,skillLevel:e.skillLevel,canvas:!0,typeMatched:a.typeMatched,featured:a.featured,pickup:Ft(t,i)}}))),St(null)},Zt=(0,M.useMemo)(()=>[{label:u(`support.base_power`)||`퍼포먼스`,value:Q.basePower||0},{label:u(`support.area_item_bonus`)||`에어리어 아이템보너스`,value:Q.areaItemBonus||0},{label:u(`support.character_rank_bonus`)||`캐릭터 랭크 보너스`,value:Q.characterRankBonus||0},{label:u(`support.title_bonus`)||`칭호 보너스`,value:Q.titleBonus||0},{label:u(`support.furniture_bonus`)||`가구 보너스`,value:Q.furnitureBonus||0},{label:u(`support.gate_bonus`)||`게이트 보너스`,value:Q.gateBonus||0}],[Q,u]),Qt=(0,M.useMemo)(()=>{if(w||!D.every(e=>e.card!=null))return null;let e=le(D).map(e=>e.skillValue);return e[0]+(e[1]+e[2]+e[3]+e[4])*.2},[D,w]);return e?(0,F.jsxs)(`div`,{className:`ebc-backdrop`,onMouseDown:e=>{e.target===e.currentTarget&&t()},children:[(0,F.jsxs)(`div`,{ref:Ct,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-main-title`,tabIndex:-1,className:`ebc-modal ${d===`ja`?`lang-ja`:``}`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsxs)(`div`,{className:`ebc-header`,children:[(0,F.jsx)(`h2`,{id:`ebc-main-title`,children:u(`support.deck_simulator`)||`덱 시뮬레이터`}),(0,F.jsx)(M.Suspense,{fallback:null,children:(0,F.jsx)(Fe,{kind:`card`,className:`ebc-optimal-import`})}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-close-btn`,onClick:t,"aria-label":u(`support.close`)||`닫기`,children:`✕`})]}),(0,F.jsxs)(`div`,{className:`ebc-content`,children:[(0,F.jsxs)(`div`,{className:`ebc-config-panel`,children:[(0,F.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`24px`,flexWrap:`wrap`},children:[(0,F.jsxs)(`label`,{className:`ebc-checkbox-label`,style:{margin:0,fontWeight:`bold`,fontSize:`14px`,color:`#334155`,display:`flex`,alignItems:`center`},children:[(0,F.jsx)(`input`,{type:`checkbox`,checked:w,onChange:e=>de(e.target.checked)}),(0,F.jsx)(`span`,{className:`ebc-checkbox-text`,style:{marginLeft:`8px`,lineHeight:`normal`,transform:`translateY(1px)`},children:u(`support.manual_input`)||`수동 입력`})]}),(0,F.jsxs)(`label`,{className:`ebc-checkbox-label`,style:{margin:0,fontWeight:`bold`,fontSize:`14px`,color:`#334155`,display:`flex`,alignItems:`center`},children:[(0,F.jsx)(`input`,{type:`checkbox`,checked:m,onChange:e=>h(e.target.checked)}),(0,F.jsx)(`span`,{className:`ebc-checkbox-text`,style:{marginLeft:`8px`,lineHeight:`normal`,transform:`translateY(1px)`},children:u(`support.world_link_mode`)})]}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-open-btn ${ke?`active`:``}`,onClick:()=>P(e=>!e),children:(0,F.jsx)(`span`,{children:u(`support.area_settings`)||`에어리어`})}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-open-btn ebc-recommend-trigger`,onClick:Yt,children:u(`support.recommend_deck`)})]}),(!w||m)&&(0,F.jsxs)(`div`,{className:`ebc-options-row`,children:[!w&&(()=>{let e=Ce.find(e=>e.key===x.attr)||null,t=(v.attr||x.attr)===`memories`,n=x.unit?[..._e,E].find(e=>e.key===x.unit):x.isMix?{key:`mix`,label:u(`support.mix`)||`스까`}:null;return(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`12px`,flex:1,minWidth:`200px`},children:[(0,F.jsxs)(`div`,{style:{flex:1},children:[(0,F.jsx)(`div`,{style:{marginBottom:`4px`,fontSize:`11px`,fontWeight:`bold`,color:`#94a3b8`},children:u(`support.attribute`)||`속성`}),(0,F.jsx)(Ne,{value:v.attr,options:Ce,assetPath:`attributes`,iconOnly:!0,autoOption:e,onChange:e=>{y(t=>({...t,attr:e,...e!==`memories`&&t.unit===E.key?{unit:``}:{}})),h(e===`wl`)}})]}),(0,F.jsxs)(`div`,{style:{flex:1},children:[(0,F.jsx)(`div`,{style:{marginBottom:`4px`,fontSize:`11px`,fontWeight:`bold`,color:`#94a3b8`},children:u(`support.unit`)||`유닛`}),(0,F.jsx)(Ne,{value:v.detailOpen?`mix`:v.unit,options:_e,assetPath:`units`,iconOnly:!0,extraOptions:[...t||v.unit===E.key?[E]:[],{key:`mix`,label:u(`support.mix`)||`스까`}],autoOption:n,onChange:At})]})]})})(),!w&&v.detailOpen&&(0,F.jsxs)(`div`,{className:`ebc-mix-panel`,children:[(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`8px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`11px`,fontWeight:`bold`,color:`#64748b`},children:u(`support.select_mix_characters`)||`스까 인선 선택`}),(0,F.jsxs)(`span`,{style:{fontSize:`11px`,fontWeight:`bold`,color:`#6366f1`},children:[(v.characterOrder||[]).length,`/5`]})]}),(0,F.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(13, 1fr)`,gap:`3px`,marginBottom:`8px`},children:Array.from({length:26},(e,t)=>{let n=t+1,r=!!v.characters?.[n];return(0,F.jsx)(`button`,{type:`button`,onClick:()=>jt(n),title:Nt(n),style:{width:`100%`,aspectRatio:`1/1`,borderRadius:`50%`,border:r?`2px solid #6366f1`:`1px solid #cbd5e1`,overflow:`hidden`,padding:0,background:`#fff`,cursor:`pointer`,transform:r?`scale(1.1)`:`scale(1)`,opacity:r?1:.6,transition:`all 0.1s`,boxSizing:`border-box`},children:(0,F.jsx)(`img`,{src:`/assets/characters/${String(n).padStart(2,`0`)}.webp`,alt:Nt(n),style:{width:`100%`,height:`100%`,objectFit:`cover`,display:`block`},onError:e=>{e.currentTarget.style.display=`none`}})},n)})}),Se.some(e=>v.characters?.[e])&&(0,F.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`4px`,paddingTop:`6px`,borderTop:`1px solid #e2e8f0`},children:Se.filter(e=>v.characters?.[e]).map(e=>(0,F.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`4px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`10px`,fontWeight:`bold`,color:`#64748b`,minWidth:`28px`},children:Nt(e)}),(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`3px`,flexWrap:`wrap`},children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>Mt(e,`none`),title:u(`support.virtual_singer`)||`버추얼싱어`,style:{height:`20px`,padding:`0 5px`,border:v.characters?.[e]===`none`?`2px solid #6366f1`:`1px solid #cbd5e1`,borderRadius:`4px`,background:v.characters?.[e]===`none`?`#e0e7ff`:`#fff`,cursor:`pointer`,fontSize:`9px`,fontWeight:`bold`,color:v.characters?.[e]===`none`?`#4f46e5`:`#64748b`,whiteSpace:`nowrap`},children:`VS`},`none`),_e.map(t=>(0,F.jsx)(`button`,{type:`button`,onClick:()=>Mt(e,t.key),title:t.label,style:{width:`24px`,height:`20px`,border:v.characters?.[e]===t.key?`2px solid #6366f1`:`1px solid #cbd5e1`,borderRadius:`4px`,background:`#fff`,padding:`1px`,cursor:`pointer`},children:(0,F.jsx)(`img`,{src:`/assets/event/units/${t.file}`,alt:t.label,style:{width:`100%`,height:`100%`,objectFit:`contain`}})},t.key))]})]},e))})]}),m&&(0,F.jsx)(Me,{value:_,onChange:ne})]})]}),(0,F.jsxs)(`div`,{className:`ebc-deck-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-deck-header`,children:[(0,F.jsxs)(`span`,{className:`ebc-power-total`,children:[(0,F.jsx)(`span`,{children:u(`support.total_power`)||`종합력`}),(0,F.jsx)(`strong`,{children:Q.totalPower.toLocaleString()}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-power-info-btn`,onClick:()=>je(!0),"aria-label":u(`support.power_detail`)||`종합력 상세`,children:`i`})]}),$.length>0&&(0,F.jsxs)(`div`,{className:`ebc-missing-inputs`,role:`status`,"aria-label":u(`support.missing_inputs`),children:[$.map(e=>(0,F.jsx)(`span`,{children:e},e)),(0,F.jsx)(`span`,{children:u(`support.missing_inputs`)})]})]}),(0,F.jsx)(`div`,{className:`ebc-deck-grid`,children:qt.map(({slot:e,bonus:t},n)=>{let r=!!e.rarityKey,i=Ge[e.rarityKey]?.canPickup,a=Q.slotPowers[n]||{};return(0,F.jsxs)(`div`,{className:`ebc-slot`,children:[(0,F.jsxs)(`div`,{className:`ebc-slot-header`,children:[(0,F.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`4px`},children:(e.card?Number(e.card.rarity)>2&&e.card.type!==`Birthday`&&e.card.type!==`Anniversary`:e.rarityKey===`rarity4`||e.rarityKey===`rarity3`)?(0,F.jsx)(`button`,{type:`button`,className:`ebc-awaken-toggle ${e.isAwakened?`awakened`:`unawakened`}`,onClick:t=>{t.stopPropagation(),Z(n,{isAwakened:!e.isAwakened})},title:e.isAwakened?u(`support.awakened`):u(`support.unawakened`),children:e.isAwakened?u(`support.awakened`):u(`support.unawakened`)}):null}),(0,F.jsxs)(`strong`,{children:[`+`,t.total,`%`]})]}),(0,F.jsx)(`div`,{className:`ebc-preview-wrap`,style:{cursor:`pointer`,transition:`transform 0.1s`},onClick:()=>{let t=e.card;mt(t&&me(t)||21),nt(n),ze(!0)},onMouseOver:e=>e.currentTarget.style.transform=`scale(1.05)`,onMouseOut:e=>e.currentTarget.style.transform=`scale(1)`,title:u(`support.select_card`)||`카드 선택`,children:(0,F.jsx)(lt,{rarityKey:e.rarityKey,masterRank:e.masterRank,skillLevel:e.skillLevel||1,skillText:String(e.skillLevel||1),emptyText:u(`support.empty`),card:e.card,isAwakened:e.isAwakened!==!1})}),(0,F.jsxs)(`div`,{className:`ebc-slot-power-row`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-canvas-toggle ${e.canvas?`active`:``}`,onClick:()=>Z(n,{canvas:!e.canvas}),disabled:!e.card,style:d===`ja`?{fontSize:`10px`,letterSpacing:`-0.5px`}:void 0,children:u(`support.canvas`)||`캔버스`}),(0,F.jsx)(`span`,{className:`ebc-slot-base-power`,title:`${u(`support.after_area_bonus`)||`에어리어 적용 후`} ${(a.totalPower||0).toLocaleString()} (${Qe(a.areaPercent||0)}%)`,children:(0,F.jsx)(`strong`,{children:(a.basePower||0).toLocaleString()})})]}),(0,F.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr 1fr`,gap:`4px`,textAlign:`center`,fontSize:`10px`,fontWeight:`bold`,color:`#64748b`,marginBottom:`2px`,padding:`0 2px`},children:[(0,F.jsx)(`span`,{children:u(`support.rarity`)||`레어`}),(0,F.jsx)(`span`,{children:u(`support.skill`)||`스킬`}),(0,F.jsx)(`span`,{children:u(`support.master_rank`)||`마랭`})]}),(0,F.jsxs)(`div`,{className:`ebc-control-grid`,style:{gridTemplateColumns:`1fr 1fr 1fr`},children:[(0,F.jsx)(ct,{value:e.rarityKey,options:We,onChange:e=>Z(n,{rarityKey:e})}),(0,F.jsx)(st,{value:e.skillLevel||1,options:[1,2,3,4],onChange:e=>Z(n,{skillLevel:e})}),(0,F.jsx)(st,{value:e.masterRank,options:Le,onChange:e=>Z(n,{masterRank:e})})]}),(0,F.jsxs)(`div`,{className:`ebc-toggle-row`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-toggle ${e.typeMatched?`active`:``} ${m?`wl-auto`:``}`,onClick:()=>!m&&Z(n,{typeMatched:!e.typeMatched}),disabled:!r||m,title:m?u(`support.wl_auto_apply`):``,children:u(`support.type`)}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-toggle ${e.featured?`active`:``}`,onClick:()=>Z(n,{featured:!e.featured}),disabled:!r,children:u(`support.featured`)}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-toggle ${e.pickup?`active`:``}`,onClick:()=>Z(n,{pickup:!e.pickup}),disabled:!i,children:u(`support.pickup`)})]}),(0,F.jsxs)(`div`,{className:`ebc-breakdown`,children:[(0,F.jsxs)(`span`,{children:[u(`support.member`),` `,(0,F.jsxs)(`b`,{children:[t.member,`%`]})]}),(0,F.jsxs)(`span`,{children:[u(`support.featured`),` `,(0,F.jsxs)(`b`,{children:[t.character,`%`]})]}),(0,F.jsxs)(`span`,{children:[u(`support.type`),` `,(0,F.jsxs)(`b`,{children:[t.type,`%`]})]}),(0,F.jsxs)(`span`,{children:[u(`support.master_rank`),` `,(0,F.jsxs)(`b`,{children:[t.masterRank,`%`]})]})]})]},n)})}),(0,F.jsx)(`div`,{style:{display:`flex`,justifyContent:`flex-end`,marginBottom:`8px`},children:(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-reset`,style:{background:`#8b5cf6`,color:`#fff`,border:`none`,padding:`6px 12px`,borderRadius:`6px`,fontSize:`13px`,fontWeight:`600`},onClick:()=>{s&&(s(D),window.dispatchEvent(new CustomEvent(`show-toast`,{detail:u(`app.toast.skill_loaded`)||`스킬 정보가 입력되었습니다.`})))},children:u(`support.load_skill`)||`스킬 불러오기`})}),(0,F.jsxs)(`div`,{className:`ebc-deck-toolbar`,children:[(0,F.jsx)(`div`,{className:`ebc-toolbar-presets`,children:[1,2,3].map(e=>(0,F.jsxs)(`button`,{type:`button`,className:`ebc-preset-load-btn ${fe===e?`active`:``}`,onClick:()=>{let t=qe(r(`ebc_preset_${e}`,null,Array.isArray));pe(e),c(`ebc_active_preset`,String(e)),A(t)},title:`${u(`support.preset`)||`프리셋`} ${e}`,children:[`P`,e]},e))}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-reset`,onClick:()=>{window.confirm(u(`support.reset_confirm`)||`현재 설정한 덱을 모두 초기화하시겠습니까?`)&&A(Ke())},children:u(`support.reset`)||`리셋`})]})]})]}),(0,F.jsxs)(`div`,{className:`ebc-footer-wrapper`,children:[m&&(0,F.jsx)(`div`,{className:`ebc-footer-info`,children:u(`support.world_link_mode_desc`)}),(0,F.jsxs)(`div`,{className:`ebc-footer`,children:[(0,F.jsxs)(`div`,{className:`ebc-footer-total`,children:[u(`support.final_event_bonus`),` `,(0,F.jsxs)(`strong`,{children:[Jt.toFixed(1),`%`]}),Qt!==null&&(0,F.jsxs)(`span`,{style:{marginLeft:`12px`,fontSize:`13px`,color:`#64748b`},children:[u(`internal.effective_value`)||`실효치`,`: `,(0,F.jsxs)(`strong`,{children:[Qt.toFixed(1),`%`]})]})]}),(0,F.jsxs)(`div`,{className:`ebc-footer-actions`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-cancel`,onClick:t,children:u(`rank.cancel`)||`취소`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-apply`,style:{background:`#0ea5e9`},onClick:()=>i(Jt,Q.totalPower||null),children:u(`support.apply`)||`적용`})]})]})]})]}),ke&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&P(!1)},children:(0,F.jsxs)(`div`,{ref:wt,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-area-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>P(!1),"aria-label":u(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-floating-head`,children:[(0,F.jsx)(`h3`,{id:`ebc-area-title`,children:u(`support.area_settings`)||`에어리어`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-totals`,style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`6px`},children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>tt(!0),className:`ebc-btn-batch`,children:u(`support.batch_apply`)||`일괄적용`}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>Ve(!0),className:`ebc-btn-save`,children:u(`app.save`)||`저장`}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>{H(``),B(!0)},className:`ebc-btn-load`,children:u(`app.load`)||`불러오기`})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`6px`},children:[(0,F.jsx)(`div`,{className:`ebc-toolbar-presets`,style:{margin:0},children:[1,2,3].map(e=>(0,F.jsxs)(`button`,{type:`button`,className:`ebc-preset-load-btn ${j===e?`active`:``}`,onClick:()=>{Wt(e),we(n(`ebc_area_snapshot_${e}`)!==null)},title:`${u(`support.area_preset`)||`에어리어 프리셋`} ${e}`,children:[`P`,e]},e))}),(0,F.jsxs)(`div`,{className:`ebc-toolbar-snapshot mobile-only`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-save-btn`,onClick:()=>{let e=o(`ebc_area_snapshot_${j}`,N);we(e),e&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:`P${j} ${u(`support.snapshot_saved`)||`임시저장 완료`}`}))},children:u(`support.snapshot_save`)||`임시저장`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-load-btn ${ye?``:`disabled`}`,disabled:!ye,onClick:()=>{let e=r(`ebc_area_snapshot_${j}`,null,z);e&&It(it(e))},children:u(`support.snapshot_load`)||`불러오기`})]})]})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-end`},children:[(0,F.jsxs)(`div`,{className:`ebc-title-power-editor`,children:[(0,F.jsx)(`span`,{children:u(`support.title_bonus`)||`칭호 보너스`}),(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,step:`1`,value:N.titlePower??``,onChange:e=>Vt(e.target.value),onFocus:e=>e.target.select(),"aria-label":`${u(`support.title_bonus`)} ${u(`support.total_power`)}`}),(0,F.jsx)(`b`,{children:u(`support.total_power`)||`종합력`})]})]}),(0,F.jsxs)(`div`,{className:`ebc-toolbar-snapshot pc-only`,children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-save-btn`,onClick:()=>{let e=o(`ebc_area_snapshot_${j}`,N);we(e),e&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:`P${j} ${u(`support.snapshot_saved`)||`임시저장 완료`}`}))},children:u(`support.snapshot_save`)||`임시저장`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-snapshot-load-btn ${ye?``:`disabled`}`,disabled:!ye,onClick:()=>{let e=r(`ebc_area_snapshot_${j}`,null,z);e&&It(it(e))},children:u(`support.snapshot_load`)||`불러오기`})]})]})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,children:[(0,F.jsx)(`span`,{children:u(`support.unit_effect`)||`유닛 효과`}),Q.allSameUnit&&(0,F.jsx)(`strong`,{children:`×2`})]}),(0,F.jsxs)(`div`,{className:`ebc-area-unit-header`,children:[(0,F.jsx)(`span`,{}),(0,F.jsx)(`span`,{children:u(`support.area`)||`에어리어`}),(0,F.jsx)(`span`,{children:u(`support.gate`)||`게이트`})]}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid units`,children:L.map(e=>(0,F.jsxs)(`label`,{className:`ebc-area-game-pill`,children:[(0,F.jsx)(`span`,{className:`ebc-area-pill-media`,children:(0,F.jsx)(`img`,{src:`/assets/event/units/${e.file}`,alt:e.label})}),(0,F.jsxs)(`span`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`20`,step:`0.1`,value:N.units?.[e.key]??``,onChange:t=>Lt(e.key,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.label} ${u(`support.unit_effect`)||`유닛 효과`}`}),(0,F.jsx)(`b`,{children:`%`})]}),(0,F.jsxs)(`span`,{className:`ebc-area-pill-input gate`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`70`,step:`1`,value:N.gates?.[e.key]??``,onChange:t=>Rt(e.key,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.label} ${u(`support.gate`)||`게이트`}`}),(0,F.jsx)(`b`,{children:`Lv`})]})]},e.key))})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsx)(`div`,{className:`ebc-area-game-title`,children:(0,F.jsx)(`span`,{children:u(`support.multi_unit_effect`)})}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input`,style:{maxWidth:180},children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`20`,step:`0.1`,value:N.multiUnit??0,"aria-label":u(`support.multi_unit_effect`),onChange:e=>Bt(e.target.value),onFocus:e=>e.target.select()}),(0,F.jsx)(`b`,{children:`%`})]})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,children:[(0,F.jsx)(`span`,{children:u(`support.type_effect`)||`타입 효과`}),Q.allSameAttr&&(0,F.jsx)(`strong`,{children:`×2`})]}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid attrs`,children:R.map(e=>(0,F.jsxs)(`label`,{className:`ebc-area-game-pill attr`,children:[(0,F.jsx)(`span`,{className:`ebc-area-pill-media icon`,children:(0,F.jsx)(`img`,{src:`/assets/event/attributes/${e.file}`,alt:e.label})}),(0,F.jsxs)(`span`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`20`,step:`0.1`,value:N.attrs?.[e.key]??``,onChange:t=>zt(e.key,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.label} ${u(`support.type_effect`)||`타입 효과`}`}),(0,F.jsx)(`b`,{children:`%`})]})]},e.key))})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,style:{display:`flex`,flexDirection:`column`,gap:`8px`,alignItems:`stretch`},children:[$.length>0&&(0,F.jsxs)(`div`,{className:`mobile-only`,style:{textAlign:`left`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:u(`support.input_prompt`)||` 정보를 입력하세요`})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,alignItems:`center`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`area`?`active`:``}`,onClick:()=>ft(`area`),children:u(`support.area`)||`에어리어`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`nui`?`active`:``}`,onClick:()=>ft(`nui`),children:u(`support.nui`)||`누이`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`rank`?`active`:``}`,onClick:()=>ft(`rank`),children:u(`support.character_rank_short`)||`캐랭`}),$.length>0&&(0,F.jsxs)(`div`,{className:`pc-only`,style:{marginLeft:`4px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:u(`support.input_prompt`)||` 정보를 입력하세요`})]})]}),(0,F.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`},children:X&&(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#6366f1`,fontWeight:`bold`},children:X.min===X.max?(u(`support.current_nui_single`)||`현재 누이 {{val}}세트`).replace(`{{val}}`,X.min):(u(`support.current_nui`)||`현재 누이 {{min}}~{{max}}세트`).replace(`{{min}}`,X.min).replace(`{{max}}`,X.max)})})]})]}),(0,F.jsx)(`div`,{className:`ebc-area-character-grid`,children:he.map(e=>{let t=N.characters?.[e.id]||{};return(0,F.jsxs)(`div`,{className:`ebc-area-character-pill`,children:[(0,F.jsx)(`div`,{className:`ebc-area-character-face`,children:(0,F.jsx)(`img`,{src:`/assets/stamps/${String(e.id).padStart(2,`0`)}.webp`,alt:e.name})}),(0,F.jsxs)(`div`,{className:`ebc-area-character-fields`,children:[q===`area`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:u(`support.area`)||`에어리어`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:40+(Number(N.multiUnit)||0),step:`0.1`,value:t.area??``,onChange:t=>Ht(e.id,`area`,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.name} ${u(`support.area`)||`에어리어`}`}),(0,F.jsx)(`b`,{children:`%`})]})]}),q===`rank`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:u(`support.character_rank_short`)||`캐랭`}),(0,F.jsx)(`input`,{type:`text`,inputMode:`numeric`,value:$e(t.rank),onChange:t=>Ht(e.id,`rank`,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.name} ${u(`support.character_rank_short`)||`캐랭`}`})]}),q===`nui`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:u(`support.nui`)||`누이`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`10`,step:`0.1`,value:t.nui??``,onChange:t=>Ht(e.id,`nui`,t.target.value),onFocus:e=>e.target.select(),"aria-label":`${e.name} ${u(`support.nui`)||`누이`}`}),(0,F.jsx)(`b`,{children:`%`})]})]})]})]},e.id)})})]})]}),(0,F.jsx)(`div`,{className:`ebc-area-floating-footer`,children:(0,F.jsx)(`button`,{type:`button`,onClick:()=>P(!1),children:u(`support.close`)||`닫기`})})]})}),U&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&tt(!1)},children:(0,F.jsxs)(`div`,{ref:Tt,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-batch-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>tt(!1),"aria-label":u(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,children:[(0,F.jsx)(`div`,{className:`ebc-area-floating-head`,children:(0,F.jsx)(`h3`,{id:`ebc-batch-title`,children:u(`support.batch_apply`)||`일괄 적용`})}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-body`,children:[(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsx)(`div`,{className:`ebc-area-game-title`,children:(0,F.jsx)(`span`,{children:u(`support.unit_gate_effect`)||`유닛 / 게이트 효과`})}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid units`,style:{gridTemplateColumns:`1fr`},children:(0,F.jsxs)(`div`,{className:`ebc-area-game-pill unit`,children:[(0,F.jsx)(`div`,{className:`ebc-area-pill-media`,children:(0,F.jsx)(`img`,{src:`/assets/event/units/Lnlogo.webp`,alt:`Leo/need`})}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`30`,step:`0.1`,value:W.unit??``,onChange:e=>G(t=>({...t,unit:V(e.target.value,30)}))}),(0,F.jsx)(`b`,{children:`%`})]}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input gate`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`70`,step:`1`,value:W.gate??``,"aria-label":u(`support.gate`),onChange:e=>G(t=>({...t,gate:Ye(e.target.value,70)}))}),(0,F.jsx)(`b`,{children:`LV`})]})]})})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsx)(`div`,{className:`ebc-area-game-title`,children:(0,F.jsx)(`span`,{children:u(`support.type_effect`)})}),(0,F.jsx)(`div`,{className:`ebc-area-game-grid attrs`,style:{gridTemplateColumns:`1fr`},children:(0,F.jsxs)(`div`,{className:`ebc-area-game-pill attr`,children:[(0,F.jsx)(`div`,{className:`ebc-area-pill-media`,children:(0,F.jsx)(`img`,{src:`/assets/event/attributes/cool.webp`,alt:`Cool`})}),(0,F.jsxs)(`label`,{className:`ebc-area-pill-input`,children:[(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`30`,step:`0.1`,value:W.attr??``,onChange:e=>G(t=>({...t,attr:V(e.target.value,30)}))}),(0,F.jsx)(`b`,{children:`%`})]})]})})]}),(0,F.jsxs)(`section`,{className:`ebc-area-game-section`,children:[(0,F.jsxs)(`div`,{className:`ebc-area-game-title`,style:{display:`flex`,flexDirection:`column`,gap:`8px`,alignItems:`stretch`},children:[$.length>0&&(0,F.jsxs)(`div`,{className:`mobile-only`,style:{textAlign:`left`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:u(`support.input_prompt`)||` 정보를 입력하세요`})]}),(0,F.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,alignItems:`center`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`area`?`active`:``}`,onClick:()=>ft(`area`),children:u(`support.area`)||`에어리어`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`nui`?`active`:``}`,onClick:()=>ft(`nui`),children:u(`support.nui`)||`누이`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-char-tab ${q===`rank`?`active`:``}`,onClick:()=>ft(`rank`),children:u(`support.character_rank_short`)||`캐랭`}),$.length>0&&(0,F.jsxs)(`div`,{className:`pc-only`,style:{marginLeft:`4px`},children:[(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#dc2626`,fontWeight:`bold`},children:$.join(`, `)}),(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#f87171`,fontWeight:`600`},children:u(`support.input_prompt`)||` 정보를 입력하세요`})]})]}),(0,F.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`},children:X&&(0,F.jsx)(`span`,{style:{fontSize:`13px`,color:`#6366f1`,fontWeight:`bold`},children:X.min===X.max?(u(`support.current_nui_single`)||`현재 누이 {{val}}세트`).replace(`{{val}}`,X.min):(u(`support.current_nui`)||`현재 누이 {{min}}~{{max}}세트`).replace(`{{min}}`,X.min).replace(`{{max}}`,X.max)})})]})]}),(0,F.jsx)(`div`,{className:`ebc-area-character-grid`,style:{gridTemplateColumns:`1fr`},children:(0,F.jsxs)(`div`,{className:`ebc-area-character-pill`,children:[(0,F.jsx)(`div`,{className:`ebc-area-character-face`,children:(0,F.jsx)(`img`,{src:`/assets/stamps/01.webp`,alt:`Miku`})}),(0,F.jsxs)(`div`,{className:`ebc-area-character-fields`,children:[q===`area`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:u(`support.area`)||`에어리어`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:40+(Number(N.multiUnit)||0),step:`0.1`,value:W.characterArea??``,onChange:e=>G(t=>({...t,characterArea:V(e.target.value,40+(Number(N.multiUnit)||0))}))}),(0,F.jsx)(`b`,{children:`%`})]})]}),q===`rank`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:u(`support.character_rank_short`)||`캐랭`}),(0,F.jsx)(`input`,{type:`text`,inputMode:`numeric`,value:$e(W.characterRank),onChange:e=>G(t=>({...t,characterRank:Ze(e.target.value)}))})]}),q===`nui`&&(0,F.jsxs)(`label`,{children:[(0,F.jsx)(`span`,{children:u(`support.nui`)||`누이`}),(0,F.jsxs)(`div`,{className:`ebc-area-character-input`,children:[(0,F.jsx)(`b`,{children:`+`}),(0,F.jsx)(`input`,{type:`number`,min:`0`,max:`10`,step:`0.1`,value:W.characterNui??``,onChange:e=>G(t=>({...t,characterNui:V(e.target.value,10)}))}),(0,F.jsx)(`b`,{children:`%`})]})]})]})]})})]})]})]}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-footer`,style:{gap:`12px`},children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>tt(!1),children:u(`support.close`)||`닫기`}),(0,F.jsx)(`button`,{type:`button`,className:`ebc-btn-apply`,onClick:Gt,children:u(`support.batch_apply`)||`일괄적용`})]})]})}),Be&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&Ve(!1)},children:(0,F.jsxs)(`div`,{ref:Et,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-save-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),style:{maxWidth:`400px`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>Ve(!1),"aria-label":u(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,style:{padding:`24px 24px 0`},children:[(0,F.jsx)(`div`,{className:`ebc-area-floating-head`,children:(0,F.jsx)(`h3`,{id:`ebc-save-title`,children:u(`support.save_area_settings`)||`에어리어 설정 저장`})}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-body`,style:{padding:`0 0 16px`},children:[(0,F.jsx)(`p`,{style:{fontSize:`13px`,color:`#555`,marginBottom:`8px`},children:u(`support.save_area_desc`)||`현재 설정을 텍스트로 복사하거나 파일로 다운로드합니다.`}),(0,F.jsx)(`textarea`,{readOnly:!0,value:JSON.stringify(N),style:{width:`100%`,height:`150px`,fontSize:`11px`,fontFamily:`inherit`,borderRadius:`8px`,border:`1px solid #ccc`,padding:`8px`,boxSizing:`border-box`,whiteSpace:`pre-wrap`,wordBreak:`break-all`,resize:`none`}})]})]}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-footer`,style:{display:`flex`,flexDirection:`column`,gap:`12px`,padding:`16px 24px 20px`,background:`linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%)`,borderBottomLeftRadius:`12px`,borderBottomRightRadius:`12px`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`10px`,width:`100%`},children:[(0,F.jsx)(`button`,{type:`button`,style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},onClick:()=>{navigator.clipboard.writeText(JSON.stringify(N)).then(()=>alert(p(`복사되었습니다.`)))},children:u(`support.text_copy`)||`텍스트 복사`}),(0,F.jsx)(`button`,{type:`button`,style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},onClick:()=>Ut(JSON.stringify(N)),children:u(`support.file_download`)||`파일 다운로드`})]}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>Ve(!1),style:{width:`100%`,minWidth:0,height:`48px`,padding:`0`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`},children:u(`support.close`)||`닫기`})]})]})}),Ue&&(0,F.jsx)(`div`,{className:`ebc-area-floating-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&B(!1)},children:(0,F.jsxs)(`div`,{ref:Dt,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`ebc-load-title`,tabIndex:-1,className:`ebc-area-floating-modal`,onMouseDown:e=>e.stopPropagation(),style:{maxWidth:`400px`},children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-area-floating-close`,onClick:()=>B(!1),"aria-label":u(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-scroll`,style:{padding:`24px 24px 0`},children:[(0,F.jsx)(`div`,{className:`ebc-area-floating-head`,children:(0,F.jsx)(`h3`,{id:`ebc-load-title`,children:u(`support.load_area_settings`)||`에어리어 설정 불러오기`})}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-body`,style:{padding:`0 0 16px`},children:[(0,F.jsx)(`p`,{style:{fontSize:`13px`,color:`#555`,marginBottom:`8px`},children:u(`support.load_area_desc`)||`복사한 텍스트를 아래에 붙여넣거나 파일을 업로드하세요.`}),(0,F.jsx)(`textarea`,{value:et,onChange:e=>H(e.target.value),placeholder:u(`support.paste_json_placeholder`)||`여기에 텍스트를 붙여넣으세요...`,style:{width:`100%`,height:`150px`,fontSize:`11px`,fontFamily:`inherit`,borderRadius:`8px`,border:`1px solid #ccc`,padding:`8px`,boxSizing:`border-box`,whiteSpace:`pre-wrap`,wordBreak:`break-all`,resize:`none`}})]})]}),(0,F.jsxs)(`div`,{className:`ebc-area-floating-footer`,style:{display:`flex`,flexDirection:`column`,gap:`12px`,padding:`16px 24px 20px`,background:`linear-gradient(to bottom, rgba(240,240,248,0.75), #f0f0f8 42%)`,borderBottomLeftRadius:`12px`,borderBottomRightRadius:`12px`},children:[(0,F.jsxs)(`div`,{style:{display:`flex`,gap:`10px`,width:`100%`},children:[(0,F.jsxs)(`label`,{style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,display:`flex`,alignItems:`center`,justifyContent:`center`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`},children:[(0,F.jsx)(`span`,{style:{whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},children:u(`support.file_upload`)||`파일 업로드`}),(0,F.jsx)(`input`,{type:`file`,accept:`.json`,style:{display:`none`},onChange:e=>{let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=e=>H(e.target.result),n.readAsText(t)}})]}),(0,F.jsx)(`button`,{type:`button`,style:{flex:1,minWidth:0,height:`48px`,padding:`0 8px`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},onClick:()=>{try{let e=JSON.parse(et);e&&e.characters?(It(it(e)),alert(p(`불러왔습니다.`)),B(!1)):alert(p(`올바른 설정 데이터가 아닙니다.`))}catch{alert(p(`JSON 파싱 오류입니다. 텍스트를 확인해주세요.`))}},children:u(`support.apply`)||`적용`})]}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>B(!1),style:{width:`100%`,minWidth:0,height:`48px`,padding:`0`,borderRadius:`999px`,background:`#ffffff`,color:`#474967`,fontSize:`15px`,fontWeight:900,border:`none`,cursor:`pointer`,boxSizing:`border-box`,boxShadow:`0 3px 12px rgba(31,35,60,0.18), inset 0 0 0 1px rgba(31,35,60,0.08)`},children:u(`support.close`)||`닫기`})]})]})}),Ae&&(0,F.jsx)(`div`,{className:`ebc-power-detail-backdrop`,onMouseDown:e=>{e.stopPropagation(),e.target===e.currentTarget&&je(!1)},children:(0,F.jsxs)(`div`,{ref:Ot,role:`dialog`,"aria-modal":`true`,"aria-label":u(`support.total_power`)||`종합력`,tabIndex:-1,className:`ebc-power-detail-modal`,onMouseDown:e=>e.stopPropagation(),children:[(0,F.jsx)(`button`,{type:`button`,className:`ebc-power-detail-close`,onClick:()=>je(!1),"aria-label":u(`support.close`)||`닫기`,children:`×`}),(0,F.jsxs)(`div`,{className:`ebc-power-detail-body`,children:[(0,F.jsxs)(`div`,{className:`ebc-power-detail-total`,children:[(0,F.jsx)(`span`,{children:u(`support.total_power`)||`종합력`}),(0,F.jsx)(`strong`,{children:Q.totalPower.toLocaleString()})]}),(0,F.jsx)(`div`,{className:`ebc-power-detail-box`,children:Zt.map(e=>(0,F.jsxs)(`div`,{className:`ebc-power-detail-row`,children:[(0,F.jsx)(`span`,{children:e.label}),(0,F.jsx)(`i`,{"aria-hidden":`true`}),(0,F.jsx)(`strong`,{children:e.value.toLocaleString()})]},e.label))})]}),(0,F.jsx)(`div`,{className:`ebc-power-detail-footer`,children:(0,F.jsx)(`button`,{type:`button`,onClick:()=>je(!1),children:u(`support.close`)||`닫기`})})]})}),(0,F.jsx)(ge,{isOpen:Re,isMain:!0,activeIndex:K===null?0:K,onClose:()=>ze(!1),onClear:()=>{K!==null&&Z(K,{card:null,rarityKey:``}),ze(!1)},onSelectCard:e=>{if(K!==null){let t=e.type===`Birthday`||e.type===`Anniversary`?`birthday`:`rarity${e.rarity}`;Z(K,{card:e,rarityKey:t})}ze(!1)},selectedCharId:null,pickerCharId:pt,setPickerCharId:e=>{mt(e),c(`ebc_last_char_id`,String(e))},cards:J,ownedCardIds:yt,cardsLoading:Y,cardsError:_t,unitMemberIds:[],activeSlotCardId:K===null?null:D[K]?.card?.id,eventOverride:v,isManualEvent:w,showSkillBadge:!0}),xt&&(0,F.jsx)(M.Suspense,{fallback:(0,F.jsx)(`p`,{role:`status`,children:u(`support.recommend_loading`)}),children:(0,F.jsx)(Pe,{request:xt,onClose:()=>St(null),onApply:Xt,missingInputs:$,onSupportBonusChange:ne,onAreaChange:(e,t)=>{Oe(e),te(e),t&&f(j)}})}),(0,F.jsx)(`style`,{children:`
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
            `})]}):null},pt=e({default:()=>wt}),mt=(0,M.lazy)(()=>_(()=>import(`./AutoTab-BqYDyuPp.js`),__vite__mapDeps([17,1,3,18,5,4,6,19,7,20,21,22,12,8]))),J=(0,M.lazy)(()=>_(()=>import(`./PowerTab-DYT6nN9G.js`),__vite__mapDeps([23,1,3,20,5,4,6,21,19,7,22,12,8,24,25,18,26,10,9]))),ht=(0,M.lazy)(()=>_(()=>import(`./StandaloneRecommendation-Bid2E3HS.js`),__vite__mapDeps([27,1,3,5,4,6,2,7,8,9,10,11]))),Y=[1,2,3,4],gt=()=>(0,F.jsx)(`div`,{className:`flex justify-center py-6 text-sm font-medium text-gray-400`,children:s(`불러오는 중...`)}),_t=`deck-input-control w-28 text-center bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500`,vt=`deck-loaded-control w-28 text-center rounded-lg px-2 py-1.5 font-medium cursor-pointer transition-colors`,yt=({children:e,className:t=``})=>(0,F.jsx)(`div`,{className:`deck-input-section ${t}`,children:e}),bt=({label:e,extraHeader:t})=>(0,F.jsxs)(`div`,{className:`deck-input-header`,children:[(0,F.jsx)(`div`,{className:`deck-input-label-cell`}),(0,F.jsx)(`div`,{className:`deck-input-center-cell`,children:(0,F.jsx)(`span`,{className:`font-bold text-gray-700`,children:e})}),(0,F.jsx)(`div`,{className:`deck-input-side-cell deck-input-header-side`,children:t&&(0,F.jsx)(`span`,{className:`font-bold text-xs text-indigo-600`,children:t})})]}),xt=({label:e,side:t,children:n})=>(0,F.jsxs)(`div`,{className:`deck-input-row`,children:[(0,F.jsx)(`div`,{className:`deck-input-label-cell`,children:(0,F.jsx)(`label`,{className:`whitespace-nowrap font-bold text-gray-700`,children:e})}),(0,F.jsx)(`div`,{className:`deck-input-center-cell`,children:n}),(0,F.jsx)(`div`,{className:`deck-input-side-cell`,children:t&&(0,F.jsx)(`div`,{className:`deck-input-side-content`,children:t})})]}),St=({value:e,onChange:t})=>{let[n,r]=(0,M.useState)(!1),i=(0,M.useRef)(null);return(0,M.useEffect)(()=>{let e=e=>{i.current&&!i.current.contains(e.target)&&r(!1)},t=()=>r(!1);return n&&(document.addEventListener(`mousedown`,e),window.addEventListener(`scroll`,t,{capture:!0}),window.addEventListener(`resize`,t)),()=>{document.removeEventListener(`mousedown`,e),window.removeEventListener(`scroll`,t,{capture:!0}),window.removeEventListener(`resize`,t)}},[n]),(0,F.jsxs)(`div`,{className:`relative inline-block`,ref:i,children:[(0,F.jsxs)(`button`,{type:`button`,onClick:()=>r(e=>!e),className:`min-w-[60px] h-[28px] inline-flex items-center justify-center gap-0.5 rounded-md border border-blue-200 bg-blue-50 px-1.5 text-xs font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-300`,children:[(0,F.jsxs)(`span`,{children:[`SLv.`,e]}),(0,F.jsx)(`svg`,{className:`w-2.5 h-2.5 text-blue-400 transition-transform ${n?`rotate-180`:``}`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,children:(0,F.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2.5`,d:`M19 9l-7 7-7-7`})})]}),n&&(0,F.jsx)(`div`,{className:`absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded-lg bg-white shadow-xl ring-1 ring-black/10 overflow-hidden animate-fade-in`,children:(0,F.jsx)(`div`,{className:`p-1`,children:Y.map(n=>(0,F.jsxs)(`button`,{type:`button`,onClick:()=>{t(n),r(!1)},className:`block w-[60px] rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${Number(e)===n?`bg-blue-500 text-white`:`text-gray-700 hover:bg-blue-50 hover:text-blue-700`}`,children:[`SLv.`,n]},n))})})]})},Ct=(e,t=`loading`)=>window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:e,type:t,duration:t===`loading`?0:t===`error`?7e3:3e3}}));function wt({surveyData:e,setSurveyData:t,subPath:r}){let{user:i,updateFriendCode:o}=ne(),{isKorean:s}=se(),u=s?`savedFriendCode_kr`:`savedFriendCode`,{t:f,language:m}=oe(),h=a(),g=ie(),ee=e=>e===`auto`?`auto`:`power`,[_,te]=(0,M.useState)(e.activeDeckNum||1);(0,M.useEffect)(()=>{e.activeDeckNum&&e.activeDeckNum!==_&&te(e.activeDeckNum)},[e.activeDeckNum,_]);let[v,y]=(0,M.useState)(ee(r)),[b,x]=(0,M.useState)(!1),[re,S]=(0,M.useState)(!1),[ae,C]=(0,M.useState)(!1),[fe,me]=(0,M.useState)(null),[he,ge]=(0,M.useState)(``),[T,E]=(0,M.useState)({attr:``,unit:``,detailOpen:!1,characters:{},characterOrder:[]}),[D,Te]=(0,M.useState)(ve),O=(0,M.useRef)({first:null,second:null}),[k,A]=(0,M.useState)(()=>n(u,``)),[j,Ee]=(0,M.useState)(!1);(0,M.useEffect)(()=>{i&&!s&&(i.saveFriendCode?(Ee(!0),i.friendCode&&(A(i.friendCode),c(u,i.friendCode))):Ee(!1))},[i,s,u]),(0,M.useEffect)(()=>{k?c(u,k):l(u)},[k,u]),(0,M.useEffect)(()=>()=>{O.current.first&&cancelAnimationFrame(O.current.first),O.current.second&&cancelAnimationFrame(O.current.second)},[]);let ke=e=>{O.current.first&&cancelAnimationFrame(O.current.first),O.current.second&&cancelAnimationFrame(O.current.second),O.current.first=requestAnimationFrame(()=>{O.current.second=requestAnimationFrame(()=>{window.scrollTo(0,e),O.current={first:null,second:null}})})},[P,Me]=(0,M.useState)(!1),[Pe,Fe]=(0,M.useState)(``),[I,Ie]=(0,M.useState)(()=>({[ee(r)]:!0}));(0,M.useEffect)(()=>{y(ee(r))},[r]),(0,M.useEffect)(()=>{Ie(e=>e[v]?e:{...e,[v]:!0})},[v]),(0,M.useEffect)(()=>{let e=!1,t=null,n=null,r=null,i=async()=>{if(!e)try{await ye()}catch(e){console.warn(`Failed to load current event info`,e)}},a=()=>{e||(`requestIdleCallback`in window?t=window.requestIdleCallback(i,{timeout:8e3}):n=window.setTimeout(i,2e3))},o=()=>{e||(r=window.setTimeout(a,1500))};return document.readyState===`complete`?o():window.addEventListener(`load`,o,{once:!0}),()=>{e=!0,window.removeEventListener(`load`,o),t!==null&&`cancelIdleCallback`in window&&window.cancelIdleCallback(t),n!==null&&window.clearTimeout(n),r!==null&&window.clearTimeout(r)}},[]),(0,M.useEffect)(()=>{if(b)return be(Te,e=>{console.warn(`Failed to load current event info`,e)})},[b]);let Le=e=>{let t=String(e).padStart(2,`0`);return ce.find(e=>e.image===t)},Re=e=>{let t=Le(e);return t?m===`ja`?t.nameJa:m===`en`?t.nameEn:t.nameKo:String(e)},ze=()=>{let e=Object.keys(T.characters||{}).length>0;return{attr:T.attr,unit:T.unit,characters:e?T.characters:{}}},Be=e=>{E(t=>e===`mix`?{...t,unit:``,detailOpen:!0}:{...t,unit:e,detailOpen:!1,characters:{},characterOrder:[]})},Ve=e=>{E(t=>{let n={...t.characters||{}},r=[...t.characterOrder||[]].filter(t=>t!==e);if(n[e])delete n[e];else{if(r.length>=5){let e=r.shift();delete n[e]}n[e]=e>=21?t.unit||_e[0].key:xe[e],r.push(e)}return{...t,characters:n,characterOrder:r}})},He=(e,t)=>{E(n=>({...n,characters:{...n.characters||{},[e]:t}}))},[Ue,L]=(0,M.useState)(``),R=`deck${_}`,We=e.unifiedDecks?.[R]?.isManualInternalEdit||!1,Ge=!!e.unifiedDecks?.[R]?.isManualTotalPowerEdit,Ke=!!e.unifiedDecks?.[R]?.isManualEventBonusEdit,z=e.unifiedDecks?.[R]?.isDetailedInput||!1,qe=e.unifiedDecks?.[R]?.detailedSkills||{encore:``,member1:``,member2:``,member3:``,member4:``},Je=()=>e.unifiedDecks?.[`deck${_}`]||{};(0,M.useEffect)(()=>{let t=e.unifiedDecks?.[R]?.internalValue;L(t??``)},[e.unifiedDecks,R]),(0,M.useEffect)(()=>{let n=e.unifiedDecks;n&&n.deck1&&n.deck2&&n.deck3||t(e=>{let t=e.unifiedDecks||{},n={totalPower:``,skillLeader:``,skillMember2:``,skillMember3:``,skillMember4:``,skillMember5:``,eventBonus:``,internalValue:``,isManualInternalEdit:!1,detailedSkills:{encore:``,member1:``,member2:``,member3:``,member4:``},isDetailedInput:!1};return{...e,unifiedDecks:{deck1:t.deck1||{totalPower:w(e.autoDeck,`totalPower`,``),skillLeader:w(e.autoDeck,`skillLeader`,``),skillMember2:w(e.autoDeck,`skillMember2`,``),skillMember3:w(e.autoDeck,`skillMember3`,``),skillMember4:w(e.autoDeck,`skillMember4`,``),skillMember5:w(e.autoDeck,`skillMember5`,``),eventBonus:w(e.autoDeck,`eventBonus`,``),internalValue:``,isManualInternalEdit:!1,detailedSkills:{encore:``,member1:``,member2:``,member3:``,member4:``},isDetailedInput:!1},deck2:t.deck2||{...n},deck3:t.deck3||{...n},activeDeck:e.activeDeckNum||1}}})},[]);let B=e.unifiedDecks?.[`deck${_}`]||{},{totalPower:V,skillLeader:Ye,skillMember2:Xe,skillMember3:Ze,skillMember4:Qe,skillMember5:$e,eventBonus:et}=B,H=B.useBloomFes||!1,U=B.bloomLevels||{leader:0,member2:0,member3:0,member4:0,member5:0},tt=e=>{t(t=>{let n=t.unifiedDecks?.[`deck${_}`],r={...n,useBloomFes:e,bloomLevels:n?.bloomLevels||{leader:0,member2:0,member3:0,member4:0,member5:0}},i=de(r),a=Math.floor(i/10)*10,o=String(a);return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...r,internalValue:o,isManualInternalEdit:!1}}}})},W=(e,n)=>{t(t=>{let r=t.unifiedDecks?.[`deck${_}`],i={...r,bloomLevels:{...r?.bloomLevels,[e]:n}},a=de(i),o=Math.floor(a/10)*10;return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...i,internalValue:String(o),isManualInternalEdit:!1}}}})},G=(e,n)=>{t(t=>{let r=t.unifiedDecks?.[`deck${_}`]||{},i={...r.loadedSkillLevels||{},[e]:n},a=r[`skill${e===`leader`?`Leader`:e.charAt(0).toUpperCase()+e.slice(1)}`];n!==null&&r.loadedSkillRanges?.[e]&&(a=r.loadedSkillRanges[e][n]);let o=e===`leader`?`skillLeader`:`skill${e.charAt(0).toUpperCase()+e.slice(1)}`,s={...r,loadedSkillLevels:i,[o]:a},c=de(s),l=Math.floor(c/10)*10;return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...s,internalValue:String(l),isManualInternalEdit:!1}},autoDeck:s,internalValue:String(l),isManualInternalEdit:!1}})},K=e=>{if(!H)return null;let t=U[e];if(!t||!pe[t])return null;let[n,r]=pe[t],i={leader:{val:d(Ye,120),bloomLevel:U.leader},member2:{val:d(Xe,100),bloomLevel:U.member2},member3:{val:d(Ze,100),bloomLevel:U.member3},member4:{val:d(Qe,100),bloomLevel:U.member4},member5:{val:d($e,100),bloomLevel:U.member5}},a=0,o=1/0;return Object.entries(i).forEach(([t,n])=>{if(t===e)return;let r=n.val;n.bloomLevel&&pe[n.bloomLevel]&&(r=pe[n.bloomLevel][1]),a=Math.max(a,r),o=Math.min(o,r)}),{min:Math.min(n+Math.floor(o*.5),r),max:Math.min(n+Math.floor(a*.5),r)}},nt=e=>e>=80?150:e>=70?140:e>=65?130:120,q=e=>{if(!B.loadedBloomFesOriginalMembers?.[e])return null;let t={leader:Number(Ye)||0,member2:Number(Xe)||0,member3:Number(Ze)||0,member4:Number(Qe)||0,member5:Number($e)||0},n=t[e];if(!n)return null;let r=nt(n),i=1/0,a=0;return Object.entries(t).forEach(([t,n])=>{t!==e&&(i=Math.min(i,n||0),a=Math.max(a,n||0))}),i===1/0&&(i=0),{min:Math.min(n+Math.floor(i*.5),r),max:Math.min(n+Math.floor(a*.5),r)}},rt=e=>{let t=B.loadedVSBloomFesMembers?.[e];if(!t)return null;let n={leader:Number(Ye)||0,member2:Number(Xe)||0,member3:Number(Ze)||0,member4:Number(Qe)||0,member5:Number($e)||0}[e];if(!n)return null;let r=t.unitBonus??0,i=Math.min(n+r,n+60);return{min:i,max:i}},it=e=>{let t=K(e)||q(e)||rt(e);if(t)return t;if(B.loadedSkillLevels?.[e]){let t={leader:Number(Ye),member2:Number(Xe),member3:Number(Ze),member4:Number(Qe),member5:Number($e)}[e]||0;return{min:t,max:t,isLoaded:!0}}return null},at=()=>{let e=(e,t,n)=>{let r=K(e)||q(e)||rt(e);if(r)return{min:r.min,max:r.max};let i=Number(t)||n;return{min:i,max:i}},t=e(`leader`,Ye,120),n=e(`member2`,Xe,100),r=e(`member3`,Ze,100),i=e(`member4`,Qe,100),a=e(`member5`,$e,100),o=t.min+n.min+r.min+i.min+a.min,s=t.max+n.max+r.max+i.max+a.max,c=Math.floor(t.min+(n.min+r.min+i.min+a.min)*.2),l=Math.floor(t.max+(n.max+r.max+i.max+a.max)*.2);return{minEffective:c,maxEffective:l,minInternalSum:o,maxInternalSum:s,leaderMin:t.min,leaderMax:t.max,hasRange:c!==l}},ot=e=>{me(e),t(t=>{let n=t.unifiedDecks?.[`deck${_}`]||{},r={...n.loadedBloomFesOriginalMembers||{}};delete r[e];let i={...n.loadedVSBloomFesMembers||{}};delete i[e];let a={...n.loadedSkillLevels||{}};delete a[e];let o={...n,loadedBloomFesOriginalMembers:r,loadedVSBloomFesMembers:i,loadedSkillLevels:a},s=de(o),c=Math.floor(s/10)*10;return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...o,internalValue:String(c),isManualInternalEdit:!1}}}})},st=()=>{t(e=>{let t={...e.unifiedDecks?.[`deck${_}`]||{},totalPower:``,skillLeader:``,skillMember2:``,skillMember3:``,skillMember4:``,skillMember5:``,eventBonus:``,isManualTotalPowerEdit:!1,isManualEventBonusEdit:!1,loadedSkillRanges:void 0,loadedSkillLevels:void 0,loadedBloomFesOriginalMembers:void 0,loadedVSBloomFesMembers:void 0,internalValue:``,isManualInternalEdit:!1};return{...e,unifiedDecks:{...e.unifiedDecks,[`deck${_}`]:t},autoDeck:t,power:``,effi:``,internalValue:``,isManualInternalEdit:!1}})},ct=!!(B.loadedSkillRanges&&Object.keys(B.loadedSkillRanges).length>0),lt=ct&&!!V&&!Ge,ut=ct&&!!et&&!Ke,dt=ct&&(lt||ut||Object.values(B.loadedSkillLevels||{}).some(e=>e!=null)||Object.keys(B.loadedBloomFesOriginalMembers||{}).length>0||Object.keys(B.loadedVSBloomFesMembers||{}).length>0),pt=Object.values(B.loadedSkillLevels||{}).some(e=>e!=null),Y=(e,n,r=!0)=>{t(t=>{let i=t.unifiedDecks?.[`deck${_}`]||{},a=e.startsWith(`skill`)||e===`skillLeader`,o=i.loadedSkillLevels;if(a&&o){let t=e===`skillLeader`?`leader`:e.replace(`skill`,``).toLowerCase();i[e]!==n&&o[t]&&(o={...o,[t]:null})}let s={...i,[e]:n,...e===`totalPower`?{isManualTotalPowerEdit:r}:{},...e===`eventBonus`?{isManualEventBonusEdit:r}:{},...o?{loadedSkillLevels:o}:{}},c=de(s),l=Math.floor(c/10)*10,u=t.unifiedDecks?.[`deck${_}`]?.isManualInternalEdit||!1,f=!a&&u,p=f&&s.internalValue||String(l);return{...t,unifiedDecks:{...t.unifiedDecks,[`deck${_}`]:{...s,internalValue:p,isManualInternalEdit:f}},autoDeck:s,power:String(d(s.totalPower,293231)/1e4),effi:String(d(s.eventBonus,250)),internalValue:p,isManualInternalEdit:f}})};(0,M.useEffect)(()=>{e.unifiedDecks?.[`deck${_}`]&&t(e=>{let t=e.unifiedDecks?.[`deck${_}`];if(!t)return e;let n=ue(t);return{...e,activeDeckNum:_,autoDeck:{...t},power:String(d(t.totalPower,293231)/1e4),effi:String(d(t.eventBonus,250)),internalValue:t?.internalValue||(n?String(n):``),isManualInternalEdit:t?.isManualInternalEdit||!1,detailedSkills:t?.detailedSkills||{encore:``,member1:``,member2:``,member3:``,member4:``},isDetailedInput:t?.isDetailedInput||!1}})},[_]);let wt=e=>{t(t=>{let n=typeof e==`function`?e(t):e,r=n.unifiedDecks?.[`deck${_}`]||B,i=ue(r),a=n.unifiedDecks?.[R],o=t.unifiedDecks?.[R],s=a||B;if(a===o&&o)return{...n,internalValue:a.internalValue,autoDeck:a,power:String(d(a.totalPower,293231)/1e4),effi:String(d(a.eventBonus,250))};let c=a?.internalValue!==o?.internalValue,l=a?.isManualInternalEdit??n.isManualInternalEdit??We,u=c&&a?a.internalValue:l?n.internalValue:String(i);return{...n,unifiedDecks:{...n.unifiedDecks,[`deck${_}`]:{...s,internalValue:u,isManualInternalEdit:l,detailedSkills:n.detailedSkills??qe,isDetailedInput:n.isDetailedInput??z}},power:String(d(r.totalPower,293231)/1e4),effi:String(d(r.eventBonus,250)),internalValue:u,autoDeck:r}})},Tt=async()=>{if(P)return;if(!/^\d+$/.test(k.trim())){Fe(`숫자로 된 친구코드를 입력해 주세요.`);return}Fe(``),Me(!0),x(!1);let e=_,n=`deck${e}`;Ct(`플레이어 데이터를 불러오는 중…`),i&&j&&!s&&o(k,!0).catch(console.error);try{let r=s?null:Oe(),{totalPower:i,skillValues:a,eventBonus:o,loadedSkillRanges:c,loadedSkillLevels:l,loadedBloomFesOriginalMembers:u,loadedVSBloomFesMembers:f}=await Ae(k.trim(),ze(),e=>Ct(e===`fallback`?`플레이어 데이터를 불러오는 중… 보조 서버로 재시도하고 있습니다.`:`플레이어 데이터를 불러오는 중…`),{skillLevels:r});Ct(`플레이어 데이터를 화면에 반영하는 중…`);let p=performance.now();(0,N.flushSync)(()=>{te(e),t(t=>{let r=t.unifiedDecks?.[n]||{},s={...r,totalPower:i??r.totalPower,skillLeader:a[0],skillMember2:a[1],skillMember3:a[2],skillMember4:a[3],skillMember5:a[4],eventBonus:o,isManualTotalPowerEdit:i==null&&!!r.isManualTotalPowerEdit,isManualEventBonusEdit:!1,loadedSkillRanges:c,loadedSkillLevels:l,loadedBloomFesOriginalMembers:u,loadedVSBloomFesMembers:f},p=de(s),m=Math.floor(p/10)*10;return{...t,activeDeckNum:e,unifiedDecks:{...t.unifiedDecks,[n]:{...s,internalValue:String(m),isManualInternalEdit:!1}},autoDeck:s,power:String(d(s.totalPower,293231)/1e4),effi:String(d(s.eventBonus,250)),internalValue:String(m),isManualInternalEdit:!1}}),Me(!1)}),console.info(`[친구코드 불러오기] 화면 반영`,`${Math.round(performance.now()-p)}ms`),Ct(`플레이어 데이터 불러오기 완료 · 덱 ${e}`,`success`)}catch(e){Me(!1),console.error(`Failed to load friend data`,e),Ct(je(e),`error`)}},Et=Ce.find(e=>e.key===D.attr)||null,Dt=D.unit?_e.find(e=>e.key===D.unit):D.isMix?{key:`mix`,label:`스까`}:null,Ot=e=>H?(0,F.jsx)(p,{value:U[e]||0,onChange:t=>W(e,Number(t)),ariaLabel:f(`auto.bloom_fes_awakening`),buttonClassName:`!h-8 !min-w-[60px] !rounded-md !border-gray-200 !bg-gray-50 !px-6 !text-sm`,options:[{value:0,label:f(`auto.bloom_level_none`)||`X`},{value:1,label:f(`auto.bloom_level_1`)||`LV.1`},{value:2,label:f(`auto.bloom_level_2`)||`LV.2`},{value:3,label:f(`auto.bloom_level_3`)||`LV.3`},{value:4,label:f(`auto.bloom_level_4`)||`LV.4`}]}):null,X=e=>B.loadedSkillLevels?.[e]?(0,F.jsx)(St,{value:B.loadedSkillLevels[e],onChange:t=>G(e,t)}):null,kt=(e,t,n,r)=>{let i=it(e);if(i){let t=!!(B.loadedSkillLevels?.[e]||B.loadedBloomFesOriginalMembers?.[e]||B.loadedVSBloomFesMembers?.[e]);return(0,F.jsx)(`div`,{className:`${vt} ${t?`bg-indigo-50 text-indigo-700 hover:bg-indigo-100`:`bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}`,onClick:()=>t&&ot(e),title:t?h(`클릭하여 직접 입력`):void 0,children:i.min===i.max?`${i.min}%`:`${i.min}~${i.max}%`})}return(0,F.jsx)(`input`,{type:`number`,value:t??``,onChange:e=>{let t=e.target.value;t!==``&&Number(t)>160&&(t=`160`),Y(n,t===``?``:Number(t))},onFocus:e=>{e.target.select(),me(null)},className:_t,placeholder:r,autoFocus:fe===e})},At=e=>(0,F.jsxs)(F.Fragment,{children:[!it(e)&&(0,F.jsx)(`span`,{className:`text-gray-600`,children:`%`}),Ot(e),X(e)]});return(0,F.jsxs)(`div`,{id:`deck-tab-content`,children:[(0,F.jsxs)(`div`,{className:`flex justify-center gap-2 mb-4 items-center`,children:[[1,2,3].map(e=>(0,F.jsxs)(`button`,{disabled:P,onClick:()=>{te(e),t(t=>({...t,activeDeckNum:e}))},className:`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${_===e?`bg-indigo-500 text-white shadow-md`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`,children:[f(`deck.deck_label`)||`덱`,` `,e]},e)),m===`ko`&&(0,F.jsxs)(`div`,{className:`relative`,children:[(0,F.jsx)(`button`,{onClick:()=>{!b&&we()&&Te(we()),x(e=>!e)},type:`button`,disabled:P,className:`deck-friend-load-button px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${b?`active`:``}`,children:f(`app.load`)||`불러오기`}),b&&(0,F.jsxs)(`div`,{className:`absolute top-full right-0 z-50 mt-2 w-64 max-w-[calc(100vw-1rem)] translate-x-4 rounded-lg border border-gray-200 bg-white p-3 shadow-xl md:left-1/2 md:right-auto md:w-64 md:-translate-x-1/2`,children:[(0,F.jsxs)(`div`,{className:`mb-2 flex items-center gap-2 whitespace-nowrap`,children:[(0,F.jsx)(`span`,{className:`text-sm font-bold text-gray-700`,children:`친구코드 입력`}),(0,F.jsxs)(`span`,{className:`text-[10px] font-bold text-red-500`,children:[`* `,s?`한국`:`일본`,` 서버에서만 동작`]}),!s&&(0,F.jsx)(De,{iconOnly:!0,kind:`card`,onOpen:()=>x(!1)})]}),(T.attr===`wl`||!T.attr&&D.attr===`wl`)&&(0,F.jsx)(`div`,{className:`mb-2 text-left text-xs font-bold text-red-500`,children:`* 월드 링크 서폿덱 미반영`}),(0,F.jsxs)(`div`,{className:`mb-2 grid grid-cols-2 gap-2`,children:[(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`div`,{className:`mb-1 text-left text-xs font-bold text-gray-600`,children:`속성`}),(0,F.jsx)(Ne,{value:T.attr,options:Ce.filter(e=>e.key!==`memories`),assetPath:`attributes`,iconOnly:!0,autoOption:Et,onChange:e=>E(t=>({...t,attr:e}))})]}),(0,F.jsxs)(`div`,{children:[(0,F.jsx)(`div`,{className:`mb-1 text-left text-xs font-bold text-gray-600`,children:`유닛`}),(0,F.jsx)(Ne,{value:T.detailOpen?`mix`:T.unit,options:_e,assetPath:`units`,iconOnly:!0,extraOptions:[{key:`mix`,label:`스까`}],autoOption:Dt,onChange:Be})]})]}),(0,F.jsx)(`input`,{type:`text`,value:k,disabled:P,onChange:e=>A(e.target.value),placeholder:`예: 3939393939393939`,className:`w-full border border-gray-300 rounded px-2 py-1 mb-2 text-sm focus:outline-none focus:border-blue-500`,style:{width:`100%`}}),i&&!s&&(0,F.jsx)(`div`,{className:`mb-3`,children:(0,F.jsxs)(`label`,{className:`flex items-center gap-1.5 cursor-pointer`,children:[(0,F.jsx)(`input`,{type:`checkbox`,checked:j,onChange:e=>{let t=e.target.checked;Ee(t),t||o(null,!1).catch(console.error)},className:`w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500`}),(0,F.jsx)(`span`,{className:`text-xs font-bold text-gray-700`,children:`계정에 저장`})]})}),(0,F.jsx)(`div`,{className:`mb-3 text-left text-[10px] font-bold text-red-500`,children:s?`스킬 레벨은 수동 입력해 주세요.`:f(`deck.imported_skill_levels`)}),T.detailOpen&&(0,F.jsxs)(`div`,{className:`mb-3 rounded-lg border border-gray-200 bg-gray-50 p-2`,children:[(0,F.jsxs)(`div`,{className:`mb-1 text-right text-[10px] font-bold text-gray-400`,children:[(T.characterOrder||[]).length,`/5`]}),(0,F.jsx)(`div`,{className:`mb-2 grid grid-cols-7 gap-1`,children:[...Array(26)].map((e,t)=>{let n=t+1,r=Le(n),i=!!T.characters?.[n];return(0,F.jsxs)(`button`,{type:`button`,onClick:()=>Ve(n),className:`h-8 w-8 overflow-hidden rounded-full border transition-all ${i?`ring-2 ring-indigo-500 ring-offset-1 scale-105`:`border-gray-200 opacity-70`}`,title:Re(n),children:[(0,F.jsx)(`img`,{src:`/assets/characters/${String(n).padStart(2,`0`)}.webp`,alt:Re(n),className:`h-full w-full object-cover`,onError:e=>{e.currentTarget.style.display=`none`}}),!r&&(0,F.jsx)(`span`,{className:`text-[10px]`,children:n})]},n)})}),Se.some(e=>T.characters?.[e])&&(0,F.jsx)(`div`,{className:`space-y-1`,children:Se.filter(e=>T.characters?.[e]).map(e=>(0,F.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,F.jsx)(`span`,{className:`w-10 text-left text-[10px] font-bold text-gray-500`,children:Re(e)}),(0,F.jsx)(`div`,{className:`flex flex-wrap gap-1`,children:_e.map(t=>(0,F.jsx)(`button`,{type:`button`,onClick:()=>He(e,t.key),className:`h-6 w-7 rounded border bg-white p-0.5 ${T.characters?.[e]===t.key?`ring-2 ring-indigo-500`:`border-gray-200`}`,title:t.label,children:(0,F.jsx)(`img`,{src:`/assets/event/units/${t.file}`,alt:t.label,className:`h-full w-full object-contain`})},t.key))})]},e))})]}),Pe&&(0,F.jsx)(`p`,{role:`alert`,className:`mb-2 text-xs text-red-600 whitespace-pre-wrap`,children:Pe}),(0,F.jsx)(`button`,{type:`button`,onClick:Tt,disabled:P,className:`w-full bg-blue-500 text-white rounded py-1.5 text-sm font-medium hover:bg-blue-600 disabled:opacity-50`,children:P?`불러오는 중...`:`불러오기`})]})]})]}),(0,F.jsxs)(yt,{className:pt?`deck-input-loaded-skills`:``,children:[(0,F.jsx)(xt,{label:f(`auto.total_power`),children:lt?(0,F.jsx)(`div`,{className:`${vt} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`,onClick:()=>{ge(`totalPower`),Y(`totalPower`,``)},title:h(`클릭하여 직접 입력`),children:V}):(0,F.jsx)(`input`,{type:`number`,value:V??``,onChange:e=>{let t=e.target.value;t!==``&&Number(t)>55e4&&(t=`550000`),Y(`totalPower`,t===``?``:Number(t))},onBlur:e=>{let t=e.target.value;if(t===``)return;let n=Number(t);n>0&&n<=55?Y(`totalPower`,n*1e4):n>=100&&n<=550?Y(`totalPower`,n*1e3):n>=1e3&&n<=5500?Y(`totalPower`,n*100):n>=1e4&&n<=55e3&&Y(`totalPower`,n*10)},placeholder:`293231`,onFocus:e=>e.target.select(),className:_t,autoFocus:he===`totalPower`})}),(0,F.jsx)(bt,{label:f(`auto.member_skills`),extraHeader:H?f(`auto.bloom_skill`)||`블룸각전`:null}),(0,F.jsx)(xt,{label:f(`auto.leader`),side:At(`leader`),children:kt(`leader`,Ye,`skillLeader`,`120`)}),[{label:f(`auto.member_2`),val:Xe,key:`skillMember2`,bloomKey:`member2`},{label:f(`auto.member_3`),val:Ze,key:`skillMember3`,bloomKey:`member3`},{label:f(`auto.member_4`),val:Qe,key:`skillMember4`,bloomKey:`member4`},{label:f(`auto.member_5`),val:$e,key:`skillMember5`,bloomKey:`member5`}].map((e,t)=>(0,F.jsx)(xt,{label:e.label,side:At(e.bloomKey),children:kt(e.bloomKey,e.val,e.key,`100`)},t)),(0,F.jsx)(xt,{label:f(`auto.event_bonus`),side:(0,F.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[!ut&&(0,F.jsx)(`span`,{className:`text-gray-600`,children:`%`}),(0,F.jsxs)(`div`,{className:`flex flex-col items-start gap-1`,children:[(0,F.jsx)(`button`,{type:`button`,onClick:()=>C(!0),className:`deck-simulator-open-button inline-flex items-center justify-center h-5 px-2 rounded-full transition-colors text-[10px] font-bold`,children:f(`support.recommend_deck`)}),(0,F.jsx)(`button`,{type:`button`,onClick:()=>S(!0),className:`deck-simulator-open-button inline-flex items-center justify-center h-5 px-2 rounded-full transition-colors text-[10px] font-bold`,title:f(`support.deck_simulator`)||`덱 시뮬레이터`,children:f(`support.deck_sim_btn`)||`덱시뮬`})]})]}),children:ut?(0,F.jsxs)(`div`,{className:`${vt} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`,onClick:()=>{ge(`eventBonus`),Y(`eventBonus`,et)},title:h(`클릭하여 직접 입력`),children:[et,(0,F.jsx)(`span`,{className:`text-xs ml-0.5`,children:`%`})]}):(0,F.jsx)(`input`,{type:`number`,value:et??``,onChange:e=>{let t=e.target.value;Y(`eventBonus`,t===``?``:Number(t))},placeholder:`250`,onFocus:e=>e.target.select(),className:_t,autoFocus:he===`eventBonus`})}),(0,F.jsx)(`div`,{className:`deck-input-actions`,children:(0,F.jsxs)(`div`,{className:`flex items-center justify-center gap-3`,children:[(0,F.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,F.jsx)(`span`,{className:`text-xs font-medium transition-colors duration-200 ${H?`text-indigo-600`:`text-gray-400`}`,children:f(`auto.bloom_fes_awakening`)||`블룸페스 각전`}),(0,F.jsx)(`button`,{role:`switch`,"aria-checked":H,onClick:()=>tt(!H),className:`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${H?`bg-gradient-to-r from-indigo-500 to-purple-500`:`bg-gray-200`}`,children:(0,F.jsx)(`span`,{className:`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${H?`translate-x-4`:`translate-x-0`}`})})]}),dt&&(0,F.jsx)(`button`,{onClick:st,title:h(`불러온 값 초기화`),className:`deck-loaded-reset-button flex items-center justify-center w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 hover:text-red-600 transition-all duration-150 shadow-sm hover:shadow`,children:(0,F.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2.5`,strokeLinecap:`round`,strokeLinejoin:`round`,className:`w-3.5 h-3.5`,children:[(0,F.jsx)(`path`,{d:`M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8`}),(0,F.jsx)(`path`,{d:`M3 3v5h5`})]})})]})})]}),(0,F.jsx)(`div`,{className:`flex justify-center gap-2 mb-2 mt-1`,children:[{key:`power`,label:f(`deck.power`)||`이벤포`,urlPath:`ep`},{key:`auto`,label:f(`deck.auto`)||`오토`,urlPath:`auto`}].map(e=>(0,F.jsx)(`button`,{onClick:()=>{let t=window.scrollY;y(e.key),g(`/event/${e.urlPath}`,{replace:!0,preventScrollReset:!0}),ke(t)},className:`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${v===e.key?`bg-indigo-500 text-white shadow-md`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`,children:e.label},e.key))}),v===`power`&&!e.isComparisonMode&&(()=>{let e=at();return(0,F.jsxs)(`div`,{className:`flex flex-col items-center mb-4 mt-2`,children:[(0,F.jsxs)(`div`,{className:`flex flex-col items-center gap-1 mb-2`,children:[(0,F.jsxs)(`div`,{className:`flex items-center gap-4 text-base font-medium`,children:[(0,F.jsxs)(`div`,{children:[(0,F.jsxs)(`span`,{className:`text-gray-500`,children:[f(`deck.my_internal_value`),`: `]}),(0,F.jsx)(`span`,{className:`text-blue-600 font-bold`,children:e.hasRange?`${e.minEffective}~${e.maxEffective}%`:`${e.minEffective}%`})]}),(0,F.jsxs)(`div`,{children:[(0,F.jsxs)(`span`,{className:`text-gray-500`,children:[f(`internal.internal_sum`),`: `]}),(0,F.jsxs)(`span`,{className:`text-blue-600 font-bold`,children:[e.leaderMin,`/`,e.minInternalSum]})]})]}),(0,F.jsxs)(`div`,{className:`text-[10px] text-gray-400`,children:[`(`,f(`deck.formula_explanation`),`)`]})]}),(0,F.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,F.jsx)(`span`,{className:`text-sm font-medium text-gray-600`,children:f(`power.internal_value`)||`방 실효치`}),(0,F.jsx)(`input`,{type:`number`,value:Ue,onChange:e=>{let n=e.target.value;L(n),t(e=>{let t={...e};return t.unifiedDecks={...e.unifiedDecks,[R]:{...e.unifiedDecks?.[R],internalValue:n,isManualInternalEdit:!0}},t.internalValue=n,t.isManualInternalEdit=!0,t})},onFocus:e=>e.target.select(),className:`w-20 text-center border rounded px-2 py-1 text-sm font-bold ${We?`text-blue-600 border-blue-300`:`text-gray-700 border-gray-300`}`,placeholder:String(ue(Je()))}),(0,F.jsx)(`span`,{className:`text-sm text-gray-500`,children:`%`})]})]})})(),(0,F.jsx)(`div`,{className:`deck-results-container`,children:(0,F.jsxs)(M.Suspense,{fallback:(0,F.jsx)(gt,{}),children:[I.auto&&(0,F.jsx)(`div`,{style:{display:v===`auto`?`block`:`none`},children:(0,F.jsx)(mt,{surveyData:e,setSurveyData:wt,hideInputs:!0})}),I.power&&(0,F.jsx)(`div`,{style:{display:v===`power`?`block`:`none`},children:(0,F.jsx)(J,{surveyData:e,setSurveyData:wt,hideInputs:!0})})]})}),re&&(0,F.jsx)(ft,{isOpen:re,onClose:()=>S(!1),onApply:(e,t)=>{t!=null&&Y(`totalPower`,Math.round(t),!1),Y(`eventBonus`,Number(e.toFixed(1)),!1),S(!1)},onLoadSkill:e=>{if(e&&e.length===5){let n={},r={},i=[],a=[`leader`,`member2`,`member3`,`member4`,`member5`],o=le(e);e.forEach((e,t)=>{let s=a[t],c=Number(e.skillLevel)||1;n[s]=c;let{ranges:l,skillValue:u}=o[t];r[s]=l,i.push(u)}),t(e=>{let t=e.unifiedDecks?.[`deck${_}`]||{};return{...e,unifiedDecks:{...e.unifiedDecks,[`deck${_}`]:{...t,skillLeader:i[0],skillMember2:i[1],skillMember3:i[2],skillMember4:i[3],skillMember5:i[4],loadedSkillLevels:n,loadedSkillRanges:r,loadedBloomFesOriginalMembers:{},loadedVSBloomFesMembers:{},useBloomFes:!1}}}})}}}),ae&&(0,F.jsx)(M.Suspense,{fallback:(0,F.jsx)(`p`,{role:`status`,children:f(`support.recommend_loading`)}),children:(0,F.jsx)(ht,{onClose:()=>C(!1),onApply:e=>{t(t=>{let n=`deck${_}`,r={...t.unifiedDecks?.[n],...e};return{...t,unifiedDecks:{...t.unifiedDecks,[n]:r},autoDeck:r,power:String(e.totalPower/1e4),effi:String(e.eventBonus),internalValue:e.internalValue,isManualInternalEdit:!1}}),C(!1)}})})]})}export{wt as default,ut as i,dt as n,Je as r,pt as t};