<?php
header('Content-Type: text/html; charset=utf-8');
//if (!session_id()) session_start();
include('db.php');
include('session.php');
ob_implicit_flush();
//unset($_SESSION['id']);die;
//auth and verifications
$result = array();
if (!isset($SESSION['id'])){
	$result['error'] = 'unauth';
	echo json_encode($result);
	die;
}
//post new message
if (isset($_REQUEST['post'])){
	//$_REQUEST['message'] = htmlspecialchars($_REQUEST['message'],ENT_QUOTES,'UTF-8');
	$sql = "INSERT INTO `chat` (`message`,`date`,`id_users`) VALUES ('".mysql_real_escape_string($_REQUEST['message'])."','".time()."','".$SESSION['id']."')";
	$nid = $db->insert($sql);
	$sql = "UPDATE `users` SET `last_active` = ".time()." WHERE `id_users` = ".$SESSION['id'];
	$db->update($sql);
	require_once "realplexor.php";
	$rpl = new Dklab_Realplexor("127.0.0.1","10010");
	$result = array(
		'messages'=>array(
			0=>array(
				'id'=>$nid,
				'message'=>$_REQUEST['message'],
				'date'=>time().'000',
			),
		),
	);
	$sql = "SELECT * FROM `users` ORDER BY `name` ASC";
	$users = $db->select($sql);
	foreach ($users as $user){
		if ($user['id_users']==$SESSION['id']){
			$result['messages'][0]['author'] = array(
				'id'=>$user['id_users'],
				'name'=>$user['name'],
				'first_name'=>$user['first_name'],
				'last_name'=>$user['last_name'],
				'photo'=>$user['photo'],
				'uid'=>$user['uid'],
			);
		}
	}
	$rpl->send("forsage", json_encode($result));
	echo 'OK';
	die;
}
//load last messages (firs page load)
if (isset($_REQUEST['last'])){
	$result = array('ts'=>time(),'messages'=>array(),'users'=>array());
	$sql = "UPDATE `users` SET `last_active` = ".time()." WHERE `id_users` = ".$SESSION['id'];
	$db->update($sql);
	$sql = "SELECT * FROM `users` ORDER BY `name` ASC";
	$users = $db->select($sql);
	foreach ($users as $user){
		$result['users'][] = array(
			'name'=>$user['name'],
			'first_name'=>$user['first_name'],
			'last_name'=>$user['last_name'],
			'photo'=>$user['photo'],
			'uid'=>$user['uid'],
			'alive'=>((time()-$user['last_active'])>90)?0:1,
			'id'=>$user['id_users'],
			'hide'=>$user['hide'],
		);
	}
	require_once "realplexor.php";
	$rpl = new Dklab_Realplexor("127.0.0.1","10010");
	$list = $rpl->cmdOnline(array("id_"));
	foreach ($list as $l){
		preg_match('/^id\_(\d+)$/',$l,$uid);
		$uid = $uid[1];
		foreach($result['users'] as &$uv){
			if ($uv['id']==$uid){
				$uv['alive'] = 1;
			}
		}
	}
	$sql = "SELECT * FROM `chat` LEFT JOIN `users` ON `users`.`id_users` = `chat`.`id_users` ORDER BY `id_chat` DESC LIMIT 50";
	$messages = $db->select($sql);
	if ($messages)
	for ($i = count($messages)-1; $i >=0; $i--){
		$message = $messages[$i];
		$result['messages'][] = array(
			'id'=>$message['id_chat'],
			'message'=>$message['message'],
			'date'=>$message['date'].'000',
			'author'=>array(
				'id'=>$message['id_users'],
				'name'=>$message['name'],
				'first_name'=>$message['first_name'],
				'last_name'=>$message['last_name'],
				'photo'=>$message['photo'],
				'uid'=>$message['uid'],
			),
		);
		$result['ts'] = $message['date'];
	}
	echo json_encode($result);
	die;
}
//load previous messages
if (isset($_REQUEST['load']) && isset($_REQUEST['id'])){
	$id = (int)$_REQUEST['id'];
	$result = array('messages'=>array());
	if ($id){
		$sql = "SELECT * FROM `chat` LEFT JOIN `users` ON `users`.`id_users` = `chat`.`id_users` WHERE `id_chat` < ".$id." ORDER BY `id_chat` DESC LIMIT 50";
		$res = $db->select($sql);
		$messages = $db->select($sql);
		if ($messages)
		for ($i = count($messages)-1; $i >= 0 ; $i--){
			$message = $messages[$i];
			$result['messages'][] = array(
				'id'=>$message['id_chat'],
				'message'=>$message['message'],
				'date'=>$message['date'].'000',
				'author'=>array(
					'id'=>$message['id_users'],
					'name'=>$message['name'],
					'first_name'=>$message['first_name'],
					'last_name'=>$message['last_name'],
					'photo'=>$message['photo'],
					'uid'=>$message['uid'],
				),
			);
			$result['ts'] = $message['date'];
		}
	}
	echo json_encode($result);
	die;
}
//save user settings
if (isset($_REQUEST['save'])){
	$sql = "UPDATE `users` SET `settings` = '".mysql_real_escape_string(urldecode($_REQUEST['settings']))."', `last_active` = ".time()." WHERE `id_users` = ".$SESSION['id'];
	$db->update($sql);
	
	$SESSION['settings'] = urldecode($_REQUEST['settings']);
	echo 'OK';
	die;
}
?>