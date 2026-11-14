const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k,f){try{return JSON.parse(localStorage.getItem('ultron_'+k))??f}catch{return f}},set(k,v){try{localStorage.setItem('ultron_'+k,JSON.stringify(v))}catch{toast('Browser storage is full or unavailable')}}};
let tasks=store.get('tasks',[]),notes=store.get('notes',[]),filter='all',toastTimer;
const supabaseClient = window.supabase?.createClient && window.ULTRON_CONFIG?.url && window.ULTRON_CONFIG?.publishableKey
  ? window.supabase.createClient(window.ULTRON_CONFIG.url,window.ULTRON_CONFIG.publishableKey)
  : null;
let currentUser=null,chatHistory=[],cloudReady=false;
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2300)}
function navigate(v){if(v==='owner'&&$('#ownerNav').hidden){v='settings';toast('Owner access is restricted.')}$$('.view').forEach(x=>x.classList.toggle('active-view',x.id==='view-'+v));$$('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$('#pageName').textContent=({overview:'Overview',assistant:'AI Assistant',tasks:'Tasks',notes:'Notes',settings:'Settings',integrations:'Integrations',plans:'Plans',owner:'Owner Console',voice:'Voice Room'})[v]||'Overview';$('#sidebar').classList.remove('open');if(v==='assistant')$('#chatInput').focus();if(v==='voice')$('#voiceButton').focus();window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('#newChat').addEventListener('click',()=>{chatHistory=[];navigate('assistant');$('#chatMessages').innerHTML='';$('#voiceTranscript').innerHTML='<p class="voice-transcript-empty">Your spoken conversations will appear here.</p>';addMessage('assistant',"New conversation started. What's on your mind?")});
$('#voiceButtonChat').addEventListener('click',()=>navigate('voice'));
$('#openChatFromVoice').addEventListener('click',()=>navigate('assistant'));$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#todayDate').textContent=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(new Date());
function renderStats(){const done=tasks.filter(t=>t.done).length,open=tasks.length-done;$('#completedStat').textContent=done;$('#openStat').textContent=open;$('#notesStat').textContent=notes.length;$('#taskCount').textContent=open;$('#noteCount').textContent=notes.length;$('#noteCountLabel').textContent=notes.length+' note'+(notes.length===1?'':'s')}
function renderTasks(){const list=$('#taskList'),shown=tasks.filter(t=>filter==='all'||(filter==='done'?t.done:!t.done));$('#taskSummary').textContent=tasks.length?tasks.length+' total · '+tasks.filter(t=>t.done).length+' completed':'No tasks yet';if(!shown.length){list.innerHTML='<div class="empty-state"><span>✓</span><strong>'+(tasks.length?'Nothing in this filter':'Nothing on your list yet')+'</strong><p>'+(tasks.length?'Try another filter.':'Add a task above to get started.')+'</p></div>';return}list.innerHTML=shown.map(t=>'<div class="task-item '+(t.done?'done':'')+'" data-id="'+t.id+'"><input class="task-check" type="checkbox" '+(t.done?'checked':'')+' aria-label="Complete task"><span class="task-title"></span><button class="delete-task" aria-label="Delete task">×</button></div>').join('');$$('.task-item',list).forEach(row=>{const t=tasks.find(x=>x.id===row.dataset.id);$('.task-title',row).textContent=t.text;$('.task-check',row).addEventListener('change',e=>{t.done=e.target.checked;saveTasks()});$('.delete-task',row).addEventListener('click',()=>{tasks=tasks.filter(x=>x.id!==t.id);saveTasks();toast('Task deleted')})})}
async function syncRows(table,rows){
 if(!supabaseClient||!currentUser||!cloudReady)return;
 const {data:existing,error:readError}=await supabaseClient.from(table).select('id');
 if(readError)throw readError;
 const keep=new Set(rows.map(row=>row.id));
 const remove=(existing||[]).map(row=>row.id).filter(id=>!keep.has(id));
 if(remove.length){const {error}=await supabaseClient.from(table).delete().in('id',remove);if(error)throw error;}
 if(rows.length){const payload=rows.map(row=>({...row,user_id:currentUser.id}));const {error}=await supabaseClient.from(table).upsert(payload);if(error)throw error;}
}
function saveTasks(){store.set('tasks',tasks);renderTasks();renderStats();if(currentUser&&cloudReady)syncRows('tasks',tasks.map(t=>({id:t.id,text:t.text,done:!!t.done,created_at:t.created||new Date().toISOString()}))).catch(e=>{console.error(e);toast('Cloud task sync failed.')})}
$('#taskForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#taskInput'),v=i.value.trim();if(!v)return;tasks.unshift({id:crypto.randomUUID(),text:v,done:false});i.value='';saveTasks();toast('Task added')});
$$('.filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderTasks()}));
function renderNotes(){const list=$('#notesList');if(!notes.length){list.innerHTML='<div class="empty-state"><span>▤</span><strong>Your notes will appear here</strong><p>Write something worth remembering.</p></div>';return}list.innerHTML=notes.map(n=>'<article class="note-card" data-id="'+n.id+'"><button class="delete-note" aria-label="Delete note">×</button><strong class="note-title"></strong><p class="note-content"></p><small>'+new Date(n.created).toLocaleString()+'</small></article>').join('');$$('.note-card',list).forEach(c=>{const n=notes.find(x=>x.id===c.dataset.id);$('.note-title',c).textContent=n.title;$('.note-content',c).textContent=n.content;$('.delete-note',c).addEventListener('click',()=>{notes=notes.filter(x=>x.id!==n.id);saveNotes();toast('Note deleted')})})}
function saveNotes(){store.set('notes',notes);renderNotes();renderStats();if(currentUser&&cloudReady)syncRows('notes',notes.map(n=>({id:n.id,title:n.title,content:n.content,created_at:n.created||new Date().toISOString()}))).catch(e=>{console.error(e);toast('Cloud note sync failed.')})}
$('#noteForm').addEventListener('submit',e=>{e.preventDefault();const title=$('#noteTitle').value.trim(),content=$('#noteContent').value.trim();if(!title||!content)return;notes.unshift({id:crypto.randomUUID(),title,content,created:new Date().toISOString()});e.target.reset();saveNotes();toast('Note saved')});
function addMessage(who,text){const transcript=$('#voiceTranscript');if(transcript){const empty=$('.voice-transcript-empty',transcript);if(empty)empty.remove();const line=document.createElement('div');line.className='voice-transcript-line '+(who==='user'?'transcript-user':'transcript-assistant');const label=document.createElement('strong');label.textContent=who==='user'?'YOU':'ULTRON';const content=document.createElement('p');content.textContent=text;line.append(label,content);transcript.append(line);transcript.scrollTop=transcript.scrollHeight;while(transcript.children.length>12)transcript.firstElementChild.remove()}const row=document.createElement('div');row.className='message '+(who==='user'?'user-message':'assistant-message');if(who==='assistant'){const a=document.createElement('div');a.className='message-avatar';a.textContent='✳';row.append(a)}const body=document.createElement('div'),name=document.createElement('strong'),p=document.createElement('p');body.className='message-body';name.textContent=who==='user'?'YOU':'ULTRON';p.textContent=text;body.append(name,p);row.append(body);$('#chatMessages').append(row);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight}
function localReply(input){const s=input.toLowerCase();if(/hello|hi|hey|yo/.test(s))return"Hello. I'm ready to help you think things through. What are we working on?";if(/plan|day|schedule/.test(s))return"Let's make a simple plan:\n1. Pick your three most important tasks.\n2. Start with the task that matters most.\n3. Work in a focused block, then take a short break.\n4. Review what you completed.\n\nYou can save each step in Tasks.";if(/idea|project/.test(s))return"Start with three things: the problem you want to solve, who it helps, and the smallest useful version you can build. Save the idea in Notes, then turn the first action into a task.";if(/focus|concentrat/.test(s))return"Try a short focus cycle: choose one task, close unrelated tabs, work for 20 minutes, then take a 5-minute break. Make the next action small enough to start now.";if(/task|todo|work/.test(s))return"Let's make it actionable. Open Tasks and add one clear next step. If the goal feels too big, split it into smaller actions.";if(/note|remember|save/.test(s))return"You can keep that thought in Notes. Give it a short title and add the details you want to remember.";if(/who are you|what are you|ultron/.test(s))return"I'm ULTRON, your personal workspace preview. I can organise tasks and notes in this browser and provide basic demo replies. A live AI model and cloud account are not connected yet.";return"I can help structure that. Tell me the outcome you want, what you've tried, and the next decision you need to make. Note: this preview uses built-in demo responses, not a live AI model."}
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#chatInput'),v=i.value.trim();if(!v)return;i.value='';processUserCommand(v,false)});
$$('.suggestion').forEach(b=>b.addEventListener('click',()=>{$('#chatInput').value=b.textContent;$('#chatForm').requestSubmit()}));$('#clearChat').addEventListener('click',()=>{chatHistory=[];$('#chatMessages').innerHTML='';$('#voiceTranscript').innerHTML='<p class="voice-transcript-empty">Your spoken conversations will appear here.</p>';addMessage('assistant','Conversation cleared. What would you like to explore next?')});
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let manualRecognition=null,wakeRecognition=null,wakeEnabled=false,speechReplies=true,manualListening=false;
function voiceStatus(m){$('#voiceStatus').textContent=m;$('#wakeStatus').textContent=m;$('#voiceRoomMode').textContent=m.toUpperCase().slice(0,42)}
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
async function processUserCommand(text,fromWake){
 const clean=text.trim();if(!clean)return;
 addMessage('user',clean);chatHistory.push({role:'user',content:clean});
 let reply='';
 if(currentUser&&supabaseClient){
  voiceStatus('Thinking…');
  try{
   const {data,error}=await supabaseClient.functions.invoke('ultron-chat',{body:{message:clean,history:chatHistory.slice(-11,-1)}});
   if(error)throw error;
   if(!data?.reply)throw new Error('No AI reply returned');
   reply=data.reply;$('#aiBadge').textContent='Connected';$('#aiStatus').textContent='The protected AI endpoint returned a response successfully.';$('#assistantStatus').innerHTML='<i></i> AI connected · voice replies available';
  }catch(error){console.error('ULTRON AI request failed',error);reply='I could not reach my AI service. The backend may not be deployed or configured yet.';$('#aiBadge').textContent='Unavailable';$('#assistantStatus').innerHTML='<i></i> AI backend unavailable · check setup'}
 }else{
  reply=localReply(clean);
  if(!currentUser)reply+='\n\nSign in under Settings to use the connected AI service and private cloud workspace.';
 }
 chatHistory.push({role:'assistant',content:reply});chatHistory=chatHistory.slice(-12);
 addMessage('assistant',reply);voiceStatus(currentUser?'AI response ready.':'Demo mode. Sign in to enable real AI.');
 await speakText(reply);
 if(wakeEnabled&&fromWake)setTimeout(startWakeListener,700);
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
  if(!SpeechRecognition){voiceStatus('Voice input is not supported in this browser. Use the chat screen to type instead.');toast('Voice input is not supported here');return}
  if(manualListening){try{manualRecognition.stop()}catch{}return}
  if(wakeEnabled){stopWakeRecognition();$('#voiceOrb').classList.remove('voice-active')}
  manualRecognition=new SpeechRecognition();manualRecognition.lang=navigator.language||'en-US';manualRecognition.interimResults=false;manualRecognition.maxAlternatives=1;
  manualRecognition.onstart=()=>{manualListening=true;$('#voiceButton').classList.add('listening');$('#voiceButton').querySelector('strong').textContent='Listening…';voiceStatus('Listening… Speak now.')};
  manualRecognition.onresult=e=>{$('#chatInput').value=e.results[0][0].transcript;voiceStatus('Voice captured. Review your message, then press send.')};
  manualRecognition.onerror=e=>voiceStatus('Voice input issue: '+e.error+'. You can type instead.');
  manualRecognition.onend=()=>{manualListening=false;$('#voiceButton').classList.remove('listening');$('#voiceButton').querySelector('strong').textContent='Start speaking';if(wakeEnabled)startWakeListener()};
  try{manualRecognition.start()}catch{voiceStatus('Could not start voice input. Check microphone permission.')}
});
function toggleTheme(){document.body.classList.toggle('light-mode');const light=document.body.classList.contains('light-mode');store.set('theme',light?'light':'dark');toast(light?'Light mode enabled':'Dark mode enabled')}
$('#themeToggle').addEventListener('click',toggleTheme);$('#themeToggleAlt').addEventListener('click',toggleTheme);if(store.get('theme','dark')==='light')document.body.classList.add('light-mode');
$('#clearData').addEventListener('click',async()=>{
 const prompt=currentUser?'Delete ALL tasks and notes from your signed-in cloud account and this browser? This cannot be undone.':'Delete all tasks and notes saved in this browser? This cannot be undone.';
 if(!confirm(prompt))return;
 if(currentUser){
  const [taskResult,noteResult]=await Promise.all([
   supabaseClient.from('tasks').delete().eq('user_id',currentUser.id),
   supabaseClient.from('notes').delete().eq('user_id',currentUser.id)
  ]);
  if(taskResult.error||noteResult.error){toast('Could not clear cloud data. Nothing was cleared locally.');return}
 }
 tasks=[];notes=[];store.set('tasks',tasks);store.set('notes',notes);localStorage.removeItem('ultron_local_backup');renderTasks();renderNotes();renderStats();toast('Workspace data cleared');
});
renderTasks();renderNotes();renderStats();
async function loadOwnerConsole(){
 $('#ownerNav').hidden=true;
 if(!currentUser||!supabaseClient)return;
 $('#ownerStatus').textContent='Checking server-side owner permissions…';
 try{
  const {data,error}=await supabaseClient.functions.invoke('ultron-admin',{body:{action:'overview'}});
  if(error)throw error;
  if(data?.role!=='owner')throw new Error('Owner role required');
  $('#ownerNav').hidden=false;
  $('#ownerTasks').textContent=String(data.metrics?.tasks??'—');
  $('#ownerNotes').textContent=String(data.metrics?.notes??'—');$('#ownerGrants').textContent=String(data.metrics?.activeGrants??'—');
  $('#ownerStatus').textContent='Owner access verified · read-only overview';
 }catch(error){
  $('#ownerNav').hidden=true;
  $('#ownerStatus').textContent='Owner access is not assigned or the admin service is not deployed.';
  $('#ownerTasks').textContent='—';$('#ownerNotes').textContent='—';$('#ownerGrants').textContent='—';
  if($('#view-owner').classList.contains('active-view'))navigate('settings');
 }
}
$('#refreshOwner').addEventListener('click',loadOwnerConsole);

