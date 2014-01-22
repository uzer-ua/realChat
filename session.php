<?php
	$SESSION = array();
	if (isset($_COOKIE['forsagesid'])){
		$sql = "SELECT * FROM `users` WHERE `sid` = '".$_COOKIE['forsagesid']."'";
		$res = $db->select($sql);
		if (count($res)>0){
			$SESSION['name'] = $res[0]['name'];
			$SESSION['fisrt_name'] = $res[0]['first_name'];
			$SESSION['last_name'] = $res[0]['last_name'];
			$SESSION['photo'] = $res[0]['photo'];
			$SESSION['last_active'] = time();
			$SESSION['settings'] = $res[0]['settings'];
			$SESSION['id'] = $res[0]['id_users'];
			$SESSION['uid'] = $res[0]['uid'];
			if ($res[0]['lcheck'] && ((time()-$res[0]['lcheck'])<28) && isset($_REQUEST['check']) && $_REQUEST['check']==1) die;
			setcookie('forsagesid',$_COOKIE['forsagesid'],time()+86400*5,'/');
			setcookie('forsagesid',$_COOKIE['forsagesid'],time()+86400*5,'/m/');
		}
		else{
			setcookie('forsagesid');
		}
	}
?>