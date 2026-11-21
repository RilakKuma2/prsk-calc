import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{A as t,O as n,P as r,c as i,i as a,l as o,t as s}from"./uiText-BWp2R5Lb.js";import{$ as c,H as l,et as u}from"./index-DDJUsG-W.js";import{t as d}from"./CharacterSelector-Swb7FBTr.js";import{n as f,t as ee}from"./SupportCardPickerModal-sj7FVa1j.js";import{a as p,c as te,d as ne,i as m,l as h,n as g,r as _,s as re,u as ie}from"./supportCardUtils-C8JX-WGV.js";import{h as v,n as y,t as b}from"./env-oEuwIDn6.js";var x=e(r()),S=u(),C=25,w=5,T=[0,1,2,3,4,5],ae=[1,2,3,4],oe=v(b,`api/cards`),se=[{key:`rarity4`,label:`★4`,typeBonus:25,masterRankBonus:[10,12.5,15,17.5,20,25],canPickup:!0,memberBonus:20,pickupBonus:30},{key:`birthday`,label:`BN/AN`,typeBonus:25,masterRankBonus:[5,7,9,11,13,15],canPickup:!1},{key:`rarity3`,label:`★3`,typeBonus:25,masterRankBonus:[0,1,2,3,4,5],canPickup:!1},{key:`rarity2`,label:`★2`,typeBonus:25,masterRankBonus:[0,.2,.4,.6,.8,1],canPickup:!1},{key:`rarity1`,label:`★1`,typeBonus:25,masterRankBonus:[0,.1,.2,.3,.4,.5],canPickup:!1}],E=se.reduce((e,t)=>(e[t.key]=t,e),{"":s({key:``,typeBonus:0,masterRankBonus:[0,0,0,0,0,0],canPickup:!1},`비움`)}),D=()=>Array.from({length:C},()=>({cardId:null,masterRank:0,skillLevel:1})),O=e=>{let t=D();return Array.isArray(e)&&e.slice(0,C).forEach((e,n)=>{t[n]={cardId:e?.cardId??null,masterRank:Number(e?.masterRank)||0,skillLevel:Number(e?.skillLevel)||1}}),t},ce=()=>Array.from({length:w},()=>({rarityKey:`rarity4`,masterRank:0,pickup:!1,featured:!0,typeMatched:!0})),le=e=>{let t=ce();return Array.isArray(e)&&e.slice(0,w).forEach((e,n)=>{let r=E[e?.rarityKey]?e.rarityKey:``,i=!!r;t[n]={rarityKey:r,masterRank:Math.max(0,Math.min(5,Number(e?.masterRank)||0)),pickup:i&&r===`rarity4`?!!e?.pickup:!1,featured:i?!!e?.featured:!1,typeMatched:i?!!e?.typeMatched:!1}}),t},ue=e=>{let t=E[e?.rarityKey]||E[``];if(!t.key)return{member:0,character:0,type:0,masterRank:0,total:0};let n=Math.max(0,Math.min(5,Number(e.masterRank)||0)),r={member:t.canPickup&&e.pickup?t.pickupBonus:0,character:e.featured?25:0,type:e.typeMatched?t.typeBonus:0,masterRank:t.masterRankBonus[n]||0};return{...r,total:Object.values(r).reduce((e,t)=>e+t,0)}},de=()=>w*ue({rarityKey:`rarity4`,masterRank:5,pickup:!0,featured:!0,typeMatched:!0}).total,fe=(e,t)=>{let n=100+Number(e||0),r=100+Number(t||0);return n<=0||r<=n?0:(r-n)/n*100},k=e=>e===`birthday`?4:e===`rarity3`?3:e===`rarity2`?2:e===`rarity1`?1:e?4:0,pe=({rarityKey:e,masterRank:t=0,previewCharId:n=21,card:r=null,skillText:i=`SLV.4`,emptyText:o=a(`비움`)})=>{let s=k(e),c=e===`birthday`,l=s>0&&s<=2,u=c?`cardFrame_bd.webp`:l?`frame_2star.webp`:`Frame.webp`,d=c?`rairity_birth.webp`:l?`star_normal.webp`:`afterstar.webp`,f=Math.max(0,Math.min(5,Number(t)||0)),ee=r?v(y,`face/res0${String(m(r)||1).padStart(2,`0`)}_no${String(r?.card_image_id||`001`).padStart(3,`0`)}_normal.webp`):v(y,`face/res0${String(n).padStart(2,`0`)}_no001_normal.webp`);return(0,S.jsxs)(`div`,{className:`support-card-thumb support-main-preview-card with-levels ${e?``:`empty`}`,children:[(0,S.jsx)(`img`,{className:`support-card-face`,src:ee,alt:a(`메인덱 미리보기`),loading:`lazy`,onError:e=>{e.target.src=v(y,`face/res0${String(n).padStart(2,`0`)}_no001_normal.webp`)}}),(0,S.jsx)(`img`,{className:`support-card-frame`,src:`/assets/card_style/${u}`,alt:``,loading:`lazy`,"aria-hidden":`true`}),(0,S.jsx)(`img`,{className:`support-card-attribute`,src:`/assets/card_style/pure.webp`,alt:`pure`,loading:`lazy`}),e&&c&&(0,S.jsx)(`img`,{className:`support-card-birthday`,src:`/assets/card_style/${d}`,alt:`birthday`,loading:`lazy`}),e&&!c&&(0,S.jsx)(`div`,{className:`support-card-stars`,"aria-label":`${s} star`,children:Array.from({length:s},(e,t)=>(0,S.jsx)(`img`,{src:`/assets/card_style/${d}`,alt:``,loading:`lazy`,"aria-hidden":`true`},t))}),(0,S.jsx)(`div`,{className:`support-skill-badge`,children:e?i:o}),f>0&&(0,S.jsx)(`img`,{className:`support-mastery-badge`,src:`/assets/card_style/masterRank_S_${f}.webp`,alt:`master rank ${f}`,loading:`lazy`})]})},A=({value:e,options:t,onChange:n,prefix:r,suffix:i=``,formatOption:a})=>{let[o,s]=(0,x.useState)(!1),c=(0,x.useRef)(null),l=e=>a?a(e):`${e}${i}`;return(0,x.useEffect)(()=>{if(!o)return;let e=e=>{c.current&&!c.current.contains(e.target)&&s(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[o]),(0,S.jsxs)(`div`,{className:`support-select`,ref:c,style:{zIndex:o?80:1},children:[(0,S.jsxs)(`button`,{type:`button`,className:`support-select-button ${o?`open`:``}`,onClick:()=>s(e=>!e),children:[(0,S.jsx)(`span`,{children:r}),(0,S.jsx)(`strong`,{children:l(e)})]}),o&&(0,S.jsx)(`div`,{className:`support-select-menu`,children:t.map(t=>(0,S.jsx)(`button`,{type:`button`,className:t===e?`selected`:``,onClick:()=>{n(t),s(!1)},children:l(t)},t))})]})},me=({value:e,options:t,onChange:n,prefix:r})=>{let[i,a]=(0,x.useState)(!1),o=(0,x.useRef)(null),s=t.find(t=>t.key===e)||t[0];return(0,x.useEffect)(()=>{if(!i)return;let e=e=>{o.current&&!o.current.contains(e.target)&&a(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[i]),(0,S.jsxs)(`div`,{className:`support-select`,ref:o,style:{zIndex:i?80:1},children:[(0,S.jsxs)(`button`,{type:`button`,className:`support-select-button ${i?`open`:``}`,onClick:()=>a(e=>!e),children:[(0,S.jsx)(`span`,{children:r}),(0,S.jsx)(`strong`,{children:s.label})]}),i&&(0,S.jsx)(`div`,{className:`support-select-menu`,children:t.map(t=>(0,S.jsx)(`button`,{type:`button`,className:t.key===e?`selected`:``,onClick:()=>{n(t.key),a(!1)},children:t.label},t.key||`empty`))})]})},j=()=>{let{language:e,t:r}=c(),[s,u]=(0,x.useState)(1),[v,y]=(0,x.useState)({}),[b,k]=(0,x.useState)(()=>ce()),[j,he]=(0,x.useState)(!1),[ge,_e]=(0,x.useState)(!1),[M,ve]=(0,x.useState)([]),[ye,be]=(0,x.useState)(!0),[xe,Se]=(0,x.useState)(``),[N,P]=(0,x.useState)(null),[F,I]=(0,x.useState)(null),[Ce,L]=(0,x.useState)(!1),[we,R]=(0,x.useState)(1),[z,B]=(0,x.useState)(!1),[Te,Ee]=(0,x.useState)(5),[De,Oe]=(0,x.useState)(4),[V,ke]=(0,x.useState)(()=>{let e=Number(t(`calcPreviewCharId`));return Number.isSafeInteger(e)&&e>0?e:21}),H=(0,x.useRef)(null);(0,x.useEffect)(()=>{o(`calcPreviewCharId`,String(V))},[V]),(0,x.useEffect)(()=>{let e=n(`supportDeckState`,{},e=>!!e&&typeof e==`object`&&!Array.isArray(e));e.selectedCharId&&u(Number(e.selectedCharId)||1),e.decks&&typeof e.decks==`object`&&!Array.isArray(e.decks)&&y(e.decks),e.mainDeckSlots&&k(le(e.mainDeckSlots)),typeof e.finaleEnabled==`boolean`&&he(e.finaleEnabled),_e(!0)},[]),(0,x.useEffect)(()=>{ge&&i(`supportDeckState`,{selectedCharId:s,decks:v,mainDeckSlots:b,finaleEnabled:j})},[v,j,ge,b,s]),(0,x.useEffect)(()=>{R(Number(s))},[s]),(0,x.useEffect)(()=>{if(!z)return;let e=e=>{H.current&&!H.current.contains(e.target)&&B(!1)};return document.addEventListener(`click`,e),()=>document.removeEventListener(`click`,e)},[z]),(0,x.useEffect)(()=>{let e=!0;return(async()=>{be(!0),Se(``);try{let t=await fetch(oe,{cache:`reload`});if(!t.ok)throw Error(`HTTP ${t.status}`);let n=await t.json();e&&ve(Array.isArray(n)?n:[])}catch(t){console.error(`Failed to load support cards`,t),e&&Se(a(`카드 목록을 불러오지 못했습니다.`))}finally{e&&be(!1)}})(),()=>{e=!1}},[]);let U=(0,x.useMemo)(()=>O(v[s]),[v,s]),W=(0,x.useMemo)(()=>M.reduce((e,t)=>(e.set(Number(t.id),t),e),new Map),[M]),G=(0,x.useMemo)(()=>te(s),[s]),{fourStarCount:Ae,hasWl3:je}=(0,x.useMemo)(()=>{let e=0,t=!1;return M.forEach(n=>{m(n)===Number(s)&&Number(n.rarity)===4&&n.type!==`Birthday`&&n.type!==`Anniversary`&&(h(n)===3?t=!0:e++)}),{fourStarCount:e,hasWl3:t}},[M,s]),K=(0,x.useMemo)(()=>U.map(e=>{let t=e.cardId?W.get(Number(e.cardId)):null;return{slot:e,card:t,bonus:g(t,e.masterRank,e.skillLevel,s)}}),[W,U,s]),Me=(0,x.useMemo)(()=>K.reduce((e,t)=>e+t.bonus.total,0),[K]),q=(0,x.useMemo)(()=>b.map(e=>({slot:e,rarityOption:E[e.rarityKey]||E[``],bonus:ue(e)})),[b]),J=(0,x.useMemo)(()=>q.reduce((e,t)=>e+t.bonus.total,0),[q]),Y=Me+(j?50:0),Ne=Y/2,X=J+Y,Pe=J+Ne,Fe=J>0,Z=(0,x.useMemo)(()=>de(),[])+(0,x.useMemo)(()=>M.filter(e=>G.includes(m(e))&&h(e)!==3).map(e=>({card:e,bonus:g(e,5,4,s).total,hasWorldLinkBonus:ie(e,s),date:ne(e.available_from)?.getTime()||0})).sort((e,t)=>t.bonus===e.bonus?Number(t.hasWorldLinkBonus)===Number(e.hasWorldLinkBonus)?t.date===e.date?Number(t.card.id)-Number(e.card.id):t.date-e.date:Number(t.hasWorldLinkBonus)-Number(e.hasWorldLinkBonus):t.bonus-e.bonus).slice(0,C).reduce((e,t)=>e+t.bonus,0)+(j?50:0),[M,j,s,G]),Ie=fe(X,Z),Le=Math.abs(Z-X)<=1e-4,Re=!ye&&!xe&&Z>0&&(Le||Z>X+1e-4&&Ie>0),ze=(0,x.useMemo)(()=>K.filter(e=>e.card).length,[K]),Be=e=>r(`support.slot_label`,{n:e+1}),Ve=e=>r(`support.slot`,{n:e+1}),Q=(e,t)=>{y(n=>{let r=O(n[s]),i=r[e];return r[e]=typeof t==`function`?t(i):{...i,...t},{...n,[s]:r}})},$=(e,t)=>{k(n=>{let r=le(n),i=r[e],a={...i,...t};if(Object.prototype.hasOwnProperty.call(t,`rarityKey`)){let e=!!t.rarityKey;a.masterRank=e?i.masterRank:0,a.featured=e,a.typeMatched=e,a.pickup=e&&t.rarityKey===`rarity4`?i.pickup:!1}return a.rarityKey!==`rarity4`&&(a.pickup=!1),r[e]=a,r})},He=()=>{k(ce())},Ue=()=>{k(Array.from({length:w},()=>({rarityKey:`rarity4`,masterRank:5,pickup:!0,featured:!0,typeMatched:!0})))},We=e=>{N!==null&&(Q(N,{cardId:e.id}),P(null))},Ge=e=>{R(Number(s)),P(e)},Ke=()=>{N!==null&&(Q(N,{cardId:null}),P(null))},qe=()=>{window.confirm(r(`support.clear_confirm`).replace(`{{name}}`,p(s,e)))&&y(e=>({...e,[s]:D()}))},Je=()=>{let e=M.filter(e=>G.includes(m(e))&&h(e)!==3).map(e=>({card:e,bonus:g(e,5,4,s).total,hasWorldLinkBonus:ie(e,s),date:ne(e.available_from)?.getTime()||0})).sort((e,t)=>t.bonus===e.bonus?Number(t.hasWorldLinkBonus)===Number(e.hasWorldLinkBonus)?t.date===e.date?Number(t.card.id)-Number(e.card.id):t.date-e.date:Number(t.hasWorldLinkBonus)-Number(e.hasWorldLinkBonus):t.bonus-e.bonus),t=D();e.slice(0,C).forEach(({card:e},n)=>{t[n]={cardId:e.id,masterRank:5,skillLevel:4}}),y(e=>({...e,[s]:t}))},Ye=()=>{y(e=>{let t=O(e[s]).sort((e,t)=>{let n=e.cardId?W.get(Number(e.cardId)):null,r=t.cardId?W.get(Number(t.cardId)):null,i=g(n,e.masterRank,e.skillLevel,s).total,a=g(r,t.masterRank,t.skillLevel,s).total;return a===i?n&&!r?-1:!n&&r?1:Number(t.cardId||0)-Number(e.cardId||0):a-i});return{...e,[s]:t}})},Xe=()=>{y(e=>{let t=O(e[s]).map(e=>e.cardId?{...e,masterRank:Te,skillLevel:De}:e);return{...e,[s]:t}}),B(!1),U.some(e=>!e.cardId)&&window.dispatchEvent(new CustomEvent(`show-toast`,{detail:{message:r(`support.bulk_cards_only`),duration:2400}}))},Ze=N===null?null:K[N];return(0,S.jsxs)(`div`,{id:`support-tab-content`,className:`support-tab`,children:[(0,S.jsx)(`style`,{children:`
                .support-tab {
                    --support-border: #dbe4ef;
                    --support-ink: #263445;
                    --support-muted: #64748b;
                    --support-blue: #2563eb;
                    --support-cyan: #0f9fbd;
                    --support-green: #0f9f6e;
                    --support-rose: #d94676;
                    color: var(--support-ink);
                    text-align: left;
                }

                .support-header {
                    display: grid;
                    grid-template-columns: minmax(220px, 1fr) auto;
                    gap: 14px;
                    align-items: end;
                    margin-bottom: 14px;
                }

                .support-title-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .support-title-row h2 {
                    margin: 0;
                    font-size: 22px;
                    line-height: 1.2;
                    color: var(--support-ink);
                }

                .support-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(110px, 1fr));
                    gap: 8px;
                    min-width: 360px;
                }

                .support-summary-box {
                    border: 1px solid var(--support-border);
                    border-radius: 8px;
                    padding: 10px 12px;
                    background: #ffffff;
                    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
                }

                .support-summary-box span {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--support-muted);
                    margin-bottom: 3px;
                }

                .support-summary-box strong {
                    display: block;
                    font-size: 20px;
                    line-height: 1.1;
                    color: var(--support-ink);
                    font-variant-numeric: tabular-nums;
                }

                .support-summary-detail {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    margin-top: 4px;
                    color: #111827;
                    font-size: 10px;
                    font-weight: 800;
                    line-height: 1.1;
                    font-variant-numeric: tabular-nums;
                    white-space: nowrap;
                    letter-spacing: -0.3px;
                }

                .support-summary-box .support-summary-detail span {
                    display: inline;
                    margin-bottom: 0;
                    color: inherit;
                    font-size: 10px;
                    font-weight: inherit;
                }

                .support-summary-box .support-summary-detail .support-summary-total {
                    color: var(--support-blue);
                }

                .support-theory-loss {
                    display: block;
                    margin-top: 5px;
                    color: #94a3b8;
                    font-size: 9px;
                    font-weight: 800;
                    line-height: 1.18;
                    font-variant-numeric: tabular-nums;
                }

                .support-theory-loss b {
                    font-weight: 900;
                }

                .support-theory-loss .support-theory-bonus {
                    color: var(--support-green);
                }

                .support-theory-loss .support-theory-loss-value {
                    color: #dc2626;
                }

                .support-theory-loss .support-theory-perfect {
                    color: var(--support-blue);
                }

                .support-summary-box .support-theory-loss .support-theory-loss-line {
                    display: inline-flex;
                    align-items: baseline;
                    gap: 3px;
                    font-size: inherit;
                    white-space: nowrap;
                }

                .support-summary-box .support-theory-loss b {
                    font-size: inherit;
                }

                .support-summary-box .support-theory-loss .support-theory-loss-line span {
                    display: inline;
                    margin-bottom: 0;
                    color: inherit;
                    font-size: inherit;
                    font-weight: inherit;
                }

                .support-theory-loss-break {
                    display: block;
                }

                .support-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 8px;
                    margin: 8px 0 12px;
                    flex-wrap: wrap;
                }

                .support-action-group {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .support-chip {
                    display: inline-flex;
                    align-items: center;
                    margin-right: auto;
                    height: 30px;
                    padding: 0 10px;
                    border-radius: 8px;
                    border: 1px solid #cde7ef;
                    background: #f0fbff;
                    color: #0e7490;
                    font-size: 12px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .support-bulk-wrap {
                    position: relative;
                }

                .support-bulk-panel {
                    position: absolute;
                    top: calc(100% + 6px);
                    right: 0;
                    z-index: 100;
                    background: #ffffff;
                    border: 1px solid #bfdbfe;
                    border-radius: 10px;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
                    padding: 12px 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--support-ink);
                }

                .support-bulk-panel label {
                    color: var(--support-muted);
                    font-size: 11px;
                }

                .support-bulk-apply {
                    height: 30px;
                    padding: 0 12px;
                    border-radius: 8px;
                    border: 0;
                    background: var(--support-blue);
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .support-bulk-apply:hover {
                    background: #1d4ed8;
                }

                .support-ghost-button {
                    height: 32px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #475569;
                    font-weight: 800;
                    font-size: 12px;
                    padding: 0 12px;
                    cursor: pointer;
                    transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
                }

                .support-ghost-button:hover {
                    border-color: #94a3b8;
                    color: #1e293b;
                    background: #f8fafc;
                }

                .support-ghost-button.active {
                    border-color: #22c55e;
                    background: #ecfdf5;
                    color: #047857;
                }

                .support-main-open-button,
                .support-main-open-button.active {
                    border-color: #0f766e;
                    background: #0f766e;
                    color: #ffffff;
                    box-shadow: 0 5px 14px rgba(15, 118, 110, 0.24);
                }

                .support-main-open-button:hover,
                .support-main-open-button.active:hover {
                    border-color: #115e59;
                    background: #115e59;
                    color: #ffffff;
                }

                .support-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 10px;
                }

                .support-slot {
                    min-width: 0;
                    border: 1px solid var(--support-border);
                    border-radius: 8px;
                    background: #ffffff;
                    padding: 8px;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
                }

                .support-slot-card {
                    display: block;
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    border: 0;
                    padding: 0;
                    margin: 0;
                    border-radius: 8px;
                    background: #f8fafc;
                    cursor: pointer;
                    position: relative;
                    overflow: visible;
                }

                .support-empty-card {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border: 1px dashed #b8c5d6;
                    border-radius: 8px;
                    color: #64748b;
                    background: #f8fafc;
                    font-size: 12px;
                    font-weight: 800;
                }

                .support-empty-card span:first-child {
                    font-size: 24px;
                    line-height: 1;
                    color: #94a3b8;
                }

                .support-slot-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    margin-top: 7px;
                    min-height: 18px;
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--support-muted);
                }

                .support-slot-meta strong {
                    color: var(--support-green);
                    font-variant-numeric: tabular-nums;
                }

                .support-slot-controls {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 5px;
                    margin-top: 7px;
                }

                .support-select {
                    position: relative;
                    min-width: 0;
                }

                .support-select-button {
                    width: 100%;
                    height: 32px;
                    border: 1px solid #d5deea;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #334155;
                    padding: 0 7px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .support-select-button.open,
                .support-select-button:hover {
                    border-color: #93c5fd;
                    color: var(--support-blue);
                }

                .support-select-button span {
                    color: #64748b;
                    font-weight: 700;
                }

                .support-select-menu {
                    position: absolute;
                    z-index: 200;
                    left: 0;
                    min-width: 100%;
                    width: max-content;
                    top: calc(100% + 4px);
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    background: #ffffff;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
                    padding: 4px;
                }

                .support-select-menu button {
                    display: block;
                    width: 100%;
                    height: 28px;
                    border: 0;
                    border-radius: 6px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                }

                .support-select-menu button:hover,
                .support-select-menu button.selected {
                    background: #eff6ff;
                    color: var(--support-blue);
                }

                .support-card-thumb {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #e2e8f0;
                    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
                }

                .support-card-thumb.selected {
                    box-shadow: 0 0 0 3px #22c55e, inset 0 0 0 1px rgba(15, 23, 42, 0.08);
                }

                .support-card-face,
                .support-card-frame {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .support-card-thumb.picker .support-card-face {
                    object-fit: contain;
                    background: #edf2f7;
                }

                .support-card-frame {
                    z-index: 2;
                    pointer-events: none;
                }

                .support-card-attribute {
                    position: absolute;
                    top: 2%;
                    left: 2%;
                    z-index: 3;
                    width: 22%;
                    height: 22%;
                    object-fit: contain;
                    pointer-events: none;
                }

                .support-card-stars {
                    position: absolute;
                    z-index: 3;
                    bottom: 4%;
                    left: 3%;
                    width: 94%;
                    display: flex;
                    gap: 1%;
                    pointer-events: none;
                }

                .support-card-thumb.with-levels .support-card-stars {
                    bottom: 18%;
                    left: 5%;
                    width: 74%;
                }

                .support-card-thumb.with-levels .support-card-stars.thumbnail-with-levels {
                    bottom: 8%;
                    left: 6%;
                    width: 90%;
                }

                .support-card-stars.thumbnail-with-levels img {
                    width: 14%;
                }

                .support-card-birthday {
                    position: absolute;
                    z-index: 3;
                    bottom: 3%;
                    left: 4%;
                    width: 22%;
                    height: auto;
                    pointer-events: none;
                }

                .support-card-thumb.with-levels .support-card-birthday {
                    bottom: 18%;
                }

                .support-card-thumb.with-levels .support-card-birthday.thumbnail-with-levels {
                    bottom: 8%;
                    left: 7%;
                    width : 20%;
                }

                .support-wl-badge {
                    position: absolute;
                    z-index: 5;
                    top: 4px;
                    right: 4px;
                    max-width: calc(100% - 8px);
                    padding: 2px 5px;
                    border-radius: 5px;
                    background: rgba(14, 165, 164, 0.92);
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 900;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
                    pointer-events: none;
                }

                .support-skill-badge {
                    position: absolute;
                    z-index: 1;
                    left: 0;
                    bottom: 0;
                    height: 19%;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 0 32% 0 7%;
                    border-radius: 0 0 7px 7px;
                    background: rgba(45, 48, 84, 0.9);
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 900;
                    line-height: 1;
                    letter-spacing: 0;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
                    pointer-events: none;
                    transform: translateY(-4%);
                }

                .support-mastery-badge {
                    position: absolute;
                    z-index: 6;
                    right: 4%;
                    bottom: 3%;
                    width: 30%;
                    height: auto;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.28));
                    pointer-events: none;
                }

                .support-modal.support-main-modal {
                    width: min(1120px, 100%);
                }

                .support-main-summary {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 12px 14px;
                    border-bottom: 1px solid #e8eef6;
                    background: #ffffff;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 900;
                }

                .support-main-summary strong {
                    color: var(--support-green);
                    font-size: 18px;
                    font-variant-numeric: tabular-nums;
                }

                .support-main-deck-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 12px;
                }

                .support-main-slot {
                    min-width: 0;
                    border: 1px solid var(--support-border);
                    border-radius: 8px;
                    background: #ffffff;
                    padding: 10px;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
                }

                .support-main-preview-wrap {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    margin-bottom: 8px;
                }

                .support-main-preview-card.empty .support-card-face {
                    filter: grayscale(0.35);
                    opacity: 0.54;
                }

                .support-main-preview-card.empty .support-card-attribute,
                .support-main-preview-card.empty .support-card-frame {
                    opacity: 0.62;
                }

                .support-main-slot-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 12px;
                    font-weight: 900;
                    color: var(--support-muted);
                }

                .support-main-slot-header strong {
                    color: var(--support-green);
                    font-variant-numeric: tabular-nums;
                }

                .support-main-toggle {
                    border: 1px solid #d5deea;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #475569;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 900;
                    white-space: nowrap;
                    transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
                }

                .support-main-toggle:hover {
                    border-color: #93c5fd;
                    color: var(--support-blue);
                    background: #f8fafc;
                }

                .support-main-toggle.active {
                    border-color: #22c55e;
                    background: #ecfdf5;
                    color: #047857;
                }



                .support-main-toggle:disabled {
                    cursor: not-allowed;
                    opacity: 0.48;
                    background: #f8fafc;
                    color: #94a3b8;
                }

                .support-main-control-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px;
                }

                .support-main-toggle-row {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 5px;
                    margin-top: 6px;
                }

                .support-main-toggle {
                    height: 32px;
                    padding: 0 6px;
                }

                .support-main-breakdown {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 4px;
                    margin-top: 8px;
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 800;
                }

                .support-main-breakdown span {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                    min-width: 0;
                    border-radius: 6px;
                    background: #f8fafc;
                    padding: 4px 5px;
                }

                .support-main-breakdown b {
                    color: #334155;
                    font-variant-numeric: tabular-nums;
                }

                .support-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    background: rgba(15, 23, 42, 0.58);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .support-modal {
                    width: min(1040px, 100%);
                    max-height: 100%;
                    border-radius: 8px;
                    background: #ffffff;
                    box-shadow: 0 26px 70px rgba(15, 23, 42, 0.34);
                    display: flex;
                    flex-direction: column;
                    overflow: visible;
                }

                .support-modal-header {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: start;
                    gap: 12px;
                    padding: 14px;
                    border-bottom: 1px solid var(--support-border);
                    background: #f8fbff;
                }

                .support-modal-header h3 {
                    margin: 0 0 4px;
                    font-size: 18px;
                    color: var(--support-ink);
                }

                .support-modal-header p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--support-muted);
                    line-height: 1.4;
                }

                .support-modal-actions {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .support-modal-close,
                .support-modal-clear {
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 900;
                    padding: 0 10px;
                    cursor: pointer;
                }

                .support-modal-clear {
                    color: var(--support-rose);
                    border-color: #f5bfd0;
                }

                .support-modal-tools {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding: 12px 14px;
                    border-bottom: 1px solid #e8eef6;
                }

                .support-count {
                    color: var(--support-muted);
                    font-size: 12px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .support-modal-scroll {
                    overflow-y: auto;
                    padding: 14px;
                }

                .support-picker-section + .support-picker-section {
                    margin-top: 18px;
                }

                .support-picker-heading {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0 0 8px;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 900;
                }

                .support-picker-heading span {
                    color: var(--support-muted);
                    font-size: 11px;
                    font-weight: 800;
                }

                .support-card-picker-button {
                    border: 0;
                    padding: 0;
                    background: transparent;
                    cursor: pointer;
                    text-align: left;
                    min-width: 0;
                    aspect-ratio: 1 / 1;
                }

                .support-empty-list {
                    padding: 40px 12px;
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    font-weight: 800;
                }

                @media (max-width: 920px) {
                    .support-header {
                        grid-template-columns: 1fr;
                    }

                    .support-summary {
                        min-width: 0;
                    }
                }

                @media (max-width: 768px) {
                    .support-tab {
                        padding: 0 2px;
                    }

                    .support-title-row h2 {
                        font-size: 19px;
                    }

                    .support-summary {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }

                    .support-summary-box {
                        padding: 8px 7px;
                    }

                    .support-summary-box span {
                        font-size: 10px;
                    }

                    .support-summary-box strong {
                        font-size: 16px;
                    }

                    .support-toolbar {
                        justify-content: space-between;
                    }

                    .support-chip {
                        margin-right: 0;
                    }

                    .support-action-group {
                        width: 100%;
                        justify-content: flex-end;
                        margin-top: 4px;
                    }

                    .support-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 8px;
                    }

                    .support-slot {
                        padding: 6px;
                    }

                    .support-slot-controls {
                        gap: 4px;
                    }

                    .support-select-button {
                        height: 30px;
                        padding: 0 5px;
                        font-size: 10px !important;
                    }

                    .support-select-menu button {
                        font-size: 12px !important;
                    }

                    .support-modal-backdrop {
                        padding: 8px;
                    }

                    .support-modal-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 10px 12px;
                        border-bottom: none;
                    }

                    .support-modal-header h3 {
                        display: none;
                    }

                    .support-modal-actions {
                        justify-content: flex-end;
                        flex-shrink: 0;
                        flex-wrap: nowrap;
                    }

                    .support-modal-header p {
                        display: none;
                    }

                    .support-picker-character-bar {
                        padding: 10px 12px;
                        border-bottom: none;
                    }

                    .support-modal-tools {
                        padding: 8px 12px;
                    }

                    .support-picker-character-button {
                        width: 40px;
                        height: 40px;
                    }



                    .support-main-deck-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 8px;
                    }

                    .support-main-slot {
                        padding: 6px;
                    }

                    .support-main-slot-header {
                        font-size: 10px;
                        margin-bottom: 6px;
                    }

                    .support-main-toggle {
                        height: 26px;
                        padding: 0 3px;
                        font-size: 9px !important;
                    }

                    .support-main-control-grid {
                        gap: 4px;
                    }

                    .support-main-breakdown {
                        font-size: 8px;
                        gap: 2px;
                        margin-top: 6px;
                    }
                }

                @media (max-width: 420px) {
                    .support-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 4px;
                    }

                    .support-slot {
                        padding: 4px;
                    }

                    .support-slot-controls {
                        gap: 3px;
                    }

                    .support-select-button {
                        padding: 0 3px;
                        font-size: 9px !important;
                    }

                    .support-main-deck-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 4px;
                    }

                    .support-main-slot {
                        padding: 4px;
                    }

                    .support-main-slot-header {
                        font-size: 9px;
                        margin-bottom: 4px;
                    }

                    .support-main-toggle {
                        height: 24px;
                        padding: 0 2px;
                        font-size: 8px !important;
                    }

                    .support-main-control-grid {
                        gap: 3px;
                    }

                    .support-main-breakdown {
                        font-size: 7.5px;
                        gap: 1.5px;
                        margin-top: 4px;
                    }
                }
            `}),(0,S.jsxs)(`div`,{className:`support-header`,children:[(0,S.jsxs)(`div`,{className:`support-title-row`,children:[(0,S.jsx)(d,{selectedId:s,onSelect:e=>u(Number(e)),language:e}),(0,S.jsx)(`span`,{className:`support-chip`,children:r(`support.slots_25`)})]}),(0,S.jsxs)(`div`,{className:`support-summary`,children:[(0,S.jsxs)(`div`,{className:`support-summary-box`,children:[(0,S.jsx)(`span`,{children:r(`support.selected`)}),(0,S.jsxs)(`strong`,{children:[ze,`/`,C]})]}),(0,S.jsxs)(`div`,{className:`support-summary-box`,children:[(0,S.jsx)(`span`,{children:r(`support.event`)}),(0,S.jsx)(`strong`,{children:_(Y)}),Fe&&(0,S.jsxs)(`small`,{className:`support-summary-detail`,style:{whiteSpace:`nowrap`},children:[(0,S.jsxs)(`span`,{children:[`+`,_(J),` =`]}),(0,S.jsx)(`span`,{className:`support-summary-total`,children:_(X)})]}),Re&&(0,S.jsxs)(`small`,{className:`support-theory-loss`,children:[(0,S.jsxs)(`span`,{className:`support-theory-loss-line`,children:[(0,S.jsx)(`span`,{children:r(`support.theory_compare_prefix`)}),(0,S.jsx)(`b`,{className:`support-theory-bonus`,children:_(Z)}),(0,S.jsx)(`span`,{children:r(`support.theory_compare_middle`)})]}),(0,S.jsx)(`br`,{className:`support-theory-loss-break`}),(0,S.jsx)(`span`,{className:`support-theory-loss-line`,children:Le?(0,S.jsx)(`b`,{className:`support-theory-perfect`,children:r(`support.theory_perfect`)}):(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(`b`,{className:`support-theory-loss-value`,children:_(Ie)}),(0,S.jsx)(`span`,{children:r(`support.theory_compare_suffix`)})]})})]})]}),(0,S.jsxs)(`div`,{className:`support-summary-box`,children:[(0,S.jsx)(`span`,{children:r(`support.badge`)}),(0,S.jsx)(`strong`,{children:_(Ne)}),Fe&&(0,S.jsxs)(`small`,{className:`support-summary-detail`,style:{whiteSpace:`nowrap`},children:[(0,S.jsxs)(`span`,{children:[`+`,_(J),` =`]}),(0,S.jsx)(`span`,{className:`support-summary-total`,children:_(Pe)})]})]})]})]}),(0,S.jsxs)(`div`,{className:`support-toolbar`,children:[(0,S.jsx)(`span`,{className:`support-chip`,children:je?r(`support.four_star_cards_wl3`).replace(`{{name}}`,p(s,e)).replace(`{{count}}`,Ae):r(`support.four_star_cards`).replace(`{{name}}`,p(s,e)).replace(`{{count}}`,Ae)}),(0,S.jsx)(`button`,{type:`button`,className:`support-ghost-button support-main-open-button ${Fe?`active`:``}`,onClick:()=>L(!0),children:r(`support.main_deck`)}),(0,S.jsxs)(`div`,{className:`support-action-group`,children:[(0,S.jsx)(`button`,{type:`button`,className:`support-ghost-button ${j?`active`:``}`,onClick:()=>he(e=>!e),"aria-pressed":j,children:r(`support.finale`)}),(0,S.jsx)(`button`,{type:`button`,className:`support-ghost-button`,onClick:Je,children:r(`support.support_theory`)}),(0,S.jsx)(`button`,{type:`button`,className:`support-ghost-button`,onClick:Ye,children:r(`support.sort`)}),(0,S.jsx)(`button`,{type:`button`,className:`support-ghost-button`,onClick:qe,children:r(`support.reset`)}),(0,S.jsxs)(`div`,{className:`support-bulk-wrap`,ref:H,children:[(0,S.jsx)(`button`,{type:`button`,className:`support-ghost-button ${z?`active`:``}`,onClick:()=>B(e=>!e),children:r(`support.bulk`)}),z&&(0,S.jsxs)(`div`,{className:`support-bulk-panel`,children:[(0,S.jsx)(`label`,{children:r(`support.master_rank`)}),(0,S.jsx)(l,{value:Te,onChange:e=>Ee(Number(e)),ariaLabel:r(`support.master_rank`),buttonClassName:`!h-[30px] !w-14 !rounded-[7px] !border-[#d5deea] !px-5 !text-xs !font-extrabold`,options:T.map(e=>({value:e,label:e}))}),(0,S.jsx)(`label`,{children:r(`support.skill`)}),(0,S.jsx)(l,{value:De,onChange:e=>Oe(Number(e)),ariaLabel:r(`support.skill`),buttonClassName:`!h-[30px] !w-[72px] !rounded-[7px] !border-[#d5deea] !px-5 !text-xs !font-extrabold`,options:ae.map(e=>({value:e,label:r(`support.skill_level`,{v:e})}))}),(0,S.jsx)(`button`,{type:`button`,className:`support-bulk-apply`,onClick:Xe,children:r(`support.apply`)})]})]})]})]}),(0,S.jsx)(`div`,{className:`support-grid`,children:K.map(({slot:e,card:t,bonus:n},i)=>(0,S.jsxs)(`div`,{className:`support-slot`,children:[(0,S.jsx)(`button`,{type:`button`,className:`support-slot-card`,onClick:()=>Ge(i),"aria-label":`${Be(i)} ${r(`support.card_select`)}`,children:t?(0,S.jsx)(f,{card:t,showLevels:!0,masterRank:e.masterRank,skillLevel:e.skillLevel}):(0,S.jsxs)(`div`,{className:`support-empty-card`,children:[(0,S.jsx)(`span`,{children:`+`}),(0,S.jsx)(`span`,{children:i+1})]})}),(0,S.jsxs)(`div`,{className:`support-slot-meta`,children:[(0,S.jsx)(`span`,{children:re(t)===`birthday`?`BD`:t?`★${t.rarity}`:`-`}),(0,S.jsx)(`strong`,{children:_(n.total)})]}),(0,S.jsxs)(`div`,{className:`support-slot-controls`,children:[(0,S.jsx)(A,{value:e.masterRank,options:T,onChange:e=>Q(i,{masterRank:e}),prefix:r(`support.master_rank`)}),(0,S.jsx)(A,{value:e.skillLevel,options:ae,onChange:e=>Q(i,{skillLevel:e}),prefix:r(`support.skill`),formatOption:e=>r(`support.skill_level`,{v:e})})]})]},i))}),Ce&&(0,S.jsx)(`div`,{className:`support-modal-backdrop`,onMouseDown:()=>L(!1),children:(0,S.jsxs)(`div`,{className:`support-modal support-main-modal`,onMouseDown:e=>e.stopPropagation(),children:[(0,S.jsxs)(`div`,{className:`support-modal-header`,children:[(0,S.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`},children:(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`h3`,{children:r(`support.main_deck`)}),(0,S.jsxs)(`p`,{children:[r(`support.event`),` `,_(X),` · `,r(`support.badge`),` `,_(Pe)]})]})}),(0,S.jsxs)(`div`,{className:`support-modal-actions`,children:[(0,S.jsx)(`button`,{type:`button`,className:`support-modal-close`,onClick:Ue,children:r(`support.main_theory`)}),(0,S.jsx)(`button`,{type:`button`,className:`support-modal-clear`,onClick:He,children:r(`support.reset_short`)}),(0,S.jsx)(`button`,{type:`button`,className:`support-modal-close`,onClick:()=>L(!1),children:r(`support.close`)})]})]}),(0,S.jsxs)(`div`,{className:`support-main-summary`,children:[(0,S.jsx)(`span`,{children:r(`support.main_deck_total`)}),(0,S.jsx)(`strong`,{children:_(J)})]}),(0,S.jsx)(`div`,{className:`support-modal-scroll custom-scrollbar`,children:(0,S.jsx)(`div`,{className:`support-main-deck-grid`,children:q.map(({slot:e,rarityOption:t,bonus:n},i)=>{let a=!!e.rarityKey,o=t.canPickup;return(0,S.jsxs)(`div`,{className:`support-main-slot`,children:[(0,S.jsxs)(`div`,{className:`support-main-slot-header`,children:[(0,S.jsx)(`span`,{children:Be(i)}),(0,S.jsx)(`strong`,{children:_(n.total)})]}),(0,S.jsx)(`div`,{className:`support-main-preview-wrap`,style:{cursor:`pointer`,transition:`transform 0.1s`},onClick:()=>{R(V),I(i)},onMouseOver:e=>e.currentTarget.style.transform=`scale(1.05)`,onMouseOut:e=>e.currentTarget.style.transform=`scale(1)`,title:r(`support.card_select`),children:(0,S.jsx)(pe,{rarityKey:e.rarityKey,masterRank:e.masterRank,previewCharId:s,card:e.card,skillText:r(`support.skill_level`,{v:4}),emptyText:r(`support.empty`)})}),(0,S.jsxs)(`div`,{className:`support-main-control-grid`,children:[(0,S.jsx)(me,{value:e.rarityKey,options:se,onChange:e=>$(i,{rarityKey:e}),prefix:r(`support.rarity`)}),(0,S.jsx)(A,{value:e.masterRank,options:T,onChange:e=>$(i,{masterRank:e}),prefix:r(`support.master_rank`)})]}),(0,S.jsxs)(`div`,{className:`support-main-toggle-row`,children:[(0,S.jsx)(`button`,{type:`button`,className:`support-main-toggle ${e.typeMatched?`active`:``}`,onClick:()=>$(i,{typeMatched:!e.typeMatched}),disabled:!a,"aria-pressed":e.typeMatched,children:r(`support.type`)}),(0,S.jsx)(`button`,{type:`button`,className:`support-main-toggle ${e.featured?`active`:``}`,onClick:()=>$(i,{featured:!e.featured}),disabled:!a,"aria-pressed":e.featured,children:r(`support.featured`)}),(0,S.jsx)(`button`,{type:`button`,className:`support-main-toggle ${e.pickup?`active`:``}`,onClick:()=>$(i,{pickup:!e.pickup}),disabled:!o,"aria-pressed":e.pickup,children:r(`support.pickup`)})]}),(0,S.jsxs)(`div`,{className:`support-main-breakdown`,"aria-label":`${Ve(i)} ${r(`support.main_deck`)}`,children:[(0,S.jsxs)(`span`,{children:[r(`support.member`),` `,(0,S.jsx)(`b`,{children:_(n.member)})]}),(0,S.jsxs)(`span`,{children:[r(`support.featured`),` `,(0,S.jsx)(`b`,{children:_(n.character)})]}),(0,S.jsxs)(`span`,{children:[r(`support.type`),` `,(0,S.jsx)(`b`,{children:_(n.type)})]}),(0,S.jsxs)(`span`,{children:[r(`support.master_rank`),` `,(0,S.jsx)(`b`,{children:_(n.masterRank)})]})]})]},i)})})})]})}),(0,S.jsx)(ee,{isOpen:N!==null||F!==null,isMain:F!==null,activeIndex:F===null?N===null?0:N:F,onClose:()=>{P(null),I(null)},onClear:()=>{F===null?Ke():$(F,{card:null,rarityKey:``})},onSelectCard:e=>{if(F!==null){let t=e.type===`Birthday`||e.type===`Anniversary`?`birthday`:`rarity${e.rarity}`;$(F,{card:e,rarityKey:t}),ke(m(e)),I(null)}else We(e),P(null)},selectedCharId:s,pickerCharId:we,setPickerCharId:R,cards:M,cardsLoading:ye,cardsError:xe,unitMemberIds:G,activeSlotCardId:F===null?Ze?.slot?.cardId:b[F]?.card?.id})]})};export{j as default};