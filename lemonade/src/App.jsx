import { useState, useRef, useEffect } from "react";
import { 
  ai_chat, 
  ai_draftSection, 
  ai_fullAnalysis, 
  ai_refine, 
  ai_deliveryAnalysis, 
  ai_scoreCompare 
} from "../genai.js";
 
// ══════════════════════════════════════════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════════════════════════════════════════
const T = {
  bg:"#FEFCF0",surface:"#FFFEF7",card:"#FFFFFF",
  border:"#EAE4C8",borderMid:"#D5CC9A",
  lemon:"#F2D200",lemonDark:"#B89C00",lemonSoft:"#FFFBE6",lemonMid:"#FFF3A3",
  grove:"#2A6B3C",groveSoft:"#EBF5EE",groveLight:"#CCE9D5",
  citrus:"#D96B00",citrusSoft:"#FFF0DC",
  text:"#1A1500",muted:"#7A7250",mutedLight:"#B8AE88",
  danger:"#C43333",dangerSoft:"#FDEAEA",
  success:"#1B6B32",successSoft:"#E4F5EB",
  warn:"#A86A00",warnSoft:"#FFF4DC",
  blue:"#1455A8",blueSoft:"#E6F0FD",
  purple:"#5C2EA0",purpleSoft:"#F2EEFF",
};
const FONT=`'DM Sans',system-ui,sans-serif`;
const MONO=`'DM Mono','Courier New',monospace`;
const SERIF=`'Playfair Display',Georgia,serif`;
const GF=`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@300;400;500&display=swap');`;
 
const PITCH_SECTIONS=[
  {key:"premise",label:"Premise",icon:"P",desc:"The situation — what's broken today?",color:T.citrus,soft:T.citrusSoft},
  {key:"idea",   label:"Idea",   icon:"I",desc:"Your solution — the unique answer.",  color:T.lemonDark,soft:T.lemonSoft},
  {key:"tell",   label:"Tell",   icon:"T",desc:"How it works — the mechanics.",        color:T.grove,soft:T.groveSoft},
  {key:"clarify",label:"Clarify",icon:"C",desc:"Key benefits — quantified value.",     color:T.purple,soft:T.purpleSoft},
  {key:"help",   label:"Help",   icon:"H",desc:"Future outlook — ask & vision.",       color:T.blue,soft:T.blueSoft},
];
 
// LS helpers
const LS="lemonade_v3";
const lsLoad=()=>{try{return JSON.parse(localStorage.getItem(LS)||"[]")}catch{return[]}};
const lsSave=(d)=>{try{localStorage.setItem(LS,JSON.stringify(d))}catch{}};
const lsUpsert=(arr,s)=>{const i=arr.findIndex(x=>x.id===s.id),n=Date.now();const u=i>=0?arr.map((x,j)=>j===i?{...x,...s,updatedAt:n}:x):[{...s,createdAt:n,updatedAt:n},...arr];lsSave(u);return u};
const lsDel=(arr,id)=>{const u=arr.filter(s=>s.id!==id);lsSave(u);return u};
const mkId=()=>`s_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
 
// ══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════════════════
const GS=()=>(
  <style>{`${GF}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:${T.bg};color:${T.text};font-family:${FONT};font-size:15px}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:3px}
    textarea,input,select{font-family:${FONT}}
    ::placeholder{color:${T.mutedLight}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fu{animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
    .fi{animation:fadeIn .25s ease both}
    .fl{animation:float 3.5s ease-in-out infinite}
    input:focus,textarea:focus{outline:2px solid ${T.lemon};outline-offset:1px}
    input[type=range]{accent-color:${T.lemon}}
  `}</style>
);
 
// ══════════════════════════════════════════════════════════════════════════════
//  UI ATOMS
// ══════════════════════════════════════════════════════════════════════════════
const Btn=({children,onClick,v="primary",style={},disabled=false,sm=false,full=false})=>{
  const VS={
    primary:{background:T.lemon,color:T.text,border:`1.5px solid ${T.lemonDark}`},
    grove:{background:T.grove,color:"#fff",border:`1.5px solid ${T.grove}`},
    citrus:{background:T.citrus,color:"#fff",border:`1.5px solid ${T.citrus}`},
    secondary:{background:T.card,color:T.text,border:`1.5px solid ${T.border}`},
    ghost:{background:"transparent",color:T.muted,border:"none"},
    danger:{background:T.dangerSoft,color:T.danger,border:`1.5px solid ${T.danger}44`},
    outline:{background:"transparent",color:T.grove,border:`1.5px solid ${T.grove}`},
    lemon:{background:T.lemonSoft,color:T.lemonDark,border:`1.5px solid ${T.lemonMid}`},
    outlineC:{background:"transparent",color:T.citrus,border:`1.5px solid ${T.citrus}`},
  };
  return(
    <button onClick={onClick} disabled={disabled} style={{
      ...VS[v],fontFamily:FONT,fontWeight:600,letterSpacing:"0.01em",
      fontSize:sm?"12px":"13.5px",padding:sm?"4px 11px":"8px 18px",
      borderRadius:"8px",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,
      transition:"all 0.17s",width:full?"100%":"auto",
      display:"inline-flex",alignItems:"center",gap:"6px",...style,
    }}>{children}</button>
  );
};
 
const Chip=({label,color=T.grove,bg})=>(
  <span style={{fontSize:"11px",fontFamily:MONO,fontWeight:500,color,background:bg||color+"18",border:`1px solid ${color}2A`,borderRadius:"20px",padding:"2px 9px",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{label}</span>
);
 
const Spin=({size=15,color=T.lemonDark})=>(
  <span style={{display:"inline-block",width:size,height:size,border:`2px solid ${color}33`,borderTopColor:color,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
);
 
const Card=({children,style={},onClick})=>(
  <div onClick={onClick} style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:"13px",padding:"16px 18px",cursor:onClick?"pointer":undefined,...style}}>{children}</div>
);
 
const Bar=({v,max=100})=>{
  const p=Math.round((v/max)*100),c=p>=70?T.success:p>=50?T.warn:T.danger;
  return(<div style={{height:"5px",borderRadius:"3px",background:T.border,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${p}%`,background:c,borderRadius:"3px",transition:"width 1s cubic-bezier(.22,1,.36,1)"}}/>
  </div>);
};
 
const PB=({sec,size=24})=>(
  <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:size,height:size,borderRadius:"50%",background:sec.color,color:"#fff",fontWeight:800,fontSize:size*.45,fontFamily:SERIF,flexShrink:0}}>{sec.icon}</span>
);
 
