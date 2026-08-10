
const CONFIG = window.MARVEL_CONFIG || {};
const hasSupabase = CONFIG.url && CONFIG.anonKey && !CONFIG.url.includes("YOUR_");

let sb = null;
if (hasSupabase && window.supabase) sb = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);

const state = {
  entries: [],
  needsImport: false,
  admin: false,
  user: null,
  filters: {q:"", era:"all", universe:"all", sort:"timeline"}
};

const $ = s => document.querySelector(s);
const posterSrc = p => {
  const v = String(p ?? "");
  if (window.MARVEL_POSTERS && window.MARVEL_POSTERS[v]) return window.MARVEL_POSTERS[v];
  return v;
};

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function cleanEntry(e, i=0){
  return {
    id: e.id || `entry-${Date.now()}-${i}`,
    title: e.title || "Untitled",
    release_year: e.release_year ?? null,
    setting: e.setting || "",
    universe: e.universe || "",
    description: Array.isArray(e.description) ? e.description : [],
    poster: e.poster || "",
    era: e.era || "Timeline",
    sort_order: e.sort_order ?? i,
    rating: e.rating ?? null,
    notes: e.notes || ""
  };
}

function localLoad(){
  const saved = localStorage.getItem("marvelTimelineEntries");
  return saved ? JSON.parse(saved).map(cleanEntry) : (window.MARVEL_SEED_DATA || []).map(cleanEntry);
}
function localSave(){ localStorage.setItem("marvelTimelineEntries", JSON.stringify(state.entries)); }

