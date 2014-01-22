var relLink = 'http://forsage.uzer.com.ua:8000';
function prevDef(ev){
	ev = ev || window.event;
	if (ev){
		ev.cancelBubble = true;
		if (ev.preventDefault){
			ev.preventDefault();
		}
		if (ev.stopPropagation){
			ev.stopPropagation();
		}
		ev.returnValue = false
	}
	return false;
}
function xClientHeight(){
	var v=0,d=document,w=window;
	if((!d.compatMode || d.compatMode == 'CSS1Compat') /* && !w.opera */ && d.documentElement && d.documentElement.clientHeight){
		v=d.documentElement.clientHeight;
	}
	else if(d.body && d.body.clientHeight){
		v=d.body.clientHeight;
	}
	else if(xDef(w.innerWidth,w.innerHeight,d.width)){
		v=w.innerHeight;
		if(d.width>w.innerWidth) v-=16;
	}
	return v;
}
document.addEventListener('DOMContentLoaded',init,false);
function init(){
	resize();
	window.addEventListener('resize',resize,false);
	document.addEventListener('mousemove',messages.mmove,false);
	window.onfocus = messages.wfocus;
	window.onblur = messages.wblur;
	document.body.addEventListener('click',function(){document.getElementById('smiliesList').style.display="none";},false);
	document.getElementById('smiliesList').addEventListener('mousewheel',function(ev){chat.scroll(document.getElementById('smiliesList'),ev);},false);
	document.getElementById('smiliesList').addEventListener('DOMMouseScroll',function(ev){chat.scroll(document.getElementById('smiliesList'),ev);},false);
	document.getElementById('users').addEventListener('mousewheel',function(ev){chat.scroll(document.getElementById('users'),ev);},false);
	document.getElementById('users').addEventListener('DOMMouseScroll',function(ev){chat.scroll(document.getElementById('users'),ev);},false);
	if (document.getElementById('attacher').files){
		document.getElementById('attacher').style.display='inline';
		document.getElementById('attach').style.display='inline';
	}
	document.getElementById('messages').style.paddingBottom = (document.getElementById('nmessage').offsetHeight+20)+'px'
	chat.init(me.settings);
}
function resize(){
	document.getElementById('hider').style.left=(document.documentElement.clientWidth-800)/2+'px';
	document.getElementById('users').style.height = (document.body.clientHeight-document.getElementById('nmessage').offsetHeight-10)+'px';
	//messages.scroll();
}
chat = {
	sr:false,
	mb:false,
	message:false,
	attachments:false,
	ts:false,
	users:new Array(),
	active:false,
	settings:{
		m:false,
	},
	init:function(settings){
		chat.mb = document.getElementById('messaget');
		messages.list = document.getElementById('messages');
		messages.ulist = document.getElementById('users');
		chat.mb.addEventListener('keydown',chat.kd,false);
		document.getElementById('smiliesList').addEventListener('click',messages.smile,false);
		settings = settings.split(',');
		var s = {};
		for (var i = 0; i < settings.length; i++){
			settings[i] = settings[i].split(':');
			s[settings[i][0]] = settings[i][1];
		}
		chat.settings.m = s.m=='1'?true:false;
		document.getElementById('mtype').innerHTML = chat.settings.m?'8':'@';
		document.getElementById('mtype').title = 'Message send: '+(chat.settings.m?'Enter':'Ctrl+Enter');
		notifier.init(s);
		messages.initSmilies();
		chat.load();
	},
	load:function(){
		var xhr = new XMLHttpRequest();
		xhr.open('POST','/chat.php',true);
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4){
				if (xhr.status==200 && xhr.responseText){
					var result = JSON.parse(xhr.responseText);
					chat.process(result);
					//console.log('data loaded and processed. queue');
					messages.list.style.textAlign='';
					messages.list.removeChild(document.getElementById('loader'));
					chat.active = true;
					chat.queue();
					messages.scroll(true);
					$(window).scroll(messages.onScroll);
				}
				else{
					//console.log('load error. try again');
					setTimeout(chat.load,5000);
				}
			}
		}
		xhr.send('last=1');
	},
	queue:function(){
		realplexor = new Dklab_Realplexor(realLink);
		realplexor.subscribe("id_"+me.id, function(){});
		realplexor.subscribe("forsage", function(data, id) {
			data = data.replace(/\\\\\\/g,'\\');
			var result = JSON.parse(data);
			chat.process(result);
			if (result.messages){
				var n = false;
				for (var i = 0; i < result.messages.length; i++){
					if (result['messages'][i]['author']['uid']!=me['uid']){
						n = true;
						break;
					}
				}
				if (n){
					messages['new']();
					notifier.notify(1,result.messages[result.messages.length-1]);
				}
				messages.completeMessages();
			}
		});
		realplexor.execute();
	},
	send:function(){
		if (chat.mb.value.match(/^\s*$/) && (chat.attachments===false || chat.attachments.length==0)) return;
		if (chat.sr) return;
		chat.message = chat.mb.value.replace(/збс/ig,'<censored>');
		chat.sr = new XMLHttpRequest();
		chat.sr.open('POST','/chat.php',true);
		chat.sr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		chat.sr.setRequestHeader('X-Requested-With','XMLHttpRequest');
		chat.sr.onreadystatechange = function(){
			if (chat.sr.readyState == 4){
				if (chat.sr.status==200 && chat.sr.responseText){
					if (chat.sr.responseText=='OK'){
						//if (!chat.qr) setTimeout(chat.queue,500);
					}
					else{
						chat.process(JSON.parse(chat.sr.responseText));
					}
					chat.message = false;
					chat.attachments = false;
					messages.refreshAttachments();
				}
				else{
					//error
					chat.mb.value=chat.message;
					chat.error('Check network connection');
				}
				chat.sr = false;
			}
		}
		//if (chat.qr) chat.qr.abort();
		var tmes = chat.message;
		if (chat.attachments!==false && chat.attachments.length > 0){
			var tat = new Array();
			for (var i = 0; i < chat.attachments.length; i++){
				tat.push(''+chat.attachments[i][0]+'.'+chat.attachments[i][1]+'')
			}
			tmes += '\n[i'+tat.join('-')+']';
		}
		chat.sr.send('post=1&message='+encodeURIComponent(tmes));
		notifier.notify(2);
		chat.mb.value = '';
		messages.addMessage({
			message:tmes,
			date:new Date().valueOf(),
			author:me,
		});
		messages.scroll(true);
		messages.completeMessages();
	},
	process:function(response){
		//parse end execute any responses;
		if (response['error']){
			switch(response['error']){
				case 'unauth':
				case 'refresh':{
					realplexor.unsubscribe("id_"+me.id);
					realplexor.unsubscribe("forsage")
					realplexor.execute();
					document.location.href="/";
				}break;
			}
		}
		if (response['users']){
			for (var i = 0; i < response['users'].length; i++){
				if (chat.users[response['users'][i]['id']]){
					if (chat.users[response['users'][i]['id']]['alive'] != response['users'][i]['alive']){
						notifier.notify(3,response['users'][i]);
					}
				}
				chat.users[response['users'][i]['id']] = response['users'][i];
			}
			messages.displayUsers(response['users']);
		}
		if (response['messages']){
			for (var i = 0; i < response['messages'].length; i++){
				if (response['messages'][i]['author']['uid']==me['uid'] && chat.active) continue;
				messages.addMessage(response['messages'][i]);
			}
			messages.scroll();
			messages.completeMessages();
		}
		if (response['online']){
			for (var i = 0; i < response['online'].length; i++){
				if (chat.users[response['online'][i]['id']]){
					if (chat.users[response['online'][i]['id']]['alive'] != response['online'][i]['on']){
						chat.users[response['online'][i]['id']]['alive'] = response['online'][i]['on'];
						notifier.notify(3,chat.users[response['online'][i]['id']]);
					}
				}
			}
			messages.displayUsers();
		}
		if (response['ts']) this.ts = response['ts'];
	},
	error:function(t){
		alert(t);
	},
	kd:function(ev){
		ev = ev || window.event;
		//console.log(ev);
		if (ev.keyCode==13){
			if (chat.settings.m){
				if (ev.ctrlKey){
					messages.inject('\n');
				}
				else{
					chat.send();
					prevDef(ev);
				}
			}
			else{
				if (ev.ctrlKey){
					chat.send();
				}
			}
		}
	},
	saveS:function(){
		var s = 'a1:'+(notifier.a1?notifier.a1:'0')+',a2:'+(notifier.a2?notifier.a2:'0')+',a3:'+(notifier.a3?notifier.a3:'0')+',s1:'+(notifier.s1?'1':'0')+',s2:'+(notifier.s2?'1':'0')+',s3:'+(notifier.s3?'1':'0')+',m:'+(chat.settings.m?'1':'0');
		chat.sr = new XMLHttpRequest();
		chat.sr.open('POST','/chat.php',true);
		chat.sr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		chat.sr.setRequestHeader('X-Requested-With','XMLHttpRequest');
		chat.sr.onreadystatechange = function(){
			if (chat.sr.readyState == 4){
				if (chat.sr.status==200 && chat.sr.responseText){
					if (chat.sr.responseText=='OK'){
						chat.sr = false;
						//if (!chat.qr) setTimeout(chat.queue,500);
					}
					else{
						chat.process(JSON.parse(chat.sr.responseText));
					}
				}
				else{
					//error
					chat.error('Check network connection');
				}
			}
		}
		//if (chat.qr) chat.qr.abort();
		chat.sr.send('save=1&settings='+encodeURIComponent(s));
	},
	toggleM:function(){
		chat.settings.m = chat.settings.m?false:true;
		chat.saveS();
		document.getElementById('mtype').innerHTML = chat.settings.m?'8':'@';
		document.getElementById('mtype').title = 'Message send: '+(chat.settings.m?'Enter':'Ctrl+Enter');
	},
	scroll:function(el,ev){
		ev = ev || window.event;
		//console.log(ev);
		//console.log(this);
		var delta = 0;
		if (ev.wheelDelta) { 
			delta = ev.wheelDelta;
		} else if (ev.detail) { 
			delta = -ev.detail*40;
		}
		if (delta) {
			if (ev.preventDefault) {
				ev.preventDefault();
			}
			ev.returnValue = false;
			el.scrollTop -= delta;
		}
	}
};
messages = {
	smilies: true,
	list:false,
	ulist:false,
	unread:false,
	focus:true,
	pops:new Array(),
	createMessageBlock:function(params){
		var d = document.createElement('DIV');
		d.className='message';
		d.mid = params['id'];
		d.innerHTML = '<div class="message_photo"><img src="'+params['author']['photo']+'"></div>\
		<div class="message_content">\
			<div class="message_author">\
				<span class="message_date">'+messages.formatDate(params['date'])+'</span> <a href="http://vk.com/id'+params['author']['uid']+'" class="message_author_link" onClick="messages.reffer('+params['author']['id']+');return false;">'+params['author']['name']+'</a>\
			</div>\
			<div class="message_body">\
				'+params['message']+'\
			</div>\
		</div>\
		';
		return d;
	},
	parseMessage:function(message){
		//return message;
		while(message.indexOf('\n')>-1){
			message = message.replace('\n','<br/>');
		}
		if (message.match(/[\'\"\/]?(https?:\/\/)?[a-zA-Zа-яА-Я0-9][-a-zA-Zа-яА-Я0-9\.]+\.[a-z]{2,6}(\/[^\s\<\>]*)?\/?[\'\"]?/)){
			var urls = message.match(/[\'\"\/]?(https?:\/\/)?[a-zA-Zа-яА-Я0-9][-a-zA-Zа-яА-Я0-9\.]+\.[a-z]{2,6}(\/[^\s\<\>]*)?\/?[\'\"]?/g);
			for (var i = 0; i < urls.length; i++){
				if (urls[i].substr(0,1)=='"' || urls[i].substr(0,1)=="'" || urls[i].substr(0,1)=="/" || urls[i].match(/i\d+\.[pPnNgGiIfGjJ]+/)) continue;
				message = message.replace(urls[i],'<a href="'+(urls[i].substr(0,4)!='http'?'http://':'')+urls[i]+'" target="_new">'+urls[i]+'</a>');
			}
		}
		while(message.match(/\[u(\d+)(\|([^\]]+))?\]/)){
			var i = message.match(/\[u(\d+)(\|([^\]]+))?\]/)[1];
			var j = message.match(/\[u(\d+)(\|([^\]]+))?\]/)[3];
			var k = message.match(/\[u(\d+)(\|([^\]]+))?\]/)[0];
			message = message.replace(k,'<a class="uToolTip" uid="'+i+'" href="http://vk.com/id'+chat.users[i].uid+'" onClick="return false">'+(j?j:chat.users[i].first_name)+'</a>');
		}
		if(message.match(/\[i([-0-9pPnNgGiIfGjJ\.]+)\]/)){
			var is = message.match(/\[i([-0-9pPnNgGiIfFjJ\.]+)\]/)[1];
			//console.log(is);
			var tis = is.split('-');
			var tt = '<center>';
			for (var i = 0; i < tis.length; i++){
				tis[i] = tis[i].split('.');
				if (!tis[i][1]) tis[i][1] = 'jpg';
				tt+='<a href="uploads/'+tis[i][0]+'.'+tis[i][1]+'" target="_new" onClick="messages.viewPic(this);return false"><img src="uploads/'+tis[i][0]+'p.jpg" alt="[Изображение]" /></a>';
			}
			tt += '</center>';
			message = message.replace(/\[i([-0-9pPnNgGiIfFjJ\.]+)\]/,tt);
		}
		if (messages.smilies){
			message = message.replace(messages.smilesExp, function(name){
				return "<img src='/img/smilies/" + messages.leadingZero(messages.smiliesIndex[name]) + ".gif' title='"+name+"' alt='" + name + "'/>";
			});
		}
		return message;
	},
	addMessage:function(message){
		if (!message['message']) return;
		message['message'] = messages.parseMessage(message['message']);
		mbl = messages.createMessageBlock(message);
		messages.list.appendChild(mbl);
	},
	completeMessages:function(){
		$('.uToolTip[uid]').each(function(eid,eel){
			var uid = eel.getAttribute('uid');
			eel.removeAttribute('uid');
			var w = $(eel).width();
			eel.appendChild(messages.createUserTooltipBlock(uid));
			$(eel).width(w);
			$('span',eel).get(0).style.display='none';
			$(eel).hover(function(){
				$('span',this).get(0).style.display='block';
				var that = this;
				setTimeout(function(){
					$('span',that).css({
						'opacity':1,
						'-webkit-transform': 'translateY(10px)',
						'-moz-transform': 'translateY(10px)',
						'-ms-transform': 'translateY(10px)',
						'-o-transform': 'translateY(10px)',
						'transform': 'translateY(10px)',
					});
				},50);
			},function(){
				$('span',this).css({
					'opacity':0,
					'-webkit-transform': 'translateY(0px)',
					'-moz-transform': 'translateY(0px)',
					'-ms-transform': 'translateY(0px)',
					'-o-transform': 'translateY(0px)',
					'transform': 'translateY(0px)',
				});
				var that = this;
				setTimeout(function(){
					$('span',that).get(0).style.display = 'none';
				},300);
			});
		});
	},
	createUserTooltipBlock:function(uid){
		var t = document.createElement('SPAN');
		t.innerHTML = '<div class="uTPhoto"><img src="'+chat.users[uid].photo+'" /></div><div class="uTName">'+chat.users[uid].name+'</div>';
		return t;
	},
	formatDate:function(date){
		date = date*1;
		var d = new Date(date);
		var cd = new Date();
		var result = '';
		if (cd.getDate()!=d.getDate()){
			result += d.getDate()+'.'+messages.leadingZero(d.getMonth()+1)+' ';
		}
		result += messages.leadingZero(d.getHours())+':'+messages.leadingZero(d.getMinutes());
		return result;
	},
	leadingZero:function(s){
		s = s+'';
		if (s.length < 2) s = '0'+s;
		return s;
	},
	scroll:function(def){
		//document.body.scrollTop = document.documentElement.offsetHeight;
		setTimeout(function(){
			if ((document.body.scrollHeight-document.body.scrollTop)<=(xClientHeight()+400) || def)
				document.body.scrollTop = document.body.scrollHeight;
		},100);
	},
	displayUsers:function(){
		var users = chat.users.slice();
		users.sort(function(a,b){return (a['name']>b['name'])?1:-1;});
		messages.ulist.innerHTML = '';
		var ulist1 = new Array();
		var ulist2 = new Array();
		var un = 0;
		for (var i = 0; i < users.length; i++){
			if (users[i] && (users[i].hide==0)){
				if (users[i]['alive']) ulist1.push(users[i]);
				else ulist2.push(users[i]);
			}
		}
		for (var i = 0; i < ulist1.length; i++){
			un++;
			var ub = messages.createUserBlock(ulist1[i],un);
			messages.ulist.appendChild(ub);
		}
		for (var i = 0; i < ulist2.length; i++){
			un++;
			var ub = messages.createUserBlock(ulist2[i],un);
			messages.ulist.appendChild(ub);
		}
	},
	createUserBlock: function(user,n){
		var d = document.createElement('DIV');
		d.className='user_row';
		d.innerHTML = '<div class="user_alive alive'+(user['alive']?1:0)+'">'+n+'</div><a class="user_name" onClick="messages.reffer('+user['id']+');return false" href="http://vk.com/id'+user['uid']+'">'+user['name']+'</a>';
		return d;
	},
	mmove:function(ev){
		ev = ev || window.event;
		//console.log(ev);
		messages.read();
	},
	'new':function(){
		if (!messages.unread && !messages.focus){
			messages.unread = true;
			messages.toggler();
		}
	},
	toggler:function(){
		if (document.title!='Forsage') document.title='Forsage';
		else{
			if (messages.unread){
				document.title='[1] Nes message';
			}
		}
		if (messages.unread){
			setTimeout(messages.toggler,750);
		}
	},
	read:function(l){
		messages.unread = false;
		document.title='Forsage';
		if (!l){
			setTimeout(function(){messages.read(true);},100);
		}
	},
	initSmilies:function(){
		var st = document.createElement('TABLE');
		var j = 0;
		var k = -1;
		for (var i = 1; i < messages.smiliesList.length; i++){
			if (j==0){
				st.appendChild(document.createElement('TR'));
				k++;
			}
			st.rows[k].appendChild(document.createElement('TD'));
			st.rows[k].cells[j].innerHTML = '<img src="img/smilies/'+messages.leadingZero(i)+'.gif" sid="'+i+'" />';
			j++;
			if (j > 6) j = 0;
		}
		document.getElementById('smiliesList').appendChild(st);
		document.getElementById('smiliesList').style.left=(document.documentElement.clientWidth-document.getElementById('smiliesList').offsetWidth)/2+'px';
	},
	showSmilies:function(){
		setTimeout(function(){document.getElementById('smiliesList').style.display="block";},10);
	},
	smile:function(ev){
		ev = ev || window.event;
		//console.log(ev);
		document.getElementById('smiliesList').style.display="none";
		if (ev.target.tagName.toUpperCase()=='IMG'){
			messages.inject(messages.smiliesList[ev.target.getAttribute('sid')*1][0]);
		}
	},
	reffer:function(id){
		if (chat.users[id]){
			messages.inject('[u'+id+'|'+chat.users[id].first_name+'], ');
		}
	},
	inject:function(t){
		chat.mb.focus();
		var st = chat.mb.selectionStart;
		var en = chat.mb.selectionEnd;
		chat.mb.value = chat.mb.value.substr(0,st)+t+chat.mb.value.substr(en);
	},
	attach:function(el){
		if (el.files[0]){
			el.style.display="none";
			document.getElementById('attach').src="img/loaderw.gif";
			var fd = new FormData();
			fd.append('thefile',el.files[0]);
			var xhr = new XMLHttpRequest();
			xhr.open('POST','upload.php',true);
			xhr.onreadystatechange=function(){
				if (xhr.readyState==4){
					el.style.display="inline";
					document.getElementById('attach').src="img/img.gif";
					var r = JSON.parse(xhr.responseText);
					if (r.error) alert(r.error)
					else{
						if (chat.attachments===false) chat.attachments = new Array();
						chat.attachments.push([r.id,r.ext,r.size]);
						messages.refreshAttachments();
					}
				}
			}
			xhr.send(fd);
		}
	},
	refreshAttachments:function(){
		document.getElementById('attachments').innerHTML = '';
		if (chat.attachments!==false && chat.attachments.length > 0){
			document.getElementById('attachments').style.display='block';
			for (var i = 0; i < chat.attachments.length; i++){
				document.getElementById('attachments').appendChild(messages.createAttachmentBlock(i));
			}
		}
		else{
			chat.attachments = false;
			document.getElementById('attachments').style.display='none';
		}
		document.getElementById('messages').style.paddingBottom = (document.getElementById('nmessage').offsetHeight+20)+'px'
	},
	createAttachmentBlock:function(attach){
		var d = document.createElement('DIV');
		d.className='attach';
		d.style.display='inline-block';
		d.id='attach_'+attach;
		d.style.width=chat.attachments[attach][2][0]+'px';
		d.style.height=chat.attachments[attach][2][1]+'px';
		d.innerHTML = '<span class="attach_remove" aid="'+attach+'" onClick="messages.removeAttach(this)" title="Remove">X</span><img src="uploads/'+chat.attachments[attach][0]+'s.jpg" width="'+chat.attachments[attach][2][0]+'" height="'+chat.attachments[attach][2][1]+'" />';
		return d;
	},
	removeAttach:function(el){
		chat.attachments.splice(el.getAttribute('aid'),1);
		messages.refreshAttachments();
	},
	generatePopup:function(data){
		
	},
	showPopup:function(data){
		var p = messages.generatePopup();
	},
	wfocus:function(){
		setTimeout(function(){messages.focus = true;messages.read();},20);
	},
	wblur:function(){
		messages.focus = false;
	},
	onScroll:function(e){
		if ($(window).scrollTop()<500 && !messages.loading && !messages.loaded){
			messages.loading = true;
			var lb = $('.message:eq(0)');
			$('#messages').prepend('<div id="loading" style="text-align:center;"><img src="/img/loaderw.gif" /></div>')
			$.ajax({
				url:'/chat.php',
				data:{load:1,id:$('.message:eq(0)')[0].mid},
				type:'POST',
				dataType:'json',
				success:function(r){
					$('#loading').remove();
					var msms = [];
					for (var i = 0; i < r.messages.length; i++){
						var message = r.messages[i];
						if (message.message) message.message = messages.parseMessage(message.message);
						msms.push(messages.createMessageBlock(message))
					}
					$('#messages').prepend(msms);
					$(window).scrollTop(lb.offset().top);
					if (r.messages.length==0) messages.loaded = true;
					else messages.loading = false;
				},
				failure:function(){
					$('#loading').remove();
				}
			});
		}
	},
	viewPic:function(el){
		debugger;
		var picFade = document.createElement('DIV');
		picFade.className = 'fade';
		$('body').append(picFade);
		var prbc = document.createElement('DIV');
		prbc.className = 'pic';
		prbc.innerHTML = '<div class="close">X</div>';
		$('body').append(prbc);
		var h = $(prbc).height();
		var w = $(prbc).width();
		var i = document.createElement('IMG');
		i.src = el.href;
		i.style.maxHeight = (h-50)+'px';
		i.style.maxWidth = (w-50)+'px';
		prbc.appendChild(i);
		$('.close').click(function(){
			$('.fade,.pic').remove();
		});
	}
};
notifier = {
	a1:false,
	s1:false,
	a2:false,
	s2:false,
	a3:false,
	s3:false,
	st:0,
	n1:false,
	n2:false,
	n3:false,
	notifs:new Array(),
	init:function(props){
		//console.log(props);
		if (!window.webkitNotifications){
			//document.getElementById('snotif').style.display='none';
		}
		else{
			if (props.s1=='1'){
				notifier.s1 = true;
			}
			else{
				document.getElementById('snotif1').style.color='#AAAAAA';
			}
			if (props.s2=='1'){
				notifier.s2 = true;
			}
			else{
				document.getElementById('snotif2').style.color='#AAAAAA';
			}
			if (props.s3=='1'){
				notifier.s3 = true;
			}
			else{
				document.getElementById('snotif3').style.color='#AAAAAA';
			}
		}
		notifier.a1 = props.a1;
		if (notifier.a1=='0'){
			document.getElementById('anotif1').style.color='#AAAAAA';
		}
		else{
			document.getElementById('a1s').style.display='inline';
			document.getElementById('a1s').selectedIndex = notifier.a1-1;
			document.getElementById('an1').src = 'sounds/'+notifier.a1+'.mp3';
		}
		notifier.a2 = props.a2;
		if (notifier.a2=='0'){
			document.getElementById('anotif2').style.color='#AAAAAA';
		}
		else{
			document.getElementById('a2s').style.display='inline';
			document.getElementById('a2s').selectedIndex = notifier.a2-1;
			document.getElementById('an2').src = 'sounds/'+notifier.a2+'.mp3';
		}
		notifier.a3 = props.a3;
		if (notifier.a3=='0'){
			document.getElementById('anotif3').style.color='#AAAAAA';
		}
		else{
			document.getElementById('a3s').style.display='inline';
			document.getElementById('a3s').selectedIndex = notifier.a3-1;
			document.getElementById('an3').src = 'sounds/'+notifier.a3+'.mp3';
		}
		notifier.n1 =  document.getElementById('an1');
		notifier.n2 =  document.getElementById('an2');
		notifier.n3 =  document.getElementById('an3');
	},
	toggleA:function(el){
		notifier[el.getAttribute('sid')] = notifier[el.getAttribute('sid')] ? false : document.getElementById(el.getAttribute('sid')+'s').options[document.getElementById(el.getAttribute('sid')+'s').selectedIndex].value;
		el.style.color = (notifier[el.getAttribute('sid')] ? '#000000' : '#AAAAAA');
		document.getElementById(el.getAttribute('sid')+'s').style.display = (notifier[el.getAttribute('sid')] ? 'inline' : 'none');
		if (notifier[el.getAttribute('sid')]){
			document.getElementById('an'+el.getAttribute('sid').substr(1)).src='sounds/'+document.getElementById(el.getAttribute('sid')+'s').options[document.getElementById(el.getAttribute('sid')+'s').selectedIndex].value+'.mp3';
		}
		return false;
	},
	toggleS:function(el){
		notifier[el.getAttribute('sid')] = notifier[el.getAttribute('sid')] ? false : true;
		el.style.color = (notifier[el.getAttribute('sid')] ? '#000000' : '#AAAAAA');
		if (window.webkitNotifications.checkPermission()!=0){
			window.webkitNotifications.requestPermission();
		};
		return false;
	},
	notify:function(i,message){
		if (notifier['a'+i]){
			notifier['n'+i].play&&notifier['n'+i].play();
		}
		if (notifier['s'+i]){
			if (i==1){
				if (!messages.focus){
					//var m = message['message'];
					var hm = document.createElement('DIV');
					hm.innerHTML = message['message'];
					//var ims = m.match(/\<[^\>]*alt=\"([^\>\"]*)\"[^\>]*\>/g);
					var ims = hm.getElementsByTagName('img');
					if (ims.length > 0)
						for (var i = 0; i < ims.length; i++){
							if (ims[i].getAttribute('alt')){
								ims[i].outerHTML = ims[i].getAttribute('alt');
								i--;
							}
							//m = m.replace(ims[i],ims[i].match(/\<[^\>]*alt=\"([^\>\"]*)\"[^\>]*\>/)[1]);
						}
					var m = hm.innerHTML.replace(/(\<[^\>]*\>)/g,'').replace(/\&\#\d+\;?/g,'');
					var nid = notifier.notifs.length;
					notifier.notifs[nid] = window.webkitNotifications.createNotification(message['author']['photo'], 'Forsage » '+message['author']['name'], m);
					notifier.notifs[nid].show();
					setTimeout(function(){notifier.notifs[nid].close();notifier.notifs.splice(nid,0);},7000);
				}
			}
			else if (i==3){
				var nid = notifier.notifs.length;
				notifier.notifs[nid] = window.webkitNotifications.createNotification(message['photo'], 'Forsage', message['name']+(message['alive']=='1'?' enter chat.':' leave chat.'));
				notifier.notifs[nid].show();
				setTimeout(function(){notifier.notifs[nid].close();notifier.notifs.splice(nid,0);},7000);
			}
		}
	},
	settings:function(){
		document.getElementById('nsettings').style.left=(document.documentElement.clientWidth)/2+'px';
		document.getElementById('nsettings').style.display='block';
	},
	closes:function(){
		chat.saveS();
		document.getElementById('nsettings').style.display='none';
	},
	updateA:function(el){
		document.getElementById('pre').src='sounds/'+el.options[el.selectedIndex].value+'.mp3';
		document.getElementById('pre').play();
		notifier[el.getAttribute('sid')] = el.options[el.selectedIndex].value;
		notifier['n'+el.getAttribute('sid').substr(1)].src='sounds/'+el.options[el.selectedIndex].value+'.mp3';
	},
};
messages.smiliesList = new Array(
'',
['O:-)','O=)'],
[':-)',':)','=)'],
[':-(',':('],
[';-)',';)'],
[':-P',':-Р',':-р',':-p'],
['8-)'],
[':-D',':D'],
[':-['],
['=-O'],
[':-*'],
[':\'('],
[':-X',':-x'],
['>:o'],
[':-|'],
[':-\\',':-/'],
['*JOKINGLY*'],
[']:->'],
['[:-}'],
['*KISSED*'],
[':-!'],
['*TIRED*'],
['*STOP*'],
['*KISSING*'],
['@}->--'],
['*THUMBS UP*'],
['*DRINK*'],
['*IN LOVE*'],
['@='],
['*HELP*'],
['\\m/'],
['%)'],
['*OK*'],
['*WASSUP*','*SUP*'],
['*SORRY*'],
['*BRAVO*'],
['*ROFL*','*LOL*'],
['*PARDON*'],
['*NO*'],
['*CRAZY*'],
['*DONT_KNOW*','*UNKNOWN*'],
['*DANCE*'],
['*YAHOO*','*YAHOO!*'],
['*HI*','*PREVED*','*PRIVET*','*HELLO*'],
['*BYE*'],
['*YES*'],
[';D','*ACUTE*'],
['*WALL*','*DASH*'],
['*WRITE*','*MAIL*'],
['*SCRATCH*'],
['<censored>','<CENSORED>','*CENSORED*'],
['*EVIL*','*WICKED*'],
['*FACEPALM*'],
['*NONO*'],
['*WHISTLE*','*SING*'],
['*SARCASTIC*'],
['*TEASE*'],
['*FRIENDS*'],
['*SMOKE*'],
['*DANCE2*'],
['*SLEEP*'],
['*GIMMEFIVE*'],
['*URRA*']
);
messages.smiliesIndex = {};
messages.smiliesFullList = new Array();
for (var i = 1; i < messages.smiliesList.length; i++){
	for (var j = 0; j < messages.smiliesList[i].length; j++){
		messages.smiliesIndex[messages.smiliesList[i][j]] = i;
		messages.smiliesFullList.push(messages.smiliesList[i][j]);
	}
}
messages.smilesExp = new RegExp(messages.smiliesFullList.sort(function(a, b) {
	return a.length > b.length ? 1 : -1;
}).map(function(smile) {
	return smile.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}).join('|'), 'g');

//regexpify str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
