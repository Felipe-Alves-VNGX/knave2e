/* Render the real HBS templates with representative data for visual inspection.
 * This is NOT a Foundry runtime: roll handlers, persistence and permissions must
 * additionally be smoke-tested in a licensed Foundry world. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const H = require('handlebars');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const lang = JSON.parse(fs.readFileSync('lang/en.json'));
const esc = H.escapeExpression;
H.registerHelper('localize', key => lang[key] || key);
H.registerHelper('eq', (a,b) => a === b);
H.registerHelper('ne', (a,b) => a !== b);
H.registerHelper('and', (...args) => args.slice(0,-1).every(Boolean));
H.registerHelper('or', (...args) => args.slice(0,-1).some(Boolean));
H.registerHelper('not', a => !a);
H.registerHelper('checked', a => a ? 'checked' : '');
H.registerHelper('selectOptions', (options, {hash}) => new H.SafeString(Object.entries(options || {}).map(([k,v])=>`<option value="${esc(k)}" ${hash.selected===k?'selected':''}>${esc(lang[v]||v)}</option>`).join('')));
H.registerHelper('editor', (content,{hash}) => new H.SafeString(`<div class="editor"><div class="editor-content" data-edit="${esc(hash.target)}">${content||''}</div></div>`));
H.registerHelper('rangePicker', ({hash}) => new H.SafeString(`<input type="range" name="${esc(hash.name)}" value="${hash.value||0}" min="${hash.min||0}" max="${hash.max||10}">`));
const partial='templates/actor/parts/actor-character-items.hbs';
H.registerPartial('systems/knave2e/'+partial, fs.readFileSync(partial,'utf8'));
const types=JSON.parse(fs.readFileSync('template.json'));
const baseSystem = {
 careers:'Cartographer, grave digger', companions:{value:1,max:2},movement:40, coins:235,
 abilities:Object.fromEntries(['strength','dexterity','constitution','intelligence','wisdom','charisma'].map((key,i)=>[key,{value:[2,1,3,2,1,0][i],label:'ABILITIES.'+key[0].toUpperCase()+key.slice(1),detail:'ABILITIES.'+key[0].toUpperCase()+key.slice(1)+'Description'}])),
 armorClass:14,armorPoints:3,hitPoints:{value:7,max:12,progress:58},wounds:{value:1,max:13,progress:8},level:3,xp:{value:2450,progress:45},
 slots:{value:8,max:13},spells:{value:1,max:2},blessings:{value:0,max:0},ammo:{arrow:12,bullet:0},
 morale:7,numberAppearing:{combined:'1d4'},category:'oneHanded',ammoType:'none',range:0,
 relic:{isRelic:false,isActive:false},quantity:1,cost:50,damageRoll:'1d6',attackBonus:0,breakable:true,brokenQuantity:0,attackAmount:1,
 roomStyle:'humble',squares:6,baseCost:6000,staffed:true,annualStaffingCost:3000,monthlyRentalIncome:60,isBusiness:true,
 costPerMonth:600,crew:4,speed:24,passengers:8,capacity:40,
 description:'A record of the northern road.',enrichedHTML:'<p>The northern road ends at the ruined watchtower. The old ferry still crosses at dawn.</p><p>Owes the apothecary a favour. Carries a map with one valley deliberately left blank.</p>',
 settings:Object.fromEntries(['automaticArmor','automaticWounds','automaticLevel','automaticSlots','automaticSpells','automaticBlessings','automaticRecruits'].map(k=>[k,true]))
};
const itemTypes=['weapon','armor','spellbook','potion','equipment','lightSource'];
const items=itemTypes.map((type,i)=>({_id:'sample'+i,type,name:['Notched longsword','Battered mail shirt','Book of the winter gate','Bitter restorative','Rope, hemp, 50 feet','Storm lantern'][i],img:'assets/knave-2e-logo.webp',system:{...baseSystem,slots:1,progress:0,equipped:true,quantity:1,dropped:false}}));
const core=`*{box-sizing:border-box}body{margin:0;padding:30px;background:#252723;font:14px Georgia} .window-app{width:900px;margin:20px auto;display:flex;flex-direction:column}.window-header{display:flex;align-items:center;height:32px;padding:0 12px;font:12px Arial}.window-content{flex:1}.flexrow{display:flex;flex-direction:row;flex-wrap:wrap;align-items:center}.flexrow>*{flex:1;min-width:0}.flexcol{display:flex;flex-direction:column}.flexcol>*{flex:1}.flex1{flex:1}.flex3{flex:3}input,select,button{width:100%;font:inherit}input[type=checkbox]{width:20px;flex:0 0 20px}input[type=range]{width:100%}a{cursor:pointer}img{max-width:100%;border:1px solid} .tab{display:none}.tab.active{display:block}button{margin:0}h1{margin:0} .preview-nav{position:sticky;top:0;z-index:10;padding:12px;background:#191d19;color:#eee;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font:13px Arial}.preview-nav a{color:#eee;padding:6px 9px;border:1px solid #666;text-decoration:none}.preview-note{color:#ddd;text-align:center;font:13px Arial}.window-app[hidden]{display:none} .fas,.fa-solid{font-style:normal}.fa-edit:before{content:'✎'}.fa-trash:before{content:'×'}.fa-plus:before{content:'+'} .fa-weight-hanging:before{content:'↓'}.fa-book:before{content:'▤'}.fa-sun:before{content:'☼'}`;
const sheets=[];
let checked=0;
for(const [kind, definition] of Object.entries(types)){
 const folder=kind.toLowerCase();
 for(const type of definition.types){
  const file=`templates/${folder}/${folder}-${type}-sheet.hbs`;
  const source=fs.readFileSync(file,'utf8');
  const render=H.compile(source);
  const name={character:'Merrin Ashford',monster:'The Barrow Hound',recruit:'Old Tom, lantern bearer',building:'The Crooked Lantern',vehicle:'The Grey Heron',weapon:'Notched longsword',spellbook:'Book of the winter gate',potion:'Bitter restorative'}[type]||type;
  const ctx={appId:'preview-'+type,actor:{name,type,img:'assets/knave-2e-logo.webp'},item:{name,type,img:'assets/knave-2e-logo.webp'},system:structuredClone(baseSystem),items,editable:true,owner:true,cssClass:'',weaponCategories:{oneHanded:'One handed'},ammoCategories:{none:'None'},roomStyles:{humble:'Humble'},recruitCategories:{hireling:'Hireling'},rarityCategories:{common:'Common'},armorCategories:{mail:'Mail'},spellbookCategories:{arcane:'Arcane'},lightSourceCategories:{torch:'Torch'},damageDiceCategories:{d6:'d6'}};
  if(folder==='item')ctx.system.slots=1;
  if(type==='monster')ctx.items=[{...items[0],type:'monsterAttack',name:'Blackened teeth'}];
  // Verify all form bindings and action hooks survived, both automatic/manual branches.
  const baseline=execFileSync('git',['show',`c4c240e1b2d5188b7f8c41e69a88cf30b7d8994c:${file}`],{encoding:'utf8'});
  for(const auto of [true,false]){
   Object.keys(ctx.system.settings).forEach(k=>ctx.system.settings[k]=auto);
   const before=H.compile(baseline)(ctx),after=render(ctx);
   for(const pattern of [/\bname="([^"]+)"/g,/\bdata-(?:action|roll|tab|edit|item-id)="([^"]+)"/g]){
    const values=s=>[...s.matchAll(pattern)].map(m=>m[0]).sort();
    assert.deepEqual(values(after),values(before),`${type}: form bindings changed`);
   }
   checked++;
  }
  Object.keys(ctx.system.settings).forEach(k=>ctx.system.settings[k]=true);
  let html=render(ctx).replaceAll('systems/knave2e/','../').replaceAll('src="assets/','src="../assets/');
  html=html.replace('class="item tab-color resource-label" data-tab="character"', 'class="item tab-color resource-label active" data-tab="character"').replace('class="tab character"','class="tab character active"').replace('data-tab="character">','data-tab="character" aria-current="page">');
  sheets.push(`<section id="preview-${type}" class="app window-app knave2e sheet ${folder} document-sheet" ${type==='character'?'':'hidden'}><header class="window-header">${esc(name)} · ${type}</header><div class="window-content">${html}</div></section>`);
 }
}
const css=fs.readFileSync('css/knave2e.css','utf8').replace(/@import url\([^;]+;/g,'').replace(/\/\*# sourceMappingURL=[\s\S]*?\*\//g,'');
const nav=Object.values(types).flatMap(x=>x.types).map(t=>`<a href="#${t}" data-preview="${t}">${t}</a>`).join('');
const motion = fs.readFileSync('module/sheets/document-motion.mjs','utf8').replace('export function', 'function');
const script=`${motion};document.querySelectorAll('.document-character').forEach(installDocumentMotion);document.querySelectorAll('[data-preview]').forEach(a=>a.onclick=()=>{document.querySelectorAll('.window-app').forEach(w=>w.hidden=w.id!=='preview-'+a.dataset.preview)});document.querySelectorAll('.sheet-tabs a').forEach(a=>a.onclick=()=>{const f=a.closest('form');f.querySelectorAll('.sheet-tabs a').forEach(t=>t.classList.toggle('active',t===a));f.querySelectorAll('.sheet-body>.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===a.dataset.tab))});document.querySelectorAll('.document-bookmarks a').forEach(a=>a.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();a.click()}});document.querySelectorAll('form').forEach(f=>f.onsubmit=e=>e.preventDefault());`;
fs.writeFileSync('docs/sheets-preview.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Knave II — Document sheets preview</title><style>${core}</style><style>${css}</style><nav class="preview-nav">${nav}</nav><p class="preview-note">Visual preview · sample data · rolls and saving require Foundry VTT.</p>${sheets.join('')}<script>${script}</script></html>`);
console.log(`Rendered 12 sheets; ${checked} automatic/manual binding checks passed. Open docs/sheets-preview.html.`);