async function ownerPlanAction(action){
 const email=$('#grantEmail').value.trim();
 if(!email){$('#ownerActionStatus').textContent='Enter the account email first.';return}
 const prompt=action==='grant'?'Grant the selected complimentary plan to '+email+'? No payment will be collected.':'Revoke the complimentary plan for '+email+' and return the account to Free?';
 if(!confirm(prompt))return;
 const button=action==='grant'?$('#grantPlanButton'):$('#revokePlanButton');
 button.disabled=true;$('#ownerActionStatus').textContent='Checking owner permissions and updating the account…';
 try{
  const body={action,email};if(action==='grant'){body.plan=$('#grantPlan').value;body.duration=$('#grantDuration').value}
  const {data,error}=await supabaseClient.functions.invoke('ultron-admin',{body});
  if(error)throw error;
  $('#ownerActionStatus').textContent=data.message+(data.expires_at?' Expires: '+new Date(data.expires_at).toLocaleDateString():' No expiry.');
  await loadOwnerConsole();
 }catch(error){$('#ownerActionStatus').textContent=error?.message||'Owner action failed. Check the function deployment and migrations.'}
 finally{button.disabled=false}
}
$('#grantPlanForm').addEventListener('submit',event=>{event.preventDefault();ownerPlanAction('grant')});
$('#revokePlanButton').addEventListener('click',()=>ownerPlanAction('revoke'));