// Drop zone
function DropZone({onText,label="Drop slides or doc here",sm=false}){
  const[drag,setDrag]=useState(false);
  const[name,setName]=useState(null);
  const ref=useRef();
  const read=(f)=>{
    setName(f.name);
    if(/\.(pdf|pptx|docx)$/.test(f.name)){
      onText(`[Uploaded: ${f.name}]\n[Type: ${f.name.split(".").pop().toUpperCase()}]\n\nDocument uploaded for AI analysis. In production, content would be extracted server-side and mapped to the PITCH framework.`);
    } else {
      const r=new FileReader();r.onload=e=>onText(e.target.result);r.readAsText(f);
    }
  };
  return(
    <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)read(f)}}
      onClick={()=>ref.current?.click()}
      style={{border:`2px dashed ${drag?T.lemonDark:T.borderMid}`,borderRadius:"9px",padding:sm?"12px":"20px 16px",background:drag?T.lemonSoft:T.surface,cursor:"pointer",textAlign:"center",transition:"all .2s"}}>
      <input ref={ref} type="file" style={{display:"none"}} accept=".txt,.md,.pdf,.pptx,.docx,.json" onChange={e=>{const f=e.target.files[0];if(f)read(f)}}/>
      {name
        ?<div style={{fontSize:"13px",color:T.grove,fontWeight:600}}>✓ {name}</div>
        :<>
          <div style={{fontSize:sm?"18px":"22px",marginBottom:"5px"}}>🍋</div>
          <div style={{fontSize:"13px",color:T.text,fontWeight:500}}>{label}</div>
          <div style={{fontSize:"11px",color:T.muted,marginTop:"3px"}}>PDF · PPTX · DOCX · TXT · MD</div>
        </>
      }
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
//  EXPORT — PPTX (via CDN pptxgenjs) + PDF (print window) + text
// ══════════════════════════════════════════════════════════════════════════════
function buildAndDownloadPPTX(profile,sections){
  return new Promise((resolve,reject)=>{
    const go=(PptxGenJS)=>{
      try{
        const pres=new PptxGenJS();
        pres.layout="LAYOUT_16x9";
        pres.title=`${profile.company||"Pitch"} — Lemonade Deck`;
        const SC={premise:"E87400",idea:"B89C00",tell:"2A6B3C",clarify:"5C2EA0",help:"1455A8"};
        const W="FFFFFF",BG="FEFCF0",DARK="1A1500",LEM="F2D200",MUT="7A7250";
 
        // Cover
        const cv=pres.addSlide();
        cv.background={color:DARK};
        cv.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:.32,h:5.625,fill:{color:LEM},line:{color:LEM}});
        cv.addText("🍋 lemonade",{x:.55,y:.35,w:4,h:.5,fontSize:13,color:LEM,fontFace:"Georgia",charSpacing:3});
        cv.addText(profile.company||"Pitch Deck",{x:.55,y:1,w:8.8,h:1.8,fontSize:54,color:W,fontFace:"Georgia",bold:true,lineSpacingMultiple:1.05});
        cv.addText(profile.industry||"",{x:.55,y:2.9,w:7,h:.55,fontSize:20,color:LEM,fontFace:"Georgia",italic:true});
        cv.addText([{text:profile.stage||"",options:{color:"AAAAAA"}},{text:"  ·  ",options:{color:"555555"}},{text:profile.ask||"",options:{color:"AAAAAA"}}],{x:.55,y:3.55,w:8,h:.45,fontSize:14,fontFace:"Calibri"});
        cv.addShape(pres.shapes.RECTANGLE,{x:0,y:5.33,w:10,h:.295,fill:{color:LEM},line:{color:LEM}});
        cv.addText("BUILT WITH LEMONADE · PITCH FRAMEWORK",{x:0,y:5.33,w:10,h:.295,fontSize:8,color:DARK,fontFace:"Courier New",bold:true,align:"center",valign:"middle",charSpacing:3});
 
        // Content slides
        PITCH_SECTIONS.forEach((sec,idx)=>{
          const content=sections[sec.key]||"(Not yet written)";
          const sl=pres.addSlide();
          sl.background={color:BG};
          sl.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:.07,h:5.625,fill:{color:SC[sec.key]},line:{color:SC[sec.key]}});
          sl.addShape(pres.shapes.RECTANGLE,{x:.07,y:0,w:9.93,h:1.05,fill:{color:W},line:{color:"EAE4C8",width:.5}});
          sl.addShape(pres.shapes.OVAL,{x:.22,y:.18,w:.69,h:.69,fill:{color:SC[sec.key]},line:{color:SC[sec.key]}});
          sl.addText(sec.icon,{x:.22,y:.18,w:.69,h:.69,fontSize:22,fontFace:"Georgia",bold:true,color:W,align:"center",valign:"middle"});
          sl.addText(sec.label.toUpperCase(),{x:1.05,y:.2,w:4,h:.33,fontSize:11,color:SC[sec.key],fontFace:"Courier New",bold:true,charSpacing:4});
          sl.addText(sec.desc,{x:1.05,y:.52,w:7.5,h:.38,fontSize:12,color:MUT,fontFace:"Calibri"});
          sl.addText(`${idx+1} / ${PITCH_SECTIONS.length}`,{x:8.3,y:.3,w:1.5,h:.4,fontSize:11,color:"CCCCCC",fontFace:"Courier New",align:"right"});
          sl.addShape(pres.shapes.RECTANGLE,{x:.28,y:1.22,w:9.44,h:3.94,fill:{color:W},line:{color:"EAE4C8",width:.75},shadow:{type:"outer",color:"000000",blur:8,offset:2,angle:135,opacity:.05}});
          const sents=content.split(/(?<=[.!?])\s+/).filter(Boolean);
          if(sents.length<=4){
            sl.addText(content,{x:.52,y:1.42,w:9,h:3.54,fontSize:15,color:DARK,fontFace:"Calibri",lineSpacingMultiple:1.55,valign:"top"});
          }else{
            const bulls=sents.map((s,i)=>({text:s,options:{bullet:i<sents.length-1,breakLine:i<sents.length-1,paraSpaceAfter:5}}));
            sl.addText(bulls,{x:.52,y:1.42,w:9,h:3.54,fontSize:14,color:DARK,fontFace:"Calibri",lineSpacingMultiple:1.45,valign:"top"});
          }
          sl.addText(profile.company||"",{x:.28,y:5.36,w:5,h:.2,fontSize:9,color:"CCCCCC",fontFace:"Courier New"});
        });
 
        // Thank you slide
        const ty=pres.addSlide();
        ty.background={color:DARK};
        ty.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:.07,fill:{color:LEM},line:{color:LEM}});
        ty.addText("Thank You",{x:1,y:1.3,w:8,h:1.4,fontSize:56,color:W,fontFace:"Georgia",bold:true,align:"center"});
        ty.addText(profile.company||"",{x:1,y:2.8,w:8,h:.7,fontSize:26,color:LEM,fontFace:"Georgia",italic:true,align:"center"});
        ty.addText(profile.ask?`Raising ${profile.ask}`:"",{x:2,y:3.6,w:6,h:.5,fontSize:16,color:"888888",fontFace:"Calibri",align:"center"});
        ty.addText("Built with 🍋 Lemonade · PITCH Framework",{x:1,y:4.9,w:8,h:.4,fontSize:10,color:"555555",fontFace:"Courier New",align:"center",charSpacing:2});
 
        pres.writeFile({fileName:`${(profile.company||"pitch").replace(/\s+/g,"_")}_deck.pptx`});
        resolve();
      }catch(e){reject(e);}
    };
    if(window.PptxGenJS){go(window.PptxGenJS);}
    else{
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
      s.onload=()=>go(window.PptxGenJS);
      s.onerror=()=>reject(new Error("Could not load PptxGenJS"));
      document.head.appendChild(s);
    }
  });
}
 