async function init(){
  if(sb){
    const {data:{session}} = await sb.auth.getSession();
    await handleSession(session);
    sb.auth.onAuthStateChange(async (_event, session) => {
      await handleSession(session);
    });
    const {data, error} = await sb.from("timeline_entries").select("*").order("sort_order",{ascending:true});
    if(!error && data && data.length) state.entries=data.map(cleanEntry);
    else {
      state.entries=(window.MARVEL_SEED_DATA || []).map(cleanEntry);
      state.needsImport=!!state.admin;
    }
  } else {
    state.entries=localLoad();
    showToast("Demo mode: edits stay in this browser until Supabase is connected.");
  }
  populateUniverses();
  bind();
  render();
}
async function handleSession(session){
  state.user=session?.user || null;
  const email=(session?.user?.email || "").toLowerCase();
  state.admin=!!CONFIG.adminEmail && email===CONFIG.adminEmail.toLowerCase();
  document.body.classList.toggle("admin",state.admin);
  const btn=$("#loginBtn");
  if(btn) btn.textContent=state.admin ? "Admin • Logout" : "Admin Login";
}
function bind(){
  $("#search").addEventListener("input",e=>{state.filters.q=e.target.value.toLowerCase();render()});
  $("#eraFilter").addEventListener("change",e=>{state.filters.era=e.target.value;render()});
  $("#universeFilter").addEventListener("change",e=>{state.filters.universe=e.target.value;render()});
  $("#sortFilter").addEventListener("change",e=>{state.filters.sort=e.target.value;render()});
  $("#resetFilters").onclick=()=>{state.filters={q:"",era:"all",universe:"all",sort:"timeline"};$("#search").value="";$("#eraFilter").value="all";$("#universeFilter").value="all";$("#sortFilter").value="timeline";render()};
  $("#loginBtn").onclick=()=> state.admin ? logout() : openLogin();
}
function populateUniverses(){
  const select=$("#universeFilter");
  const values=[...new Set(state.entries.map(e=>e.universe).filter(Boolean))].sort();
  select.innerHTML='<option value="all">All universes</option>'+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
}
function filtered(){
  let arr=[...state.entries];
  const {q,era,universe,sort}=state.filters;
  if(q) arr=arr.filter(e=>([e.title,e.setting,e.universe,e.era,e.notes,...e.description].join(" ").toLowerCase()).includes(q));
  if(era!=="all") arr=arr.filter(e=>e.era===era);
  if(universe!=="all") arr=arr.filter(e=>e.universe===universe);
  if(sort==="release") arr.sort((a,b)=>(a.release_year??9999)-(b.release_year??9999)||a.sort_order-b.sort_order);
  else if(sort==="title") arr.sort((a,b)=>a.title.localeCompare(b.title));
  else if(sort==="rating") arr.sort((a,b)=>(b.rating??-1)-(a.rating??-1));
  else arr.sort((a,b)=>(a.sort_order??9999)-(b.sort_order??9999));
  return arr;
}
function render(){
  const arr=filtered();
  $("#empty").classList.toggle("hidden",arr.length!==0);
  $("#timeline").innerHTML="";
  let lastEra=null;
  arr.forEach((e,idx)=>{
    if(e.era!==lastEra){
      const era=document.createElement("div");era.className="era";era.innerHTML=`<span>${esc(e.era)}</span>`;
      $("#timeline").appendChild(era);lastEra=e.era;
    }
    const card=document.createElement("article");card.className="card";
    const bullets=e.description.map(x=>`<li>${esc(x)}</li>`).join("");
    const rating=e.rating!=null && e.rating!=="" ? `<span class="rating">★ ${esc(e.rating)}/10</span>` : "";
    card.innerHTML=`
      ${e.poster?`<img class="poster" src="${esc(posterSrc(e.poster))}" alt="${esc(e.title)} poster" loading="lazy">`:`<div class="poster"></div>`}
      <div class="card-body">
        <div class="card-top">
          <div>
            <h3>${esc(e.title)}</h3>
            <div class="meta">
              ${e.release_year?`<span class="pill">Released ${esc(e.release_year)}</span>`:""}
              ${e.universe?`<span class="pill universe">${esc(e.universe)}</span>`:""}
            </div>
          </div>
          ${rating}
        </div>
        <div class="setting">${esc(e.setting)}</div>
        ${bullets?`<ul>${bullets}</ul>`:""}
        ${e.notes?`<p class="login-note" style="margin-top:12px">${esc(e.notes)}</p>`:""}
        ${state.admin?`<div style="margin-top:16px"><button class="ghost-btn edit-btn" data-id="${esc(e.id)}">Edit entry</button></div>`:""}
      </div>`;
    $("#timeline").appendChild(card);
  });
  if(state.admin) document.querySelectorAll(".edit-btn").forEach(b=>b.onclick=()=>openEditor(b.dataset.id));
  $("#stats").innerHTML=`
    ${state.admin && state.needsImport ? `<div class="stat" style="grid-column:1/-1"><button class="primary-btn" id="importBtn">Import ${state.entries.length} entries to online database</button><span style="display:block;margin-top:8px">One-time setup: this makes your edits visible to everyone.</span></div>` : ""}
    <div class="stat"><strong>${state.entries.length}</strong><span>timeline entries</span></div>
    <div class="stat"><strong>${new Set(state.entries.map(e=>e.universe)).size}</strong><span>universe labels</span></div>
    <div class="stat"><strong>${state.entries.filter(e=>e.release_year>=2020).length}</strong><span>released in the 2020s</span></div>
    <div class="stat"><strong>${arr.length}</strong><span>currently shown</span></div>`;
  if(state.admin && state.needsImport) $("#importBtn").onclick=importSeed;
}

function modal(inner){
  const root=$("#modalRoot");
  root.innerHTML=`<div class="modal-backdrop" id="backdrop"><div class="modal">${inner}</div></div>`;
  $("#backdrop").addEventListener("click",e=>{if(e.target.id==="backdrop") root.innerHTML=""});
}
function openLogin(){
  modal(`<h2>Admin access</h2>
    <p class="login-note">Only the configured admin account can edit the public timeline.</p>
    <div class="field"><label>Email</label><input id="authEmail" type="email" autocomplete="email"></div>
    <div class="field" style="margin-top:10px"><label>Password</label><input id="authPassword" type="password" autocomplete="current-password"></div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><div class="right-actions"><button class="ghost-btn" id="signupBtn">Create account</button><button class="primary-btn" id="signinBtn">Sign in</button></div></div>`);
  $("#signinBtn").onclick=()=>auth(false);$("#signupBtn").onclick=()=>auth(true);
}
async function auth(signup){
  if(!sb){showToast("Connect Supabase first to enable online admin login.");return}
  const email=$("#authEmail").value.trim(), password=$("#authPassword").value;
  if(!email||!password){showToast("Enter an email and password.");return}
  const res=signup ? await sb.auth.signUp({email,password}) : await sb.auth.signInWithPassword({email,password});
  if(res.error){showToast(res.error.message);return}
  closeModal();
  if(signup) showToast("Account created. Check your email if confirmation is enabled.");
}
async function logout(){ if(sb) await sb.auth.signOut(); state.admin=false; state.user=null; render(); showToast("Logged out.");}
function closeModal(){ $("#modalRoot").innerHTML=""; }