async function loadMembership(){
 $('#membershipStatus').hidden=true;
 if(!currentUser||!supabaseClient)return;
 const {data,error}=await supabaseClient.from('ultron_entitlements').select('plan,status,expires_at').eq('user_id',currentUser.id).maybeSingle();
 if(error){console.warn('Membership status unavailable',error.message);return}
 const active=data&&data.status==='active'&&(!data.expires_at||new Date(data.expires_at).getTime()>Date.now());
 const plan=active?data.plan:'free';
 $('#membershipPlan').textContent=plan==='free'?'Free plan':plan.charAt(0).toUpperCase()+plan.slice(1)+' plan';
 $('#membershipBadge').textContent=plan.toUpperCase();
 $('#membershipExpiry').textContent=active&&data.expires_at?'Complimentary access until '+new Date(data.expires_at).toLocaleDateString():active?'Complimentary access · no expiry':'Standard access';
 $('#membershipStatus').hidden=false;
}
async function refreshAccount(){
 if(!supabaseClient){$('#accountState').textContent='Not configured';$('#authMessage').textContent='Supabase configuration is missing.';return}
 const {data:{session}}=await supabaseClient.auth.getSession();
 currentUser=session?.user||null;
 $('#signedOutPanel').hidden=!!currentUser;$('#signedInPanel').hidden=!currentUser;
 $('#accountState').textContent=currentUser?'Signed in':'Signed out';
 $('#signedInEmail').textContent=currentUser?.email||'Signed in';
 if(currentUser)await loadMembership();else $('#membershipStatus').hidden=true;
 $('#connectionIndicator').innerHTML='<i></i> '+(currentUser?'CLOUD ACCOUNT':'LOCAL MODE');
 $('#storageStatus').textContent=currentUser?'Tasks and notes sync to your private Supabase account.':'Tasks and notes are stored on this device until you sign in.';
 $('#storageBadge').textContent=currentUser?'Cloud sync':'Local only';
 $('#cloudBadge').textContent=currentUser?'Signed in':'Sign in required';
 $('#aiStatus').textContent=currentUser?'AI requests use the protected server function when it is deployed and configured.':'Sign in and configure the server-side provider secret to enable real AI.';
 $('#aiBadge').textContent=currentUser?'Backend setup required':'Setup required';$('#assistantStatus').innerHTML='<i></i> '+(currentUser?'Signed in · AI backend setup may still be required':'Demo mode · sign in to enable AI');
 if(currentUser){await loadCloudData();await loadOwnerConsole()}else{$('#ownerNav').hidden=true;if($('#view-owner').classList.contains('active-view'))navigate('settings')}
}
async function loadCloudData(){
 try{
  const [tr,nr]=await Promise.all([
   supabaseClient.from('tasks').select('id,text,done,created_at').order('created_at',{ascending:false}),
   supabaseClient.from('notes').select('id,title,content,created_at').order('created_at',{ascending:false})
  ]);
  if(tr.error)throw tr.error;if(nr.error)throw nr.error;
  tasks=(tr.data||[]).map(t=>({id:t.id,text:t.text,done:t.done,created:t.created_at}));
  notes=(nr.data||[]).map(n=>({id:n.id,title:n.title,content:n.content,created:n.created_at}));
  cloudReady=true;store.set('tasks',tasks);store.set('notes',notes);renderTasks();renderNotes();renderStats();
  $('#storageStatus').textContent='Your tasks and notes are loaded from your private Supabase account.';
  $('#storageBadge').textContent='Cloud sync active';
 }catch(error){cloudReady=false;console.error('Cloud load failed',error);$('#storageStatus').textContent='Cloud data could not load. The database migration may not be applied yet.';$('#storageBadge').textContent='Sync error';}
}
$('#sendSignInLink').addEventListener('click',async()=>{
 const email=$('#accountEmail').value.trim();
 if(!email){$('#authMessage').textContent='Enter your email address first.';return}
 if(!supabaseClient){$('#authMessage').textContent='Supabase configuration is missing.';return}
 store.set('local_backup',{tasks,notes});$('#sendSignInLink').disabled=true;$('#authMessage').textContent='Sending your secure sign-in link…';
 const {error}=await supabaseClient.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+window.location.pathname}});
 $('#sendSignInLink').disabled=false;
 $('#authMessage').textContent=error?'Could not send the link: '+error.message:'Check your email for the ULTRON sign-in link. Open it in this browser to finish signing in.';
});
$('#signOut').addEventListener('click',async()=>{
 if(!supabaseClient)return;
 const {error}=await supabaseClient.auth.signOut();
 if(error){toast('Sign out failed.');return}
 currentUser=null;cloudReady=false;tasks=[];notes=[];store.set('tasks',[]);store.set('notes',[]);renderTasks();renderNotes();renderStats();await refreshAccount();toast('Signed out');
});
$('#importLocalData').addEventListener('click',async()=>{
 if(!currentUser||!supabaseClient)return;
 const backup=store.get('local_backup',{tasks:[],notes:[]});const localTasks=backup.tasks||[],localNotes=backup.notes||[];
 if(!localTasks.length&&!localNotes.length){toast('There is no local data to import.');return}
 if(!confirm('Import this browser’s saved tasks and notes into your signed-in ULTRON account?'))return;
 try{
  const taskRows=localTasks.map(t=>({id:t.id,text:t.text,done:!!t.done,created_at:t.created||new Date().toISOString(),user_id:currentUser.id}));
  const noteRows=localNotes.map(n=>({id:n.id,title:n.title,content:n.content,created_at:n.created||new Date().toISOString(),user_id:currentUser.id}));
  if(taskRows.length){const {error}=await supabaseClient.from('tasks').upsert(taskRows);if(error)throw error;}
  if(noteRows.length){const {error}=await supabaseClient.from('notes').upsert(noteRows);if(error)throw error;}
  await loadCloudData();localStorage.removeItem('ultron_local_backup');toast('Local data imported.');
 }catch(error){console.error(error);toast('Import failed. Check database setup and permissions.')}
});
if(supabaseClient)supabaseClient.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;setTimeout(()=>refreshAccount(),0)});
refreshAccount();
