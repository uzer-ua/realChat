<?php
header('Content-Type: text/html; charset=utf-8');
//if (!session_id()) session_start();
//unset($_SESSION['id']);die;
require('config.php');
require('db.php');
include('session.php');
//auth and verificatoins
if (isset($SESSION['id'])){
	if (isset($SESSION['uid'])){
		$sql = "SELECT * FROM `white_list` WHERE `id` = ".$SESSION['uid'];
		$res = $db->select($sql);
		if (count($res)==0){
			echo '<b>Access denied.</b>';
			die;
		}
	}
}
if (!isset($SESSION['id'])){
	if (isset($_REQUEST['error'])){
		echo 'VK error: '.$_REQUEST['error_description'];
		die;
	}
	if (isset($_REQUEST['code'])){
		if (!preg_match('/[0-9a-f]+/',$_REQUEST['code'])) die;
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
		curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT6.1;WOW64) AppleWebKit/53519 (KHTML, like Gecko) Chrome/18.0.1025.142 Safari/535.19');
		curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate,sdch');
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
			'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language: en-US;q=0.9,en;q=0.8',
			'Accept-Charset: utf-8,windows-1251;q=0.7,*;q=0,3',
			'Connection: keep-alive',
		));
		curl_setopt($ch, CURLOPT_URL,'https://oauth.vk.com/access_token?client_id='.$APP.'&client_secret='.$APP_KEY.'&code='.$_REQUEST['code'].'&redirect_uri='.urlencode($SITE));
		$res = json_decode(curl_exec($ch),true);
		if (isset($res['error'])){
			echo 'Unexpected auth error. :-(<br/>';
			if ($res['error']=='invalid_grant'){
				echo 'Maybe, you use some old link. Be sure, you using direct link <a href="'.$SITE.'">'.$SITE.'</a>';
			}
			echo '<br/><br/><b>Debug:</b><br/>';
			print_r($res);
			die;
		}
		else{
			$at = $res['access_token'];
			$uid = $res['user_id'];
			$sql = "SELECT * FROM `white_list` WHERE `id` = ".$res['user_id'];
			$rres = $db->select($sql);
			if (count($rres)==0){
				echo '<b>Access denied.</b>';
				echo '<br/><br/><b>Debug:</b><br/><pre>';
				print_r($res);
				echo '</pre>';
				die;
			}
			$sql = "SELECT * FROM `users` WHERE `uid` = ".$uid;
			$res = $db->select($sql);
			if (count($res)==0){
				curl_setopt($ch, CURLOPT_URL,'https://api.vk.com/method/users.get?uid='.$uid.'&fields=first_name,last_name,photo&access_token='.$at);
				$res = json_decode(curl_exec($ch),true);
				if (isset($res['error'])){
					echo 'Unexpected auth error. :-(<br/>';
					if ($res['error']['error_code']==5){
						echo 'Seems, you denied access for VK app. Please, follow VK - Applications - Settings, find application '.$APP_NAME.', remove it and try again. If this not helps, try terminate all sessions in VK - Settings - Activity History.';
					}
					echo '<br/><br/><b>DEBUG:</b><br/>';
					print_r($res);
					die;
				}
				else{
					$res = $res['response'][0];
					$sid = md5(time());
					$sql = "INSERT INTO `users` (`uid`,`name`,`first_name`,`last_name`,`photo`,`last_active`,`settings`,`sid`) VALUES ('".$uid."','".mysql_real_escape_string($res['first_name'].' '.$res['last_name'])."','".mysql_real_escape_string($res['first_name'])."','".mysql_real_escape_string($res['last_name'])."','".$res['photo']."','".time()."','a1:0,a2:0,a3:0,s1:0,s2:0,s3:0,m:0','".$sid."')";
					$db->insert($sql);
					setcookie('forsagesid',$sid,time()+86400,'/');
				}
			}
			else{
				$sid = md5(time());
				$sql = "UPDATE `users` SET `sid` = '".$sid."' WHERE `id_users` = ".$res[0]['id_users'];
				$db->update($sql);
				setcookie('forsagesid',$sid,time()+86400,'/');
			}
			header('Location: /');
			die;
		}
		die;
	}
	else{
		echo '<b></b><br/><img src="/img/vk.png" style="cursor:pointer" onClick="document.location.replace(\'https://oauth.vk.com/authorize?client_id='.$APP.'&scope=&redirect_uri='.urlencode($SITE).'&response_type=code\');" />';
		die;
	}
}
//chat
if (isset($SESSION['id'])){
	//Display chat
	require('tpl.php');
	$tpl = new TemplatePower(dirname(__FILE__).'/tpl/index.html');
	$tpl->prepare();
	$tpl->assign(array(
		'id'=>$SESSION['id'],
		'uid'=>$SESSION['uid'],
		'name'=>$SESSION['name'],
		'photo'=>$SESSION['photo'],
		'settings'=>$SESSION['settings'],
		't'=>time(),
	));
	$tpl->printToScreen();
}
?>