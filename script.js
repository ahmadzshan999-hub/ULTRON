const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const store = {
  get(key, fallback){ try { return JSON.parse(localStorage.getItem('ultron_'+key)) ?? fallback; } catch { return fallback; } },
  set(key, value){ localStorage.setItem('ultron_'+key, JSON.stringify(value)); }
};
let tasks = store.get('tasks', []);
let notes = store.get('notes', []);
let filter = 'all';
let toastTimer;
function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }
function navigate(view){
  $$('.view').forEach(v=>v.classList.toggle('active-view',v.id==='view-'+view));
  $$('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const labels={overview:'Overview',assistant:'AI Assistant',tasks:'Tasks',notes:'Notes',settings:'Settings'};
  $('#pageName').textContent=labels[view]||'Overview';
  $('#sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('#newChat').addEventListener('click',()=>{navigate('assistant');$('#chatMessages').innerHTML='';addMessage('assistant',"New conversation started. What's on your mind?");});
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#todayDate').textContent=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(new Date());

function renderStats(){
  const done=tasks.filter(t=>t.done).length, open=tasks.length-done;
  $('#completedStat').textContent=done; $('#openStat').textContent=open; $('#notesStat').textContent=notes.length;
  $('#taskCount').textContent=open; $('#noteCountLabel').textContent=notes.length+' note'+(notes.length===1?'':'s');
}
function renderTasks(){
  const list=$('#taskList'); const shown=tasks.filter(t=>filter==='all'||(filter==='done'?t.done:!t.done));
  $('#taskSummary').textContent=tasks.length?tasks.length+' total · '+tasks.filter(t=>t.done).length+' completed':'No tasks yet';
  if(!shown.length){list.innerHTML='<div class="empty-state"><span>✓</span><strong>'+(tasks.length?'Nothing in this filter':'Nothing on your list yet')+'</strong><p>'+(tasks.length?'Try another filter.':'Add a task above to get started.')+'</p></div>';return;}
  list.innerHTML=shown.map(t=>'<div class="task-item '+(t.done?'done':'')+'" data-id="'+t.id+'"><input class="task-check" type="checkbox" '+(t.done?'checked':'')+' aria-label="Complete task"><span class="task-title"></span><button class="delete-task" aria-label="Delete task">×</button></div>').join('');
  $$('.task-item',list).forEach(row=>{const task=tasks.find(t=>t.id===row.dataset.id);$('.task-title',row).textContent=task.text;$('.task-check',row).addEventListener('change',e=>{task.done=e.target.checked;saveTasks();});$('.delete-task',row).addEventListener('click',()=>{tasks=tasks.filter(t=>t.id!==task.id);saveTasks();toast('Task deleted');});});
}
function saveTasks(){store.set('tasks',tasks);renderTasks();renderStats();}
$('#taskForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#taskInput');const text=input.value.trim();if(!text)return;tasks.unshift({id:crypto.randomUUID(),text,done:false});input.value='';saveTasks();toast('Task added');});
$$('.filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderTasks();}));

function renderNotes(){
  const list=$('#notesList');
  if(!notes.length){list.innerHTML='<div class="empty-state"><span>▤</span><strong>Your notes will appear here</strong><p>Write something worth remembering.</p></div>';return;}
  list.innerHTML=notes.map(n=>'<article class="note-card" data-id="'+n.id+'"><button class="delete-note" aria-label="Delete note">×</button><strong class="note-title"></strong><p class="note-content"></p><small>'+new Date(n.created).toLocaleString()+'</small></article>').join('');
  $$('.note-card',list).forEach(card=>{const n=notes.find(x=>x.id===card.dataset.id);$('.note-title',card).textContent=n.title;$('.note-content',card).textContent=n.content;$('.delete-note',card).addEventListener('click',()=>{notes=notes.filter(x=>x.id!==n.id);saveNotes();toast('Note deleted');});});
}
function saveNotes(){store.set('notes',notes);renderNotes();renderStats();}
$('#noteForm').addEventListener('submit',e=>{e.preventDefault();const title=$('#noteTitle').value.trim(),content=$('#noteContent').value.trim();if(!title||!content)return;notes.unshift({id:crypto.randomUUID(),title,content,created:new Date().toISOString()});e.target.reset();saveNotes();toast('Note saved');});

function addMessage(who,text){
  const row=document.createElement('div');row.className='message '+(who==='user'?'user-message':'assistant-message');
  if(who==='assistant'){const av=document.createElement('div');av.className='message-avatar';av.textContent='✳';row.append(av);}
  const body=document.createElement('div');body.className='message-body';const name=document.createElement('strong');name.textContent=who==='user'?'YOU':'ULTRON';const p=document.createElement('p');p.textContent=text;body.append(name,p);row.append(body);$('#chatMessages').append(row);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight;
}
function localReply(input){
  const s=input.toLowerCase();
  if(/hello|hi|hey|yo/.test(s))return "Hey! What would you like to work on today? I can help you organise your thoughts, tasks, or notes.";
  if(/plan|day|schedule/.test(s))return "A simple plan is a great start:\n1. Choose your three most important tasks.\n2. Start with the one that matters most.\n3. Take a short break between focused sessions.\n4. Review what you completed.\n\nYou can add your tasks in the Tasks section.";
  if(/idea|project/.test(s))return "Try starting with a problem you genuinely want to solve. Write down the goal, who it helps, and the smallest useful first version. Save your idea in Notes so you can build on it.";
  if(/focus|concentrat/.test(s))return "Try one small focus session: choose a single task, remove distractions, and work on it for 20–25 minutes. Then take a short break. Keep the next step clear and realistic.";
  if(/task|todo|work/.test(s))return "Let's make it actionable. Open the Tasks section and add one clear next step. Breaking a big goal into smaller tasks makes it easier to begin.";
  if(/note|remember|save/.test(s))return "You can save that thought in the Notes section. Give it a short title and add the details you want to remember.";
  if(/who are you|what are you|ultron/.test(s))return "I'm ULTRON — the first preview of your personal productivity workspace. This version has local tools for tasks and notes. A live AI connection is not enabled yet.";
  return "Thanks for sharing that. This ULTRON preview currently uses a small set of local demo responses rather than a live AI model. You can still use the Tasks and Notes sections to organise your next steps.";
}
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#chatInput'),text=input.value.trim();if(!text)return;addMessage('user',text);input.value='';setTimeout(()=>addMessage('assistant',localReply(text)),250);});
$$('.suggestion').forEach(b=>b.addEventListener('click',()=>{$('#chatInput').value=b.textContent;$('#chatForm').requestSubmit();}));
$('#clearChat').addEventListener('click',()=>{$('#chatMessages').innerHTML='';addMessage('assistant','Conversation cleared. What would you like to explore next?');});
$('#clearData').addEventListener('click',()=>{if(!confirm('Clear all ULTRON tasks and notes saved in this browser? This cannot be undone.'))return;tasks=[];notes=[];saveTasks();saveNotes();toast('Local data cleared');});
$('#themeToggle').addEventListener('click',()=>{document.body.classList.toggle('light-mode');toast(document.body.classList.contains('light-mode')?'Light mode preview':'Dark mode');});
renderTasks();renderNotes();renderStats();