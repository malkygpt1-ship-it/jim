(()=>{
  const basePromise=window.GF_DATA_PROMISE;
  if(!basePromise)return;

  function costOnly(tool){
    const {sell,...rest}=tool||{};
    return rest;
  }

  function mergeTools(base,saved){
    if(!Array.isArray(saved)||!saved.length)return base.map(costOnly);
    const used=new Set();
    const merged=base.map(raw=>{
      const b=costOnly(raw);
      const i=saved.findIndex((s,idx)=>!used.has(idx)&&((b.id&&s.id===b.id)||s.name===b.name));
      if(i<0)return b;
      used.add(i);
      return costOnly({...b,...saved[i],id:b.id||saved[i].id,sourceRow:b.sourceRow??saved[i].sourceRow});
    });
    saved.forEach((s,i)=>{if(!used.has(i))merged.push(costOnly(s))});
    return merged;
  }

  window.GF_DATA_PROMISE=basePromise.then(data=>{
    const base=(data.tools||[]).map(costOnly);
    const version=data.catalogVersion||'legacy';
    let tools=structuredClone(base);
    try{
      const saved=JSON.parse(localStorage.getItem('gf-tools')||'null');
      const savedVersion=localStorage.getItem('gf-tools-version');
      tools=Array.isArray(saved)&&savedVersion===version?saved.map(costOnly):mergeTools(base,saved);
      localStorage.setItem('gf-tools',JSON.stringify(tools));
      localStorage.setItem('gf-tools-version',version);
    }catch{}
    return {...data,tools};
  });
})();
