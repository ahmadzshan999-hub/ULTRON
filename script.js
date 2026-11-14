const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k,f){try{return JSON.parse(localStorage.getItem('ultron_'+k))??f}catch{return f}},set(k,v){try{localStorage.setItem('ultron_'+k,JSON.stringify(v))}catch{toast('Browser storage is full or unavailable')}}};
let tasks=store.get('tasks',[]),notes=store.get('notes',[]),filter='all',toastTimer;
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2300)}
function navigate(v){$$('.view').forEach(x=>x.classList.toggle('active-view',x.id==='view-'+v));$$('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$('#pageName').textContent=({overview:'Overview',assistant:'AI Assistant',tasks:'Tasks',notes:'Notes',settings:'Settings'})[v]||'Overview';$('#sidebar').classList.remove('open');if(v==='assistant')$('#chatInput').focus();window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('#newChat').addEventListener('click',()=>{navigate('assistant');$('#chatMessages').innerHTML='';addMessage('assistant',"New conversation started. What's on your mind?")});$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#todayDate').textContent=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(new Date());
function renderStats(){const done=tasks.filter(t=>t.done).length,open=tasks.length-done;$('#completedStat').textContent=done;$('#openStat').textContent=open;$('#notesStat').textContent=notes.length;$('#taskCount').textContent=open;$('#noteCount').textContent=notes.length;$('#noteCountLabel').textContent=notes.length+' note'+(notes.length===1?'':'s')}
function renderTasks(){const list=$('#taskList'),shown=tasks.filter(t=>filter==='all'||(filter==='done'?t.done:!t.done));$('#taskSummary').textContent=tasks.length?tasks.length+' total · '+tasks.filter(t=>t.done).length+' completed':'No tasks yet';if(!shown.length){list.innerHTML='<div class="empty-state"><span>✓</span><strong>'+(tasks.length?'Nothing in this filter':'Nothing on your list yet')+'</strong><p>'+(tasks.length?'Try another filter.':'Add a task above to get started.')+'</p></div>';return}list.innerHTML=shown.map(t=>'<div class="task-item '+(t.done?'done':'')+'" data-id="'+t.id+'"><input class="task-check" type="checkbox" '+(t.done?'checked':'')+' aria-label="Complete task"><span class="task-title"></span><button class="delete-task" aria-label="Delete task">×</button></div>').join('');$$('.task-item',list).forEach(row=>{const t=tasks.find(x=>x.id===row.dataset.id);$('.task-title',row).textContent=t.text;$('.task-check',row).addEventListener('change',e=>{t.done=e.target.checked;saveTasks()});$('.delete-task',row).addEventListener('click',()=>{tasks=tasks.filter(x=>x.id!==t.id);saveTasks();toast('Task deleted')})})}
function saveTasks(){store.set('tasks',tasks);renderTasks();renderStats()}
$('#taskForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#taskInput'),v=i.value.trim();if(!v)return;tasks.unshift({id:crypto.randomUUID(),text:v,done:false});i.value='';saveTasks();toast('Task added')});
$$('.filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderTasks()}));
function renderNotes(){const list=$('#notesList');if(!notes.length){list.innerHTML='<div class="empty-state"><span>▤</span><strong>Your notes will appear here</strong><p>Write something worth remembering.</p></div>';return}list.innerHTML=notes.map(n=>'<article class="note-card" data-id="'+n.id+'"><button class="delete-note" aria-label="Delete note">×</button><strong class="note-title"></strong><p class="note-content"></p><small>'+new Date(n.created).toLocaleString()+'</small></article>').join('');$$('.note-card',list).forEach(c=>{const n=notes.find(x=>x.id===c.dataset.id);$('.note-title',c).textContent=n.title;$('.note-content',c).textContent=n.content;$('.delete-note',c).addEventListener('click',()=>{notes=notes.filter(x=>x.id!==n.id);saveNotes();toast('Note deleted')})})}
function saveNotes(){store.set('notes',notes);renderNotes();renderStats()}
$('#noteForm').addEventListener('submit',e=>{e.preventDefault();const title=$('#noteTitle').value.trim(),content=$('#noteContent').value.trim();if(!title||!content)return;notes.unshift({id:crypto.randomUUID(),title,content,created:new Date().toISOString()});e.target.reset();saveNotes();toast('Note saved')});
function addMessage(who,text){const row=document.createElement('div');row.className='message '+(who==='user'?'user-message':'assistant-message');if(who==='assistant'){const a=document.createElement('div');a.className='message-avatar';a.textContent='✳';row.append(a)}const body=document.createElement('div'),name=document.createElement('strong'),p=document.createElement('p');body.className='message-body';name.textContent=who==='user'?'YOU':'ULTRON';p.textContent=text;body.append(name,p);row.append(body);$('#chatMessages').append(row);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight}
function localReply(input){const s=input.toLowerCase();if(/hello|hi|hey|yo/.test(s))return"Hello. I'm ready to help you think things through. What are we working on?";if(/plan|day|schedule/.test(s))return"Let's make a simple plan:\n1. Pick your three most important tasks.\n2. Start with the task that matters most.\n3. Work in a focused block, then take a short break.\n4. Review what you completed.\n\nYou can save each step in Tasks.";if(/idea|project/.test(s))return"Start with three things: the problem you want to solve, who it helps, and the smallest useful version you can build. Save the idea in Notes, then turn the first action into a task.";if(/focus|concentrat/.test(s))return"Try a short focus cycle: choose one task, close unrelated tabs, work for 20 minutes, then take a 5-minute break. Make the next action small enough to start now.";if(/task|todo|work/.test(s))return"Let's make it actionable. Open Tasks and add one clear next step. If the goal feels too big, split it into smaller actions.";if(/note|remember|save/.test(s))return"You can keep that thought in Notes. Give it a short title and add the details you want to remember.";if(/who are you|what are you|ultron/.test(s))return"I'm ULTRON, your personal workspace preview. I can organise tasks and notes in this browser and provide basic demo replies. A live AI model and cloud account are not connected yet.";return"I can help structure that. Tell me the outcome you want, what you've tried, and the next decision you need to make. Note: this preview uses built-in demo responses, not a live AI model."}
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#chatInput'),v=i.value.trim();if(!v)return;i.value='';processUserCommand(v,false)});
$$('.suggestion').forEach(b=>b.addEventListener('click',()=>{$('#chatInput').value=b.textContent;$('#chatForm').requestSubmit()}));$('#clearChat').addEventListener('click',()=>{$('#chatMessages').innerHTML='';addMessage('assistant','Conversation cleared. What would you like to explore next?')});
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let manualRecognition=null,wakeRecognition=null,wakeEnabled=false,speechReplies=true,manualListening=false;
function voiceStatus(m){$('#voiceStatus').textContent=m;$('#wakeStatus').textContent=m}
function speakText(text){
  if(!speechReplies||!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return Promise.resolve();
  window.speechSynthesis.cancel();
  return new Promise(resolve=>{
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=navigator.language||'en-US';utterance.rate=1;utterance.pitch=1;
    utterance.onend=resolve;utterance.onerror=resolve;
    window.speechSynthesis.speak(utterance);
  });
}
function processUserCommand(text,fromWake){
  const clean=text.trim();if(!clean)return;
  addMessage('user',clean);
  const reply=localReply(clean);
  setTimeout(()=>{addMessage('assistant',reply);speakText(reply).finally(()=>{if(wakeEnabled&&fromWake)setTimeout(startWakeListener,700)})},220);
}
function stopWakeRecognition(){
  if(wakeRecognition){try{wakeRecognition.onend=null;wakeRecognition.stop()}catch{}wakeRecognition=null}
}
function startCommandListener(){
  if(!wakeEnabled||!SpeechRecognition)return;
  const rec=new SpeechRecognition();let transcript='';
  rec.lang=navigator.language||'en-US';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
  rec.onstart=()=>voiceStatus('Listening for your command…');
  rec.onresult=e=>{transcript=e.results[0][0].transcript||'';};
  rec.onerror=e=>voiceStatus('I could not hear that ('+e.error+'). Wake word will resume if possible.');
  rec.onend=()=>{
    if(!wakeEnabled)return;
    if(transcript)processUserCommand(transcript,true);
    else speakText("I didn't catch that.").finally(()=>{if(wakeEnabled)startWakeListener()});
  };
  try{rec.start()}catch{voiceStatus('Microphone could not start. Check browser permission.');}
}
function startWakeListener(){
  if(!wakeEnabled||!SpeechRecognition||document.visibilityState!=='visible')return;
  stopWakeRecognition();
  const rec=new SpeechRecognition();let nextAction='',command='';
  wakeRecognition=rec;rec.lang=navigator.language||'en-US';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;
  rec.onstart=()=>{voiceStatus('Listening for “ULTRON”… Keep this tab open and visible.');$('#voiceOrb').classList.add('voice-active')};
  rec.onresult=e=>{
    for(let i=e.resultIndex;i<e.results.length;i++){
      if(!e.results[i].isFinal)continue;
      const heard=e.results[i][0].transcript||'';
      const match=heard.match(/\bultron\b[\s,.:;!?-]*(.*)$/i);
      if(match){command=match[1].trim();nextAction=command?'process':'wake';try{rec.stop()}catch{};break}
    }
  };
  rec.onerror=e=>{voiceStatus('Wake-word listening stopped: '+e.error+'. You can retry or use the microphone button.');};
  rec.onend=()=>{
    if(wakeRecognition===rec)wakeRecognition=null;
    $('#voiceOrb').classList.remove('voice-active');
    if(!wakeEnabled)return;
    if(nextAction==='process')processUserCommand(command,true);
    else if(nextAction==='wake')speakText('Yes?').finally(()=>{if(wakeEnabled)startCommandListener()});
    else setTimeout(startWakeListener,900);
  };
  try{rec.start()}catch{voiceStatus('Could not start wake-word listening. Check microphone permission and browser support.');}
}
$('#wakeToggle').addEventListener('click',()=>{
  if(!SpeechRecognition){voiceStatus('This browser does not support speech recognition. Try a supported desktop browser or use the microphone button.');return}
  wakeEnabled=!wakeEnabled;
  if(wakeEnabled){$('#wakeToggle').textContent='Disable wake word';voiceStatus('Requesting microphone access…');startWakeListener()}
  else{stopWakeRecognition();$('#voiceOrb').classList.remove('voice-active');$('#wakeToggle').textContent='Enable wake word';voiceStatus('Wake word is off. Microphone listening has stopped.')}
});
$('#speechToggle').addEventListener('click',()=>{
  speechReplies=!speechReplies;$('#speechToggle').textContent='Voice replies: '+(speechReplies?'On':'Off');
  if(!speechReplies&&'speechSynthesis' in window)window.speechSynthesis.cancel();
  voiceStatus(speechReplies?'Spoken replies enabled.':'Spoken replies disabled.');
});
document.addEventListener('visibilitychange',()=>{
  if(!wakeEnabled)return;
  if(document.visibilityState==='hidden'){stopWakeRecognition();$('#voiceOrb').classList.remove('voice-active');voiceStatus('Paused while this tab is hidden. Return to this tab to resume.')}
  else startWakeListener();
});
$('#voiceButton').addEventListener('click',()=>{
  if(!SpeechRecognition){voiceStatus('Voice input is not supported in this browser. You can still type messages.');toast('Voice input is not supported here');return}
  if(manualListening){try{manualRecognition.stop()}catch{}return}
  if(wakeEnabled){stopWakeRecognition();$('#voiceOrb').classList.remove('voice-active')}
  manualRecognition=new SpeechRecognition();manualRecognition.lang=navigator.language||'en-US';manualRecognition.interimResults=false;manualRecognition.maxAlternatives=1;
  manualRecognition.onstart=()=>{manualListening=true;$('#voiceButton').classList.add('listening');voiceStatus('Listening… Speak now.')};
  manualRecognition.onresult=e=>{$('#chatInput').value=e.results[0][0].transcript;voiceStatus('Voice captured. Review your message, then press send.')};
  manualRecognition.onerror=e=>voiceStatus('Voice input issue: '+e.error+'. You can type instead.');
  manualRecognition.onend=()=>{manualListening=false;$('#voiceButton').classList.remove('listening');if(wakeEnabled)startWakeListener()};
  try{manualRecognition.start()}catch{voiceStatus('Could not start voice input. Check microphone permission.')}
});
function toggleTheme(){document.body.classList.toggle('light-mode');const light=document.body.classList.contains('light-mode');store.set('theme',light?'light':'dark');toast(light?'Light mode enabled':'Dark mode enabled')}
$('#themeToggle').addEventListener('click',toggleTheme);$('#themeToggleAlt').addEventListener('click',toggleTheme);if(store.get('theme','dark')==='light')document.body.classList.add('light-mode');
$('#clearData').addEventListener('click',()=>{if(!confirm('Clear all ULTRON tasks and notes saved in this browser? This cannot be undone.'))return;tasks=[];notes=[];saveTasks();saveNotes();toast('Local data cleared')});
renderTasks();renderNotes();renderStats();