async function importSeed(){
  if(!sb || !state.admin) return;
  const seed=(window.MARVEL_SEED_DATA || []).map((e,i)=>cleanEntry({...e,sort_order:i}));
  const rows=seed.map(e=>({...e,owner_id:state.user.id}));
  const {error}=await sb.from("timeline_entries").upsert(rows,{onConflict:"id"});
  if(error){showToast(error.message);return}
  state.entries=seed; state.needsImport=false; render(); showToast("Timeline imported.");
}
function openEditor(id){
  if(!state.admin) return;
  const e=state.entries.find(x=>x.id===id); if(!e)return;
  modal(`<h2>Edit timeline entry</h2>
    <div class="form-grid">
      <div class="field full"><label>Title</label><input id="fTitle" value="${esc(e.title)}"></div>
      <div class="field"><label>Release year</label><input id="fRelease" type="number" value="${esc(e.release_year??"")}"></div>
      <div class="field"><label>Era</label><select id="fEra">${["Pre 2000s","2000s","2010s","2020s"].map(x=>`<option ${x===e.era?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field full"><label>Setting / placement</label><input id="fSetting" value="${esc(e.setting)}"></div>
      <div class="field full"><label>Universe</label><input id="fUniverse" value="${esc(e.universe)}"></div>
      <div class="field full"><label>Description bullets — one per line</label><textarea id="fDesc">${esc(e.description.join("\n"))}</textarea></div>
      <div class="field"><label>My rating / 10 (optional)</label><input id="fRating" type="number" min="0" max="10" step="0.1" value="${esc(e.rating??"")}"></div>
      <div class="field"><label>Poster path / URL</label><input id="fPoster" value="${esc(e.poster)}"><small class="login-note">Built-in posters use the existing <code>assets/…webp</code> path. You can also paste a public image URL.</small></div>
      <div class="field full"><label>Private/admin notes</label><textarea id="fNotes">${esc(e.notes)}</textarea></div>
    </div>
    <div class="modal-actions">
      <button class="danger-btn" id="deleteBtn">Delete</button>
      <div class="right-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" id="saveBtn">Save changes</button></div>
    </div>`);
  $("#saveBtn").onclick=()=>saveEntry(e.id);
  $("#deleteBtn").onclick=()=>deleteEntry(e.id);
}
async function saveEntry(id){
  const e=state.entries.find(x=>x.id===id);
  const updated=cleanEntry({...e,
    title:$("#fTitle").value.trim(), release_year:$("#fRelease").value?Number($("#fRelease").value):null,
    era:$("#fEra").value, setting:$("#fSetting").value.trim(), universe:$("#fUniverse").value.trim(),
    description:$("#fDesc").value.split("\n").map(x=>x.trim()).filter(Boolean),
    rating:$("#fRating").value?Number($("#fRating").value):null, poster:$("#fPoster").value.trim(), notes:$("#fNotes").value.trim()
  });
  const idx=state.entries.findIndex(x=>x.id===id);state.entries[idx]=updated;
  if(sb) { const {error}=await sb.from("timeline_entries").update(updated).eq("id",id); if(error){showToast(error.message);return} }
  else localSave();
  closeModal();populateUniverses();render();showToast("Saved.");
}
async function deleteEntry(id){
  if(!confirm("Delete this entry?"))return;
  if(sb){const {error}=await sb.from("timeline_entries").delete().eq("id",id);if(error){showToast(error.message);return}}
  state.entries=state.entries.filter(e=>e.id!==id); if(!sb)localSave();
  closeModal();populateUniverses();render();showToast("Deleted.");
}

window.closeModal=closeModal;

init();
