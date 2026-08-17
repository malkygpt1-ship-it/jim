(()=>{
  const basePromise=window.GF_DATA_PROMISE;
  if(!basePromise)return;

  function mergeTools(base,saved){
    if(!Array.isArray(saved)||!saved.length)return structuredClone(base);
    const used=new Set();
    const merged=base.map(b=>{
      const i=saved.findIndex((s,idx)=>!used.has(idx)&&((b.id&&s.id===b.id)||s.name===b.name));
      if(i<0)return b;
      used.add(i);
      return {...b,...saved[i],id:b.id||saved[i].id,sourceRow:b.sourceRow??saved[i].sourceRow};
    });
    saved.forEach((s,i)=>{if(!used.has(i))merged.push(s)});
    return merged;
  }

  window.GF_DATA_PROMISE=basePromise.then(data=>{
    const base=data.tools||[];
    const version=data.catalogVersion||'legacy';
    let tools=structuredClone(base);
    try{
      const saved=JSON.parse(localStorage.getItem('gf-tools')||'null');
      const savedVersion=localStorage.getItem('gf-tools-version');
      tools=Array.isArray(saved)&&savedVersion===version?saved:mergeTools(base,saved);
      localStorage.setItem('gf-tools',JSON.stringify(tools));
      localStorage.setItem('gf-tools-version',version);
    }catch{}
    return {...data,tools};
  });
})();