function openPDF(profile,sections){
  const SC={premise:T.citrus,idea:T.lemonDark,tell:T.grove,clarify:T.purple,help:T.blue};
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${profile.company||"Pitch"} Deck</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#FEFCF0;color:#1A1500;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{min-height:100vh;page-break-after:always;padding:60px 64px;display:flex;flex-direction:column}
.cover{background:#1A1500;color:#fff;justify-content:center}
.lemon-label{color:#F2D200;font-family:'Playfair Display',serif;font-size:14px;letter-spacing:4px;margin-bottom:10px}
.cover-title{font-family:'Playfair Display',serif;font-size:68px;font-weight:800;line-height:.97;margin-bottom:22px}
.cover-sub{font-family:'Playfair Display',serif;font-size:22px;color:#F2D200;font-style:italic;margin-bottom:28px}
.cover-meta{font-size:14px;color:#777;letter-spacing:1px}
.cover-bar{position:absolute;bottom:0;left:0;right:0;background:#F2D200;padding:5px 0;text-align:center;font-size:9px;font-weight:700;letter-spacing:3px;color:#1A1500}
.slide{background:#FFFEF7;border-top:4px solid #EAE4C8;position:relative}
.slide-header{display:flex;align-items:center;gap:14px;margin-bottom:28px}
.badge{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Playfair Display',serif;font-weight:800;font-size:20px;flex-shrink:0}
.section-name{font-size:11px;letter-spacing:4px;font-weight:700;text-transform:uppercase}
.section-desc{font-size:13px;color:#7A7250;margin-top:2px}
.content-box{background:#fff;border:1.5px solid #EAE4C8;border-radius:12px;padding:32px 36px;font-size:16px;line-height:1.8;flex:1}
.slide-num{margin-left:auto;font-size:11px;color:#ccc;font-family:monospace}
.close{background:#1A1500;color:#fff;align-items:center;justify-content:center;text-align:center}
.close-title{font-family:'Playfair Display',serif;font-size:60px;font-weight:800;margin-bottom:14px}
.close-co{font-family:'Playfair Display',serif;font-size:26px;color:#F2D200;font-style:italic}
@media print{.page{page-break-after:always}}
</style></head><body>
<div class="page cover" style="position:relative">
  <div class="lemon-label">🍋 LEMONADE · PITCH FRAMEWORK</div>
  <div class="cover-title">${profile.company||"Pitch Deck"}</div>
  <div class="cover-sub">${profile.industry||""}</div>
  <div class="cover-meta">${[profile.stage,profile.ask].filter(Boolean).join("  ·  ")}</div>
  <div class="cover-bar">BUILT WITH LEMONADE · ${new Date().getFullYear()}</div>
</div>
${PITCH_SECTIONS.map((sec,i)=>`
<div class="page slide">
  <div class="slide-header">
    <div class="badge" style="background:${SC[sec.key]}">${sec.icon}</div>
    <div><div class="section-name" style="color:${SC[sec.key]}">${sec.label}</div><div class="section-desc">${sec.desc}</div></div>
    <div class="slide-num">${i+1} / ${PITCH_SECTIONS.length}</div>
  </div>
  <div class="content-box">${(sections[sec.key]||"<em style='color:#BBB'>Not yet written</em>").replace(/\n/g,"<br/>")}</div>
</div>`).join("")}
<div class="page close">
  <div><div class="close-title">Thank You</div><div class="close-co">${profile.company||""}</div>
  ${profile.ask?`<div style="margin-top:20px;font-size:18px;color:#888">Raising ${profile.ask}</div>`:""}
  <div style="margin-top:44px;font-size:11px;color:#555;letter-spacing:3px">BUILT WITH 🍋 LEMONADE</div></div>
</div>
</body></html>`;
  const w=window.open("","_blank");
  w.document.write(html); w.document.close();
  setTimeout(()=>w.print(),700);
}
 
function exportText(profile,sections,fmt){
  const body=PITCH_SECTIONS.map(s=>fmt==="md"
    ?`## ${s.icon} ${s.label}\n_${s.desc}_\n\n${sections[s.key]||"*(Not written)*"}`
    :`${s.label.toUpperCase()}\n${"─".repeat(38)}\n${sections[s.key]||"(Not written)"}`
  ).join(fmt==="md"?"\n\n---\n\n":"\n\n");
  const full=fmt==="md"
    ?`# ${profile.company||"Pitch Deck"}\n_${[profile.industry,profile.stage,profile.ask].filter(Boolean).join(" · ")}_\n\n---\n\n${body}`
    :`${profile.company||"PITCH DECK"}\n${"═".repeat(46)}\n${[profile.industry,profile.stage,profile.ask].filter(Boolean).join(" | ")}\n\n${"═".repeat(46)}\n\n${body}`;
  const blob=new Blob([full],{type:"text/plain"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`${(profile.company||"pitch").replace(/\s+/g,"_")}.${fmt}`;
  a.click();URL.revokeObjectURL(a.href);
}
 
// ══════════════════════════════════════════════════════════════════════════════
//  LANDING
// ══════════════════════════════════════════════════════════════════════════════
function Landing({onSelect,sessions,onResume,onDelete}){
  const[hov,setHov]=useState(null);
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 24px",position:"relative",overflow:"hidden"}}>
      {[300,500,700].map((s,i)=>(
        <div key={i} style={{position:"absolute",width:s,height:s,borderRadius:"50%",border:`1.5px solid ${T.lemon}${["40","22","12"][i]}`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
      ))}
      <div className="fl" style={{position:"absolute",top:"9%",right:"7%",fontSize:"54px",opacity:.14,pointerEvents:"none"}}>🍋</div>
      <div className="fl" style={{position:"absolute",bottom:"11%",left:"5%",fontSize:"38px",opacity:.09,pointerEvents:"none",animationDelay:"1.4s"}}>🍋</div>
      <div style={{position:"relative",zIndex:1,textAlign:"center",maxWidth:"660px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"9px",marginBottom:"26px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"50%",background:T.lemon,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px"}}>🍋</div>
          <span style={{fontFamily:SERIF,fontWeight:700,fontSize:"21px"}}>lemonade</span>
        </div>
        <h1 style={{fontFamily:SERIF,fontSize:"clamp(42px,8vw,82px)",fontWeight:800,lineHeight:.95,letterSpacing:"-.03em",marginBottom:"6px"}}>
          Pitch with<br/><span style={{color:T.lemonDark,fontStyle:"italic"}}>purpose.</span>
        </h1>
        <p style={{color:T.muted,fontSize:"15px",lineHeight:1.7,maxWidth:"400px",margin:"18px auto 38px"}}>
          Conversational AI pitch studio — build, refine, analyze, and export using the <strong style={{color:T.text}}>PITCH framework</strong>.
        </p>
        <div style={{display:"flex",gap:"7px",justifyContent:"center",flexWrap:"wrap",marginBottom:"40px"}}>
          {PITCH_SECTIONS.map(s=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:"5px",padding:"3px 11px",borderRadius:"20px",background:s.soft,border:`1px solid ${s.color}33`}}>
              <PB sec={s} size={18}/><span style={{fontSize:"11px",fontWeight:600,color:s.color}}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"14px",justifyContent:"center",flexWrap:"wrap"}}>
          {[{id:"creator",icon:"✏️",label:"I'm a Creator",sub:"Build & refine your pitch",accent:T.grove},
            {id:"reviewer",icon:"🔍",label:"I'm a Reviewer",sub:"Evaluate & grade pitches",accent:T.citrus}].map(o=>(
            <div key={o.id} onClick={()=>onSelect(o.id)} onMouseEnter={()=>setHov(o.id)} onMouseLeave={()=>setHov(null)}
              style={{width:"196px",padding:"22px 18px",background:hov===o.id?T.surface:T.card,border:`2px solid ${hov===o.id?o.accent:T.border}`,borderRadius:"14px",cursor:"pointer",transition:"all .2s",transform:hov===o.id?"translateY(-3px)":"none",boxShadow:hov===o.id?`0 6px 22px ${o.accent}18`:"none",textAlign:"left"}}>
              <div style={{fontSize:"24px",marginBottom:"11px"}}>{o.icon}</div>
              <div style={{fontWeight:700,fontSize:"15px",marginBottom:"4px"}}>{o.label}</div>
              <div style={{fontSize:"12px",color:T.muted,marginBottom:"12px"}}>{o.sub}</div>
              <div style={{fontSize:"12px",fontWeight:600,color:o.accent}}>Get started →</div>
            </div>
          ))}
        </div>
        {sessions.length>0&&(
          <div style={{marginTop:"44px",maxWidth:"480px",margin:"44px auto 0",textAlign:"left"}}>
            <div style={{fontSize:"11px",fontFamily:MONO,color:T.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:"9px"}}>Resume a session</div>
            {sessions.slice(0,4).map(sess=>(
              <div key={sess.id} style={{display:"flex",alignItems:"center",gap:"9px",padding:"8px 12px",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"9px",marginBottom:"6px"}}>
                <span style={{fontSize:"14px"}}>{sess.role==="creator"?"✏️":"🔍"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"13px",fontWeight:600}}>{sess.profile?.company||sess.profile?.name||"Session"}</div>
                  <div style={{fontSize:"11px",color:T.muted}}>{sess.role} · {new Date(sess.updatedAt).toLocaleDateString()}</div>
                </div>
                <Btn sm v="secondary" onClick={()=>onResume(sess)}>Resume</Btn>
                <button onClick={()=>onDelete(sess.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:"14px",padding:"2px 4px"}}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
//  ONBOARDING
// ══════════════════════════════════════════════════════════════════════════════
const CQS=[
  {k:"name",q:"What's your name?",ph:"Jane Smith"},
  {k:"company",q:"Company or startup name?",ph:"Acme AI Inc."},
  {k:"industry",q:"What industry are you in?",ph:"FinTech, HealthTech, SaaS…"},
  {k:"stage",q:"Funding stage?",ph:"Pre-seed, Seed, Series A…"},
  {k:"ask",q:"How much are you raising?",ph:"$500,000"},
  {k:"problem",q:"Core problem you solve?",ph:"Describe the pain point…"},
  {k:"solution",q:"Your solution?",ph:"Your unique approach…"},
  {k:"traction",q:"Any traction or early metrics?",ph:"Users, revenue, key wins…"},
  {k:"audience",q:"Target audience?",ph:"SMBs, consumers, enterprise…"},
];
const RQS=[
  {k:"name",q:"Your name?",ph:"John Investor"},
  {k:"role",q:"Your role?",ph:"VC Partner, Angel, Mentor…"},
  {k:"focus",q:"Investment focus?",ph:"SaaS, HealthTech, early-stage…"},
  {k:"criteria",q:"What do you prioritize in pitches?",ph:"Team, market size, traction…"},
];
 
function Onboarding({role,onComplete,initAns={}}){
  const qs=role==="creator"?CQS:RQS;
  const[ans,setAns]=useState(initAns);
  const[step,setStep]=useState(0);
  const cur=qs[step];
  const ac=role==="creator"?T.grove:T.citrus;
  const av=role==="creator"?"grove":"citrus";
  const next=()=>step<qs.length-1?setStep(s=>s+1):onComplete(ans);
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div style={{width:"100%",maxWidth:"510px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"30px"}}>
          <span style={{fontSize:"17px"}}>🍋</span>
          <span style={{fontFamily:SERIF,fontWeight:700,fontSize:"16px"}}>lemonade</span>
          <span style={{marginLeft:"auto",fontSize:"11px",color:T.muted,fontFamily:MONO}}>{role} setup</span>
        </div>
        <div style={{display:"flex",gap:"4px",marginBottom:"30px"}}>
          {qs.map((_,i)=><div key={i} style={{flex:1,height:"4px",borderRadius:"2px",background:i<=step?ac:T.border,transition:"background .3s"}}/>)}
        </div>
        <div className="fu" key={step}>
          <Chip label={`${step+1} of ${qs.length}`} color={ac}/>
          <h2 style={{fontFamily:SERIF,fontSize:"25px",fontWeight:700,margin:"13px 0 18px",lineHeight:1.2}}>{cur.q}</h2>
          <input value={ans[cur.k]||""} onChange={e=>setAns(a=>({...a,[cur.k]:e.target.value}))}
            onKeyDown={e=>e.key==="Enter"&&ans[cur.k]?.trim()&&next()}
            placeholder={cur.ph} autoFocus
            style={{width:"100%",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"9px",color:T.text,fontSize:"16px",padding:"12px 15px",outline:"none"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"22px"}}>
          <Btn v="ghost" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>← Back</Btn>
          <Btn v={av} onClick={next} disabled={!ans[cur.k]?.trim()}>
            {step===qs.length-1?"Let's go →":"Next →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
//  MARKDOWN RENDERER (simple inline)
// ══════════════════════════════════════════════════════════════════════════════
const md=(text)=>text
  .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
  .replace(/\*(.+?)\*/g,"<em>$1</em>")
  .replace(/`(.+?)`/g,`<code style="background:${T.lemonSoft};padding:1px 4px;border-radius:3px;font-family:${MONO};font-size:.9em">$1</code>`)
  .replace(/\n/g,"<br/>");
 
// ══════════════════════════════════════════════════════════════════════════════
//  CREATOR STUDIO
// ══════════════════════════════════════════════════════════════════════════════
function CreatorStudio({profile,sessionId,initData,onBack,onSave}){
  const[sections,setSections]=useState(initData?.sections||{});
  const[msgs,setMsgs]=useState(initData?.msgs||[{id:"w0",role:"ai",type:"welcome",
    text:`Hey ${profile.name?.split(" ")[0]||"there"} 👋 I'm your **Lemonade** pitch coach.\n\nLet's build **${profile.company}**'s pitch together using the **PITCH framework**.\n\nYou can:\n• Ask me to **draft any section** ("Draft my Premise")\n• **Upload** your existing slides to import\n• Ask for **analysis** or **feedback** at any time\n• **Refine** any draft I give you\n\nWhat would you like to start with?`}]);
  const[input,setInput]=useState("");
  const[aiLoading,setAiLoading]=useState(false);
  const[activeSection,setActiveSection]=useState(null);
  const[analysis,setAnalysis]=useState(initData?.analysis||null);
  const[panel,setPanel]=useState("sections");
  const[exporting,setExporting]=useState(null);
  const chatRef=useRef(null);
  const inputRef=useRef(null);
 
  useEffect(()=>{onSave({sections,msgs,analysis})},[sections,msgs,analysis]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},[msgs,aiLoading]);
 
  const addMsg=(m)=>setMsgs(ms=>[...ms,{id:`m_${Date.now()}_${Math.random().toString(36).slice(2)}`, ...m}]);
 
  const send = async (text) => {
  const t = (text || input).trim();
  if (!t) return;

  // 1. Filter out the welcome message (id: "w0") and any message without text
  // 2. Ensure we only send "msg" types to keep the history clean
  const historyForAI = msgs
    .filter(m => m.id !== "w0" && m.type === "msg") 
    .map(m => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    }));
  console.log("AI got: ", t);
  setInput("");
  addMsg({ role: "user", type: "msg", text: t });
  setAiLoading(true);

  try {
    const resp = await ai_chat(t, profile, sections, historyForAI);
    // LOG THIS to see what App.jsx thinks 'resp' is
  console.log("App received response:", resp);
    // ... handle response 
    addMsg({ role: "ai", type: "msg", text: resp.text }); 
  } catch (error) {
    console.error(error);
  } finally {
    setAiLoading(false);
  }
};
  
  const runAnalysis=async(fromChat=false)=>{
    if(!fromChat)addMsg({role:"user",type:"msg",text:"Analyze my full pitch."});
    setAiLoading(true);
    try{
      const r=await ai_fullAnalysis(sections,profile);
      setAnalysis(r); setPanel("analysis");
      addMsg({role:"ai",type:"analysis",analysis:r});
    }finally{setAiLoading(false);}
  };
 
  const acceptDraft=(key,draft)=>{
    setSections(s=>({...s,[key]:draft}));
    const sec=PITCH_SECTIONS.find(s=>s.key===key);
    addMsg({role:"ai",type:"msg",text:`✓ **${sec?.label}** section saved! Want me to refine it, or move on to the next section?`});
  };
 
  const handleUpload=async(content)=>{
    addMsg({role:"user",type:"msg",text:"I've uploaded my existing pitch deck."});
    setAiLoading(true);
    try{
      await _sleep(1100);
      const words=content.split(/\s+/);
      const chunk=Math.ceil(words.length/5);
      const parsed={};
      PITCH_SECTIONS.forEach((sec,i)=>{
        const c=words.slice(i*chunk,(i+1)*chunk).join(" ");
        parsed[sec.key]=c.length>20?c:"";
      });
      setSections(s=>({...s,...parsed}));
      addMsg({role:"ai",type:"msg",text:"I've parsed your document into the PITCH framework! All 5 sections are now populated. Review each one in the **Sections** panel on the right, or ask me to refine any section. Want me to analyze what you've uploaded?"});
    }finally{setAiLoading(false);}
  };
 
  const GCOL=s=>s>=70?T.success:s>=50?T.warn:T.danger;
  const quickActions=[
    {label:"P Premise",k:"premise"},{label:"I Idea",k:"idea"},{label:"T Tell",k:"tell"},
    {label:"C Clarify",k:"clarify"},{label:"H Help",k:"help"},
    {label:"📊 Analyze",action:()=>runAnalysis()},
    {label:"✦ Draft all",action:()=>send("Generate all sections of my pitch")},
  ];
 
  return(
    <div style={{height:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:T.surface,borderBottom:`1.5px solid ${T.border}`,padding:"8px 16px",display:"flex",alignItems:"center",gap:"11px",flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontSize:"16px"}}>🍋</span>
        <span style={{fontFamily:SERIF,fontWeight:700,fontSize:"14px"}}>lemonade</span>
        <div style={{width:"1px",height:"15px",background:T.border}}/>
        <Btn v="ghost" sm onClick={onBack}>← Back</Btn>
        <span style={{fontWeight:600,fontSize:"14px"}}>{profile.company}</span>
        <Chip label={profile.stage} color={T.grove}/>
        <Chip label={profile.industry}/>
        <div style={{marginLeft:"auto",display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {[["sections","✏️ Sections"],["analysis","📊 Analysis"],["practice","🎙 Practice"],["export","⬇ Export"]].map(([id,lbl])=>(
            <Btn key={id} sm v={panel===id?"lemon":"ghost"} onClick={()=>setPanel(id)}>{lbl}</Btn>
          ))}
        </div>
      </div>
      <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 370px",overflow:"hidden"}}>
        <div style={{display:"flex",flexDirection:"column",borderRight:`1.5px solid ${T.border}`,overflow:"hidden"}}>
          <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"18px 18px 6px",display:"flex",flexDirection:"column",gap:"10px"}}>
            {msgs.map(msg=><MsgBubble key={msg.id} msg={msg} onAccept={acceptDraft} profile={profile} GCOL={GCOL} onSectionEdit={(k,v)=>setSections(s=>({...s,[k]:v}))}/>)}
            {aiLoading&&(
              <div style={{display:"flex",gap:"8px",alignItems:"center",padding:"9px 13px",background:T.card,border:`1.5px solid ${T.border}`,borderRadius:"11px",alignSelf:"flex-start",maxWidth:"180px"}}>
                <Spin size={13}/><span style={{fontSize:"13px",color:T.muted}}>Thinking…</span>
              </div>
            )}
          </div>
          {msgs.length<=2&&(
            <div style={{padding:"4px 16px 8px",display:"flex",flexWrap:"wrap",gap:"5px"}}>
              {quickActions.map(a=>(
                <button key={a.label} onClick={a.action||(() =>send(`Draft my ${a.label.split(" ").slice(1).join(" ")||a.label} section`))}
                  style={{padding:"4px 11px",fontSize:"12px",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"20px",cursor:"pointer",color:T.grove,fontWeight:500,fontFamily:FONT,transition:"all .17s"}}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <div style={{padding:"8px 14px 12px",borderTop:`1.5px solid ${T.border}`,display:"flex",gap:"9px",alignItems:"flex-end"}}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Ask me anything — draft a section, refine, analyze, or get coaching…" rows={2}
              style={{flex:1,background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"9px",color:T.text,fontSize:"14px",padding:"9px 12px",resize:"none",outline:"none",lineHeight:1.5,maxHeight:"110px"}}/>
            <Btn v="grove" onClick={()=>send()} disabled={aiLoading||!input.trim()} style={{flexShrink:0,alignSelf:"flex-end"}}>
              {aiLoading?<Spin size={13} color="#fff"/>:"Send"}
            </Btn>
          </div>
        </div>
        <div style={{overflow:"auto",background:T.surface}}>
          {panel==="sections"&&(
            <div style={{padding:"14px"}}>
              <div style={{fontSize:"11px",fontFamily:MONO,color:T.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:"10px"}}>PITCH Framework</div>
              {PITCH_SECTIONS.map(sec=>(
                <div key={sec.key} style={{marginBottom:"8px"}}>
                  <div onClick={()=>setActiveSection(activeSection===sec.key?null:sec.key)}
                    style={{display:"flex",alignItems:"center",gap:"9px",padding:"9px 11px",borderRadius:"9px",background:activeSection===sec.key?sec.soft:T.card,border:`1.5px solid ${activeSection===sec.key?sec.color+"55":T.border}`,cursor:"pointer",transition:"all .18s"}}>
                    <PB sec={sec} size={24}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"13px",fontWeight:600,color:activeSection===sec.key?sec.color:T.text}}>{sec.label}</div>
                      <div style={{fontSize:"11px",color:T.muted,marginTop:"1px"}}>{sections[sec.key]?`${sections[sec.key].length} chars`:"empty"}</div>
                    </div>
                    <span style={{width:"7px",height:"7px",borderRadius:"50%",background:sections[sec.key]?T.success:T.border,display:"inline-block"}}/>
                    <span style={{fontSize:"11px",color:T.muted}}>{activeSection===sec.key?"▲":"▼"}</span>
                  </div>
                  {activeSection===sec.key&&(
                    <div className="fi" style={{padding:"10px",background:T.card,border:`1.5px solid ${sec.color}33`,borderTop:"none",borderRadius:"0 0 9px 9px"}}>
                      <div style={{fontSize:"11px",color:T.muted,marginBottom:"4px"}}>{sec.desc}</div>
                      <textarea value={sections[sec.key]||""} onChange={e=>setSections(s=>({...s,[sec.key]:e.target.value}))}
                        placeholder={`Write your ${sec.label} section, or ask me to draft it…`} rows={6}
                        style={{width:"100%",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"7px",color:T.text,fontSize:"13px",padding:"9px 10px",resize:"vertical",outline:"none",lineHeight:1.65}}/>
                      <div style={{display:"flex",gap:"7px",marginTop:"7px",flexWrap:"wrap"}}>
                        <Btn sm v="outline" onClick={()=>send(`Draft my ${sec.label} section`)}>✦ AI Draft</Btn>
                        <Btn sm v="secondary" onClick={()=>send(`Refine my ${sec.label} section — make it punchier and more investor-ready`)}>✦ Refine</Btn>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{marginTop:"14px"}}>
                <div style={{fontSize:"11px",fontFamily:MONO,color:T.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"7px"}}>Import existing slides</div>
                <DropZone onText={handleUpload} sm/>
              </div>
            </div>
          )}
          {panel==="analysis"&&(
            <div style={{padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                <div style={{fontSize:"11px",fontFamily:MONO,color:T.muted,textTransform:"uppercase",letterSpacing:".08em"}}>Pitch Analysis</div>
                <Btn sm v="outline" onClick={()=>runAnalysis()} disabled={aiLoading}>{aiLoading?<Spin size={12}/>:"Re-analyze"}</Btn>
              </div>
              {analysis?(
                <div className="fu">
                  <Card style={{textAlign:"center",marginBottom:"11px",background:T.lemonSoft,border:`1.5px solid ${T.lemon}88`}}>
                    <div style={{fontSize:"10px",color:T.lemonDark,fontFamily:MONO,textTransform:"uppercase",letterSpacing:".1em",marginBottom:"4px"}}>Overall Score</div>
                    <div style={{fontFamily:SERIF,fontSize:"54px",fontWeight:800,color:GCOL(analysis.score),lineHeight:1}}>{analysis.score}</div>
                    <div style={{fontSize:"12px",color:T.muted}}>/100</div>
                  </Card>
                  <Card style={{marginBottom:"11px"}}>
                    <div style={{fontSize:"12px",fontWeight:600,marginBottom:"10px"}}>PITCH Breakdown</div>
                    {PITCH_SECTIONS.map(sec=>{
                      const item=analysis.breakdown?.[sec.key];if(!item)return null;
                      return(
                        <div key={sec.key} style={{marginBottom:"11px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                            <PB sec={sec} size={19}/><span style={{fontSize:"12px",fontWeight:600,flex:1}}>{sec.label}</span>
                            <span style={{fontSize:"11px",color:T.muted}}>{item.score}/100</span>
                          </div>
                          <Bar v={item.score}/>
                          <div style={{fontSize:"11px",color:T.muted,marginTop:"2px",lineHeight:1.4}}>{item.comment}</div>
                        </div>
                      );
                    })}
                  </Card>
                  <div style={{display:"grid",gap:"9px"}}>
                    <Card style={{background:T.successSoft}}>
                      <div style={{fontSize:"12px",fontWeight:700,color:T.success,marginBottom:"7px"}}>✓ Strengths</div>
                      {analysis.strengths?.map((s,i)=><div key={i} style={{fontSize:"12px",color:T.text,marginBottom:"5px",lineHeight:1.45}}>• {s}</div>)}
                    </Card>
                    <Card style={{background:T.warnSoft}}>
                      <div style={{fontSize:"12px",fontWeight:700,color:T.warn,marginBottom:"7px"}}>⚡ Improve</div>
                      {analysis.improvements?.map((s,i)=><div key={i} style={{fontSize:"12px",color:T.text,marginBottom:"5px",lineHeight:1.45}}>→ {s}</div>)}
                    </Card>
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:"44px 0",color:T.muted}}>
                  <div style={{fontSize:"32px",marginBottom:"9px"}}>📊</div>
                  <p style={{fontSize:"13px",marginBottom:"14px"}}>Build your pitch first, then analyze it</p>
                  <Btn v="grove" onClick={()=>runAnalysis()}>Analyze now</Btn>
                </div>
              )}
            </div>
          )}
          {panel==="practice"&&<PracticePanel sections={sections}/>}
          {panel==="export"&&(
            <div style={{padding:"14px"}}>
              <div style={{fontSize:"11px",fontFamily:MONO,color:T.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:"12px"}}>Export Pitch</div>
              {[
                {id:"pptx",icon:"📊",label:"PowerPoint (.pptx)",desc:"Full styled slide deck",action:async()=>{setExporting("pptx");try{await buildAndDownloadPPTX(profile,sections)}catch(e){alert("PPTX export failed: "+e.message)}finally{setExporting(null)}}},
                {id:"pdf", icon:"📄",label:"PDF (print dialog)",desc:"Opens print-to-PDF in new tab",action:()=>openPDF(profile,sections)},
                {id:"md",  icon:"📝",label:"Markdown (.md)",   desc:"Notion, GitHub, Obsidian",action:()=>exportText(profile,sections,"md")},
                {id:"txt", icon:"🗒",label:"Plain Text (.txt)", desc:"Universal format",          action:()=>exportText(profile,sections,"txt")},
              ].map(({id,icon,label,desc,action})=>(
                <Card key={id} style={{display:"flex",alignItems:"center",gap:"11px",marginBottom:"9px"}}>
                  <span style={{fontSize:"19px"}}>{icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:"13px"}}>{label}</div>
                    <div style={{fontSize:"11px",color:T.muted,marginTop:"1px"}}>{desc}</div>
                  </div>
                  <Btn sm v="secondary" onClick={action} disabled={exporting===id}>
                    {exporting===id?<Spin size={11}/>:"↓"}
                  </Btn>
                </Card>
              ))}
              <Card style={{marginTop:"14px"}}>
                <div style={{fontSize:"12px",fontWeight:600,marginBottom:"9px"}}>Completion</div>
                {PITCH_SECTIONS.map(sec=>(
                  <div key={sec.key} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"6px"}}>
                    <PB sec={sec} size={19}/><span style={{fontSize:"12px",flex:1}}>{sec.label}</span>
                    <span style={{fontSize:"11px",color:sections[sec.key]?T.success:T.muted}}>{sections[sec.key]?"✓":"—"}</span>
                  </div>
                ))}
                <div style={{marginTop:"9px",padding:"7px 10px",background:T.lemonSoft,borderRadius:"6px",fontSize:"12px",color:T.lemonDark,fontWeight:600}}>
                  {PITCH_SECTIONS.filter(s=>sections[s.key]).length} / {PITCH_SECTIONS.length} sections complete
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
// ── Msg Bubble ───────────────────────────────────────────────────────────────
function MsgBubble({msg,onAccept,profile,GCOL,onSectionEdit}){
  const[refineInstr,setRefineInstr]=useState("");
  const[refineLoading,setRefineLoading]=useState(false);
  const[localDraft,setLocalDraft]=useState(msg.draft||"");
  const[editing,setEditing]=useState(false);
  const[editVal,setEditVal]=useState(msg.draft||"");
  const sec=msg.sectionKey?PITCH_SECTIONS.find(s=>s.key===msg.sectionKey):null;
  const isUser=msg.role==="user";
 
  if(msg.type==="welcome"){
    return(
      <div className="fu" style={{padding:"14px 16px",background:T.lemonSoft,border:`1.5px solid ${T.lemon}88`,borderRadius:"13px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"7px"}}>
          <span style={{fontSize:"17px"}}>🍋</span>
          <span style={{fontFamily:SERIF,fontWeight:700,fontSize:"13px",color:T.lemonDark}}>Lemonade Coach</span>
        </div>
        <div style={{fontSize:"14px",lineHeight:1.65}} dangerouslySetInnerHTML={{__html:md(msg.text)}}/>
        <div style={{marginTop:"10px",display:"flex",flexWrap:"wrap",gap:"5px"}}>
          {PITCH_SECTIONS.map(s=><Chip key={s.key} label={`${s.icon} ${s.label}`} color={s.color} bg={s.soft}/>)}
        </div>
      </div>
    );
  }
 
  if(msg.type==="draft"){
    return(
      <div className="fu" style={{padding:"13px 15px",background:sec?.soft||T.surface,border:`1.5px solid ${(sec?.color||T.border)+"55"}`,borderRadius:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"9px"}}>
          {sec&&<PB sec={sec} size={21}/>}
          <span style={{fontSize:"12px",fontWeight:700,color:sec?.color}}>{sec?.label} Draft</span>
          <Chip label="AI Draft" color={T.muted} bg={T.surface}/>
        </div>
        {editing?(
          <>
            <textarea value={editVal} onChange={e=>setEditVal(e.target.value)} rows={6}
              style={{width:"100%",background:T.card,border:`1.5px solid ${T.border}`,borderRadius:"7px",color:T.text,fontSize:"13px",padding:"8px 10px",resize:"vertical",outline:"none",lineHeight:1.65}}/>
            <div style={{display:"flex",gap:"7px",marginTop:"7px"}}>
              <Btn sm v="grove" onClick={()=>{onAccept(msg.sectionKey,editVal);setEditing(false);}}>✓ Save edited</Btn>
              <Btn sm v="ghost" onClick={()=>setEditing(false)}>Cancel</Btn>
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:"13px",lineHeight:1.65,color:T.text,whiteSpace:"pre-wrap",marginBottom:"11px"}}>{localDraft}</div>
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:"8px"}}>
              <Btn sm v="grove" onClick={()=>onAccept(msg.sectionKey,localDraft)}>✓ Use this</Btn>
              <Btn sm v="secondary" onClick={()=>{setEditVal(localDraft);setEditing(true);}}>✏️ Edit</Btn>
            </div>
            <div style={{display:"flex",gap:"7px"}}>
              <input value={refineInstr} onChange={e=>setRefineInstr(e.target.value)}
                placeholder='Refine: "make shorter", "add a stat"…'
                style={{flex:1,background:T.card,border:`1.5px solid ${T.border}`,borderRadius:"6px",color:T.text,fontSize:"12px",padding:"5px 9px",outline:"none"}}/>
              <Btn sm v="lemon" disabled={refineLoading||!refineInstr.trim()} onClick={async()=>{
                setRefineLoading(true);
                const r=await ai_refine(msg.sectionKey,localDraft,refineInstr);
                setLocalDraft(r);setRefineInstr("");setRefineLoading(false);
              }}>{refineLoading?<Spin size={11}/>:"✦ Refine"}</Btn>
            </div>
          </>
        )}
      </div>
    );
  }
 
  if(msg.type==="analysis"){
    const a=msg.analysis;
    return(
      <div className="fu" style={{padding:"13px 15px",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"12px"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:"10px",marginBottom:"9px"}}>
          <span style={{fontFamily:SERIF,fontSize:"34px",fontWeight:800,color:GCOL(a.score),lineHeight:1}}>{a.score}</span>
          <div><div style={{fontSize:"11px",color:T.muted,fontFamily:MONO}}>PITCH SCORE</div><div style={{fontSize:"12px",color:T.text}}>out of 100</div></div>
        </div>
        {PITCH_SECTIONS.map(sec=>{
          const item=a.breakdown?.[sec.key];if(!item)return null;
          return(
            <div key={sec.key} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"5px"}}>
              <PB sec={sec} size={17}/><span style={{fontSize:"11px",flex:1,color:T.muted}}>{sec.label}</span>
              <span style={{fontSize:"11px",fontWeight:600,color:GCOL(item.score),minWidth:"30px",textAlign:"right"}}>{item.score}</span>
            </div>
          );
        })}
        <div style={{marginTop:"9px",fontSize:"12px",color:T.muted,lineHeight:1.4,borderTop:`1px solid ${T.border}`,paddingTop:"8px"}}>
          💡 {a.improvements?.[0]}
        </div>
      </div>
    );
  }
 
  return(
    <div className="fu" style={{
      padding:"9px 13px",borderRadius:"11px",maxWidth:"84%",
      alignSelf:isUser?"flex-end":"flex-start",
      background:isUser?T.lemon:T.card,
      border:isUser?`1.5px solid ${T.lemonDark}`:`1.5px solid ${T.border}`,
      fontSize:"14px",lineHeight:1.65,color:T.text,
    }}>
      {isUser
        ?<span>{msg.text}</span>
        :<span dangerouslySetInnerHTML={{__html:md(msg.text)}}/>
      }
    </div>
  );
}
 
// ── Practice panel ─────────────────────────────────────────────────────────
function PracticePanel({sections}){
  const[recording,setRecording]=useState(false);
  const[transcript,setTranscript]=useState("");
  const[feedback,setFeedback]=useState(null);
  const[loading,setLoading]=useState(false);
  const[timer,setTimer]=useState(0);
  const streamRef=useRef(null),timerRef=useRef(null),recogRef=useRef(null),vidRef=useRef(null);
  const fmt=s=>`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
 
  const start=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true}).catch(()=>navigator.mediaDevices.getUserMedia({audio:true}));
      streamRef.current=stream;
      if(vidRef.current){vidRef.current.srcObject=stream;vidRef.current.muted=true;}
      setRecording(true);setTimer(0);setTranscript("");setFeedback(null);
      timerRef.current=setInterval(()=>setTimer(t=>t+1),1000);
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(SR){const r=new SR();r.continuous=true;r.interimResults=true;r.onresult=e=>{let t="";for(let i=0;i<e.results.length;i++)if(e.results[i].isFinal)t+=e.results[i][0].transcript+" ";setTranscript(t);};r.start();recogRef.current=r;}
    }catch{alert("Microphone access required.");}
  };
  const stop=async()=>{
    clearInterval(timerRef.current);setRecording(false);
    streamRef.current?.getTracks().forEach(t=>t.stop());
    if(vidRef.current)vidRef.current.srcObject=null;
    recogRef.current?.stop();setLoading(true);
    try{const out=await ai_deliveryAnalysis(transcript,timer);setFeedback(out);}finally{setLoading(false);}
  };
 
  return(
    <div style={{padding:"14px"}}>
      <div style={{fontSize:"11px",fontFamily:MONO,color:T.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:"10px"}}>Practice Mode</div>
      <div style={{aspectRatio:"16/9",background:"#111",borderRadius:"9px",overflow:"hidden",position:"relative",marginBottom:"9px",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <video ref={vidRef} autoPlay playsInline style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        {!recording&&<div style={{position:"absolute",textAlign:"center",color:"#555"}}><div style={{fontSize:"26px"}}>🎙️</div><div style={{fontSize:"12px",marginTop:"5px"}}>Camera will appear here</div></div>}
        {recording&&(
          <div style={{position:"absolute",top:7,right:7,background:"rgba(0,0,0,.65)",borderRadius:"20px",padding:"3px 9px",display:"flex",gap:"5px",alignItems:"center"}}>
            <div style={{width:"5px",height:"5px",borderRadius:"50%",background:T.danger,animation:"pulse 1.2s ease-in-out infinite"}}/>
            <span style={{color:"#fff",fontSize:"11px",fontFamily:MONO}}>{fmt(timer)}</span>
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:"7px",marginBottom:"10px"}}>
        {!recording?<Btn v="grove" onClick={start} full>● Start Recording</Btn>:<Btn v="danger" onClick={stop} full>■ Stop & Analyze</Btn>}
      </div>
      {transcript&&<Card style={{marginBottom:"9px",padding:"10px"}}><div style={{fontSize:"11px",color:T.muted,fontFamily:MONO,marginBottom:"4px"}}>Transcript</div><div style={{fontSize:"12px",lineHeight:1.55,maxHeight:"70px",overflowY:"auto"}}>{transcript}</div></Card>}
      {loading&&<div style={{textAlign:"center",padding:"16px"}}><Spin/></div>}
      {feedback&&(
        <Card>
          <div style={{fontSize:"11px",color:T.grove,fontFamily:MONO,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"9px"}}>Delivery Analysis</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"10px"}}>
            {[["Score",feedback.overallScore+"/100",feedback.overallScore>=70?T.success:T.warn],["Pace",(feedback.pace||0)+" wpm",T.text],["Clarity",(feedback.clarity||0)+"%",T.text],["Confidence",(feedback.confidence||0)+"%",T.text]].map(([k,v,c])=>(
              <div key={k} style={{padding:"7px",background:T.surface,borderRadius:"6px"}}>
                <div style={{fontSize:"10px",color:T.muted,fontFamily:MONO,marginBottom:"2px"}}>{k}</div>
                <div style={{fontWeight:700,fontSize:"14px",color:c}}>{v}</div>
              </div>
            ))}
          </div>
          {feedback.fillerWords&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"9px"}}>
              {Object.entries(feedback.fillerWords).filter(([,v])=>v>0).map(([k,v])=>(
                <span key={k} style={{fontSize:"11px",padding:"2px 7px",borderRadius:"4px",background:T.warnSoft,color:T.warn,border:`1px solid ${T.warn}33`}}>"{k}" ×{v}</span>
              ))}
            </div>
          )}
          {feedback.suggestions?.map((s,i)=><div key={i} style={{fontSize:"12px",color:T.text,padding:"4px 0",borderTop:i===0?`1px solid ${T.border}`:"none",lineHeight:1.45}}>→ {s}</div>)}
        </Card>
      )}
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
//  REVIEWER STUDIO
// ══════════════════════════════════════════════════════════════════════════════
function ReviewerStudio({profile,sessionId,initData,onBack,onSave}){
  const[pitch,setPitch]=useState(initData?.pitch||"");
  const[evaluation,setEvaluation]=useState(initData?.evaluation||null);
  const[loading,setLoading]=useState(false);
  const[tab,setTab]=useState("review");
  const[comments,setComments]=useState(initData?.comments||[]);
  const[newCmt,setNewCmt]=useState("");
  const[chatHist,setChatHist]=useState(initData?.chatHist||[]);
  const[chatIn,setChatIn]=useState("");
  const[chatLoading,setChatLoading]=useState(false);
  const[compPitches,setCompPitches]=useState(initData?.compPitches||[]);
  const[weights,setWeights]=useState(Object.fromEntries(PITCH_SECTIONS.map(s=>[s.key,20])));
  const[exporting,setExporting]=useState(null);
  const chatRef=useRef(null);
 
  useEffect(()=>{onSave({pitch,evaluation,comments,chatHist,compPitches})},[pitch,evaluation,comments,chatHist,compPitches]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},[chatHist,chatLoading]);
 
  const evaluate=async()=>{if(!pitch.trim())return;setLoading(true);try{const out=await ai_scoreCompare(pitch);setEvaluation(out);}finally{setLoading(false);}};
  const chatSend=async()=>{
    if(!chatIn.trim())return;const msg=chatIn;setChatIn("");setChatLoading(true);
    setChatHist(h=>[...h,{role:"user",text:msg}]);
    try{const r=await ai_chat(msg,profile,{});setChatHist(h=>[...h,{role:"ai",text:r.text||r.intro||"Let me think about that…"}]);}
    finally{setChatLoading(false);}
  };
 
  const GCOL=s=>s>=70?T.success:s>=50?T.warn:T.danger;
  const GC={"A+":T.success,"A":T.success,"A-":T.success,"B+":T.blue,"B":T.blue,"B-":T.blue,"C+":T.warn,"C":T.warn,"D":T.danger,"F":T.danger};
  const TABS=[["review","🔍 Review"],["rubric","⚙️ Rubric"],["discuss","💬 Discuss"],["compare","⊕ Compare"],["export","⬇ Export"]];
 
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:T.surface,borderBottom:`1.5px solid ${T.border}`,padding:"8px 16px",display:"flex",alignItems:"center",gap:"11px",flexWrap:"wrap"}}>
        <span style={{fontSize:"16px"}}>🍋</span>
        <span style={{fontFamily:SERIF,fontWeight:700,fontSize:"14px"}}>lemonade</span>
        <div style={{width:"1px",height:"15px",background:T.border}}/>
        <Btn v="ghost" sm onClick={onBack}>← Back</Btn>
        <span style={{fontWeight:600,fontSize:"14px"}}>{profile.name}</span>
        <Chip label={profile.role} color={T.citrus}/><Chip label={profile.focus}/>
      </div>
      <div style={{background:T.surface,borderBottom:`1.5px solid ${T.border}`,display:"flex",overflowX:"auto"}}>
        {TABS.map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 16px",fontSize:"13px",fontFamily:FONT,fontWeight:600,background:"none",border:"none",cursor:"pointer",whiteSpace:"nowrap",color:tab===id?T.citrus:T.muted,borderBottom:tab===id?`2.5px solid ${T.citrus}`:"2.5px solid transparent"}}>{lbl}</button>
        ))}
      </div>
      <div style={{flex:1,overflow:"auto",padding:"22px"}}>
        {tab==="review"&&(
          <div style={{maxWidth:"980px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 350px",gap:"20px"}}>
            <div>
              <div style={{marginBottom:"10px"}}><DropZone onText={t=>{setPitch(t)}} label="Upload pitch deck to review" sm/></div>
              <textarea value={pitch} onChange={e=>setPitch(e.target.value)} placeholder="Or paste pitch content here…" rows={15}
                style={{width:"100%",background:T.card,border:`1.5px solid ${T.border}`,borderRadius:"9px",color:T.text,fontSize:"14px",padding:"12px 13px",resize:"vertical",outline:"none",lineHeight:1.65}}/>
              <div style={{display:"flex",gap:"9px",marginTop:"9px",flexWrap:"wrap"}}>
                <Btn v="citrus" onClick={evaluate} disabled={loading||!pitch.trim()}>
                  {loading?<><Spin size={13} color="#fff"/>Evaluating…</>:"✦ Evaluate Pitch"}
                </Btn>
                {evaluation&&<Btn v="secondary" onClick={()=>setEvaluation(null)}>Clear</Btn>}
              </div>
              <div style={{marginTop:"16px"}}>
                <div style={{fontSize:"11px",fontFamily:MONO,color:T.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"6px"}}>Annotations</div>
                <div style={{display:"flex",gap:"7px"}}>
                  <input value={newCmt} onChange={e=>setNewCmt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&newCmt.trim()&&(setComments(c=>[...c,{text:newCmt,time:new Date().toLocaleTimeString()}]),setNewCmt(""))} placeholder="Add a comment or flag…"
                    style={{flex:1,background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"7px",color:T.text,fontSize:"13px",padding:"6px 10px",outline:"none"}}/>
                  <Btn sm onClick={()=>{if(newCmt.trim()){setComments(c=>[...c,{text:newCmt,time:new Date().toLocaleTimeString()}]);setNewCmt("");}}}>+ Add</Btn>
                </div>
                {comments.map((c,i)=>(
                  <div key={i} style={{marginTop:"5px",padding:"5px 9px",background:T.surface,borderRadius:"5px",fontSize:"12px"}}>
                    <span style={{color:T.citrus,marginRight:"6px"}}>{profile.name}</span>
                    <span style={{color:T.muted,marginRight:"6px"}}>[{c.time}]</span>{c.text}
                  </div>
                ))}
              </div>
            </div>
            <div>
              {!evaluation&&!loading&&<Card style={{textAlign:"center",padding:"44px 18px"}}><div style={{fontSize:"30px",marginBottom:"9px"}}>🔍</div><p style={{color:T.muted,fontSize:"13px"}}>Paste a pitch and click Evaluate</p></Card>}
              {loading&&<div style={{textAlign:"center",padding:"44px"}}><Spin/></div>}
              {evaluation&&(
                <div className="fu" style={{display:"flex",flexDirection:"column",gap:"11px"}}>
                  <Card style={{background:T.citrusSoft,textAlign:"center",padding:"20px"}}>
                    <div style={{fontFamily:SERIF,fontWeight:800,fontSize:"54px",color:GC[evaluation.grade]||T.text,lineHeight:1,marginBottom:"4px"}}>{evaluation.grade}</div>
                    <div style={{fontSize:"13px",color:T.muted,marginBottom:"10px"}}>{evaluation.score}/100</div>
                    <div style={{padding:"8px",background:T.surface,borderRadius:"7px",fontSize:"13px",color:T.text,lineHeight:1.5}}>"{evaluation.verdict}"</div>
                  </Card>
                  <Card>
                    <div style={{fontSize:"12px",fontWeight:600,marginBottom:"9px"}}>PITCH Scores (estimated)</div>
                    {PITCH_SECTIONS.map(sec=>{
                      const score=Math.max(30,evaluation.score+Math.floor(Math.random()*16)-7);
                      return(
                        <div key={sec.key} style={{marginBottom:"9px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                            <PB sec={sec} size={18}/><span style={{fontSize:"11px",fontWeight:600,flex:1}}>{sec.label}</span>
                            <span style={{fontSize:"11px",color:T.muted}}>{score}/100</span>
                          </div>
                          <Bar v={score}/>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
        {tab==="rubric"&&(
          <div style={{maxWidth:"540px",margin:"0 auto"}}>
            <h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,marginBottom:"4px"}}>Customize Rubric</h2>
            <p style={{color:T.muted,fontSize:"13px",marginBottom:"18px"}}>Adjust weights to match your investment thesis</p>
            {PITCH_SECTIONS.map(sec=>(
              <Card key={sec.key} style={{marginBottom:"9px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"6px"}}>
                  <PB sec={sec} size={23}/><span style={{fontWeight:600,flex:1}}>{sec.label}</span>
                  <span style={{fontWeight:700,fontSize:"14px",color:T.citrus}}>{weights[sec.key]}%</span>
                </div>
                <input type="range" min="5" max="40" step="5" value={weights[sec.key]} onChange={e=>setWeights(w=>({...w,[sec.key]:+e.target.value}))} style={{width:"100%",accentColor:T.citrus}}/>
              </Card>
            ))}
            <div style={{padding:"9px",background:T.surface,borderRadius:"7px",display:"flex",justifyContent:"space-between"}}>
              <span style={{color:T.muted,fontSize:"13px"}}>Total</span>
              <span style={{fontWeight:700,color:Object.values(weights).reduce((a,b)=>a+b,0)===100?T.success:T.danger}}>{Object.values(weights).reduce((a,b)=>a+b,0)}%</span>
            </div>
          </div>
        )}
        {tab==="discuss"&&(
          <div style={{maxWidth:"620px",margin:"0 auto",display:"flex",flexDirection:"column",height:"calc(100vh - 190px)"}}>
            <div style={{marginBottom:"11px"}}>
              <h2 style={{fontFamily:SERIF,fontSize:"19px",fontWeight:700}}>Discuss the Pitch</h2>
              <p style={{fontSize:"12px",color:T.muted}}>Explore your evaluation deeper with AI</p>
            </div>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"9px",paddingBottom:"11px"}}>
              {chatHist.length===0&&(
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {["What are the biggest risks here?","Would you fund this? Why?","What's missing from this pitch?","How does this compare to what you normally see?"].map(q=>(
                    <div key={q} onClick={()=>setChatIn(q)} style={{padding:"8px 12px",borderRadius:"8px",border:`1.5px solid ${T.border}`,cursor:"pointer",fontSize:"13px",background:T.surface}}>💬 {q}</div>
                  ))}
                </div>
              )}
              {chatHist.map((m,i)=>(
                <div key={i} style={{padding:"9px 13px",borderRadius:"10px",maxWidth:"84%",fontSize:"14px",lineHeight:1.6,alignSelf:m.role==="user"?"flex-end":"flex-start",background:m.role==="user"?T.citrus+"EE":T.card,color:m.role==="user"?"#fff":T.text,border:m.role==="ai"?`1.5px solid ${T.border}`:"none"}}>{m.text}</div>
              ))}
              {chatLoading&&<div style={{padding:"9px"}}><Spin/></div>}
            </div>
            <div style={{display:"flex",gap:"9px"}}>
              <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&chatSend()} placeholder="Ask about this pitch…"
                style={{flex:1,background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"8px",color:T.text,fontSize:"14px",padding:"8px 12px",outline:"none"}}/>
              <Btn v="citrus" onClick={chatSend} disabled={chatLoading||!chatIn.trim()}>Send</Btn>
            </div>
          </div>
        )}
        {tab==="compare"&&(
          <div style={{maxWidth:"920px",margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"9px"}}>
              <div><h2 style={{fontFamily:SERIF,fontSize:"19px",fontWeight:700}}>Compare Pitches</h2><p style={{color:T.muted,fontSize:"12px"}}>Score multiple pitches side by side</p></div>
              <Btn v="secondary" onClick={()=>setCompPitches(p=>[...p,{id:mkId(),title:`Pitch ${p.length+1}`,content:"",score:null}])}>+ Add Pitch</Btn>
            </div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.max(1,Math.min(3,compPitches.length))},1fr)`,gap:"13px"}}>
              {compPitches.map((p,i)=>(
                <Card key={p.id}>
                  <input value={p.title} onChange={e=>setCompPitches(arr=>arr.map((x,j)=>j===i?{...x,title:e.target.value}:x))}
                    style={{background:"transparent",border:"none",color:T.text,fontFamily:SERIF,fontWeight:700,fontSize:"14px",outline:"none",width:"100%",marginBottom:"9px"}}/>
                  <div style={{marginBottom:"7px"}}><DropZone onText={c=>setCompPitches(arr=>arr.map((x,j)=>j===i?{...x,content:c}:x))} sm/></div>
                  <textarea value={p.content} onChange={e=>setCompPitches(arr=>arr.map((x,j)=>j===i?{...x,content:e.target.value}:x))} placeholder="Or paste pitch…" rows={4}
                    style={{width:"100%",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:"6px",color:T.text,fontSize:"12px",padding:"7px 9px",resize:"vertical",outline:"none"}}/>
                  <div style={{display:"flex",gap:"6px",marginTop:"7px"}}>
                    <Btn sm v="outlineC" onClick={async()=>{if(!p.content.trim())return;const s=await ai_scoreCompare(p.content);setCompPitches(arr=>arr.map((x,j)=>j===i?{...x,score:s}:x));}}>Score</Btn>
                    <Btn sm v="danger" onClick={()=>setCompPitches(arr=>arr.filter((_,j)=>j!==i))}>Remove</Btn>
                  </div>
                  {p.score&&(
                    <div style={{marginTop:"9px",padding:"9px",background:T.surface,borderRadius:"7px"}}>
                      <div style={{fontFamily:SERIF,fontWeight:800,fontSize:"26px",color:GC[p.score.grade]||T.text}}>{p.score.grade}</div>
                      <div style={{fontSize:"12px",color:T.muted}}>{p.score.score}/100</div>
                      <div style={{fontSize:"12px",color:T.text,marginTop:"3px",lineHeight:1.4}}>{p.score.verdict}</div>
                    </div>
                  )}
                </Card>
              ))}
              {compPitches.length===0&&<div style={{textAlign:"center",padding:"44px",color:T.muted,gridColumn:"1/-1"}}><div style={{fontSize:"26px",marginBottom:"7px"}}>⊕</div><p style={{fontSize:"13px"}}>Add pitches to compare side by side</p></div>}
            </div>
          </div>
        )}
        {tab==="export"&&(
          <div style={{maxWidth:"520px",margin:"0 auto"}}>
            <h2 style={{fontFamily:SERIF,fontSize:"20px",fontWeight:700,marginBottom:"4px"}}>Export Review</h2>
            <p style={{color:T.muted,fontSize:"12px",marginBottom:"18px"}}>Export your evaluation as a report</p>
            {[
              {id:"pptx",icon:"📊",label:"PowerPoint Report (.pptx)",desc:"Styled review presentation",action:async()=>{setExporting("pptx");try{await buildAndDownloadPPTX({company:"Pitch Review — "+profile.name,name:profile.name,industry:profile.focus,stage:profile.role,ask:""},{premise:pitch.slice(0,300)||"",idea:"",tell:"",clarify:"",help:""})}catch(e){alert("Export failed: "+e.message)}finally{setExporting(null)}}},
              {id:"pdf",icon:"📄",label:"PDF Report",desc:"Print-ready review PDF",action:()=>openPDF({company:"Pitch Review",name:profile.name,industry:profile.focus,stage:profile.role,ask:""},{premise:pitch.slice(0,300)||"",idea:"",tell:"",clarify:"",help:""})},
              {id:"txt",icon:"🗒",label:"Text Summary (.txt)",desc:"Plain text evaluation",action:()=>{const b=new Blob([`PITCH REVIEW\nReviewer: ${profile.name} (${profile.role})\nFocus: ${profile.focus}\n\n${"═".repeat(40)}\n\nPITCH CONTENT:\n${pitch}\n\n${"═".repeat(40)}\n\nEVALUATION:\n${evaluation?`Grade: ${evaluation.grade}\nScore: ${evaluation.score}/100\nVerdict: ${evaluation.verdict}`:"Not evaluated"}\n\nANNOTATIONS:\n${comments.map(c=>`[${c.time}] ${c.text}`).join("\n")||"None"}`],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="pitch_review.txt";a.click();}},
            ].map(({id,icon,label,desc,action})=>(
              <Card key={id} style={{marginBottom:"9px",display:"flex",alignItems:"center",gap:"11px"}}>
                <span style={{fontSize:"19px"}}>{icon}</span>
                <div style={{flex:1}}><div style={{fontWeight:600,fontSize:"13px"}}>{label}</div><div style={{fontSize:"11px",color:T.muted,marginTop:"1px"}}>{desc}</div></div>
                <Btn sm v="secondary" onClick={action} disabled={exporting===id}>{exporting===id?<Spin size={11}/>:"↓"}</Btn>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const[sessions,setSessions]=useState(lsLoad);
  const[page,setPage]=useState("landing");
  const[role,setRole]=useState(null);
  const[profile,setProfile]=useState(null);
  const[sessionId,setSessionId]=useState(null);
  const[initData,setInitData]=useState(null);
 
  const startNew=(r)=>{setRole(r);setProfile(null);setSessionId(mkId());setInitData(null);setPage("onboarding");};
  const resume=(sess)=>{setRole(sess.role);setProfile(sess.profile);setSessionId(sess.id);setInitData(sess.data||null);setPage("studio");};
  const finishOnboard=(ans)=>{setProfile(ans);const id=sessionId||mkId();setSessionId(id);setSessions(s=>lsUpsert(s,{id,role,profile:ans,data:null}));setPage("studio");};
  const save=(data)=>{if(!sessionId||!profile)return;setSessions(s=>lsUpsert(s,{id:sessionId,role,profile,data}));};
  const goBack=()=>{setPage("landing");setRole(null);setProfile(null);setSessionId(null);setInitData(null);};
 
  return(
    <>
      <GS/>
      {page==="landing"&&<Landing onSelect={startNew} sessions={sessions} onResume={resume} onDelete={id=>setSessions(s=>lsDel(s,id))}/>}
      {page==="onboarding"&&<Onboarding role={role} onComplete={finishOnboard} initAns={profile||{}}/>}
      {page==="studio"&&role==="creator"&&<CreatorStudio profile={profile} sessionId={sessionId} initData={initData} onBack={goBack} onSave={save}/>}
      {page==="studio"&&role==="reviewer"&&<ReviewerStudio profile={profile} sessionId={sessionId} initData={initData} onBack={goBack} onSave={save}/>}
    </>
  );
}