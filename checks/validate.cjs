const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'../dist');
const data=['chapters','analysis','practice','part1','bilingual'].map(n=>JSON.parse(fs.readFileSync(`${root}/data/${n}.json`)));
const [c,a,p]=data;
assert.equal(c.chapters.length,23);
c.chapters.forEach((x,i)=>{assert.equal(x.id,i+1);assert.equal(x.part,i<9?1:i<17?2:3);assert.equal(x.analysis.length,3);assert(x.summary.split(/\s+/).length>=150);assert(x.scenes.length>=3);assert(x.summaryZh.length>=200);assert(x.questionZh&&x.answerZh&&x.pitfall.zh);for(const scene of x.scenes)assert(scene.text&&scene.zh);assert(x.summary&&x.question&&x.answer&&x.zh);});
assert.equal(a.themes.length,9);assert.equal(p.flashcards.length,30);assert.equal(p.quiz.length,20);assert.equal(p.essays.length,6);
p.quiz.forEach(q=>{assert.equal(q.options.length,4);assert(q.correct>=0&&q.correct<4);assert.equal(new Set(q.options).size,4);});
for(const group of data)for(const [name,items] of Object.entries(group)){if(Array.isArray(items)&&name!=='glossary')assert.equal(new Set(items.map(x=>x.id)).size,items.length,`Unique IDs in ${name}`);}
const sources=new Set(data.flatMap(x=>(x.sources||[]).map(s=>s.id)));
for(const group of data)for(const items of Object.values(group))for(const x of Array.isArray(items)?items:[])for(const id of x.sourceIds||[])assert(sources.has(id),`Missing source ${id}`);
const part1=data[3];assert.equal(part1.quizPart1.length,60);for(let ch=0;ch<=9;ch++)assert.equal(part1.quizPart1.filter(q=>q.chapter===ch).length,6);for(const q of part1.quizPart1){assert.equal(q.options.length,4);assert.equal(q.optionsZh.length,4);assert(q.questionZh&&q.explanationZh&&q.locator&&q.evidence);assert(q.correct>=0&&q.correct<4);}assert(part1.part1Reference.length>=8);
console.log('PASS: complete content, chapter boundaries, source references, unique IDs and quiz options');
(async()=>{
 const {JSDOM}=require(process.env.NLMG_JSDOM_PATH || 'jsdom');
 const html=fs.readFileSync(root+'/index.html','utf8');
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.print=()=>{};w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+'/'+url.replace('./','')))});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.eval(`window.ready=(async()=>{${fs.readFileSync(root+'/app.js','utf8')}\n})()`);await w.ready;
 const tick=()=>new Promise(r=>setTimeout(r,8));const $=s=>w.document.querySelector(s);const click=s=>{assert($(s),'Element '+s);$(s).click();};
 const route=async h=>{w.location.hash=h;await tick();assert(!$('#main').textContent.includes('could not be found'),'Valid '+h);};
 assert($('.hero'),'Overview hero');
 click('.skip');assert.equal(w.document.activeElement.id,'main');assert($('.hero'),'Skip does not break routing');
 for(const section of ['chapters','characters','themes','methods','evidence','flashcards','quiz','essays','progress','sources','part1-quiz','part1-revision']){await route(section);assert($('#main').textContent.length>100);}
 for(let i=1;i<=23;i++){await route('chapters/'+i);assert.equal(w.document.querySelectorAll('.analysis-box').length,3);click('[data-action="reveal"]');assert(!$('.answer').classList.contains('hidden'));}
 await route('chapters/7');click('[data-action="chapter-done"]');assert(JSON.parse(w.localStorage.getItem('nlmg-revision-room-v1')).chapters.includes(7));
 $('#chapter-note').value='A saved observation';$('#chapter-note').dispatchEvent(new w.Event('input',{bubbles:true}));await route('overview');await route('chapters/7');assert.equal($('#chapter-note').value,'A saved observation');
 $('#language-select').value='chinese';$('#language-select').dispatchEvent(new w.Event('change',{bubbles:true}));assert($('.zh-copy'));assert.equal(w.document.querySelectorAll('#chapter-summary .en-copy').length,0);$('#language-select').value='bilingual';$('#language-select').dispatchEvent(new w.Event('change',{bubbles:true}));assert($('#chapter-summary .en-copy'));
 for(const section of ['characters','themes','methods'])for(const item of a[section])await route(section+'/'+item.id);
 await route('flashcards');click('[data-action="flip"]');assert($('.flashcard p'));assert.equal(w.document.activeElement.dataset.action,'flip');click('[data-action="flash-known"]');assert.equal(JSON.parse(w.localStorage.getItem('nlmg-revision-room-v1')).known.length,1);
 $('#flash-filter').value='Theme';$('#flash-filter').dispatchEvent(new w.Event('change',{bubbles:true}));assert($('.flashcard').textContent.includes('Theme'));
 await route('quiz');for(const q of p.quiz){click(`[data-action="quiz-answer"][data-value="${q.correct}"]`);assert($('.quiz-option.correct'));click('[data-action="quiz-next"]');}assert($('.score').textContent.includes('20'));assert.equal(JSON.parse(w.localStorage.getItem('nlmg-revision-room-v1')).best,20);
 await route('essays/'+p.essays[2].id);assert.equal($('#essay-select').value,p.essays[2].id);$('#essay-thesis').value='My original thesis';$('#essay-thesis').dispatchEvent(new w.Event('input',{bubbles:true}));await route('overview');await route('essays/'+p.essays[2].id);assert.equal($('#essay-thesis').value,'My original thesis');
 click('[data-action="search"]');$('#search-input').value=p.essays[4].title;$('#search-input').dispatchEvent(new w.Event('input',{bubbles:true}));assert($('.search-result').getAttribute('href').includes(p.essays[4].id));click('.search-result');await tick();assert.equal($('#essay-select').value,p.essays[4].id);
 await route('progress');click('[data-check]');assert.equal(JSON.parse(w.localStorage.getItem('nlmg-revision-room-v1')).checks.length,1);

 await route('part1-quiz');click('[data-action="p1-start"]');
 const local=()=>JSON.parse(w.localStorage.getItem('nlmg-revision-room-v1'));
 for(let i=0;i<60;i++){const ses=local().part1Session,q=part1.quizPart1.find(q=>q.id===ses.order[ses.index]);click(`[data-action="p1-answer"][data-value="${i===0?(q.correct+1)%4:q.correct}"]`);assert($('.callout[role="status"]'));click('[data-action="p1-next"]');}
 assert.equal(local().part1Last.score,59);assert($('#p1-results'));click('[data-action="p1-retry"]');assert.equal(local().part1Session.order.length,1);const retryQ=part1.quizPart1.find(q=>q.id===local().part1Session.order[0]);click(`[data-action="p1-answer"][data-value="${retryQ.correct}"]`);click('[data-action="p1-next"]');assert.equal(local().part1Last.score,1);
 click('[data-action="p1-new"]');$('#p1-chapter').value='4';$('#p1-chapter').dispatchEvent(new w.Event('change',{bubbles:true}));$('#p1-mode').value='exam';$('#p1-mode').dispatchEvent(new w.Event('change',{bubbles:true}));click('[data-action="p1-start"]');assert.equal(local().part1Session.order.length,6);
 click('[data-action="p1-next"]');
 for(let i=1;i<6;i++){const ses=local().part1Session,q=part1.quizPart1.find(q=>q.id===ses.order[ses.index]);click(`[data-action="p1-answer"][data-value="${q.correct}"]`);assert(!$('.quiz-option.correct'));assert(!$('.callout[role="status"]'));click('[data-action="p1-next"]');}
 assert.equal(local().part1Session.complete,false);assert.equal(local().part1Session.index,0);const lastQ=part1.quizPart1.find(q=>q.id===local().part1Session.order[0]);click(`[data-action="p1-answer"][data-value="${lastQ.correct}"]`);click('[data-action="p1-jump"][data-index="5"]');click('[data-action="p1-next"]');assert.equal(local().part1Last.score,6);
 await route('part1-quiz/7');assert.equal($('#p1-chapter').value,'7');click('[data-action="p1-start"]');assert(local().part1Session.order.every(id=>part1.quizPart1.find(q=>q.id===id).chapter===7));await route('overview');await route('part1-quiz');assert($('.quiz-question'),'Resume active set');
 console.log('PASS: Part One 60-question practice, error retry, exam answer concealment, chapter filtering, incomplete submission guard and session persistence');
 console.log('PASS: all sections and 48 detail routes, skip navigation, recall answers, notes, bilingual toggle, flashcards, full quiz, essay drafts, targeted search and checklist persistence');
 dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
