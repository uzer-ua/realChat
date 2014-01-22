<?php
chdir(dirname(__FILE__));
require 'db.php';
require "realplexor.php";
$rpl = new Dklab_Realplexor("127.0.0.1","10010");
$sql = "SELECT * FROM system";
$pos = $db->select($sql);
$pos = $pos[0]['pos'];
$ts = time();
$result = array();
while (time()-$ts<58){
	$c = false;
	$result['online'] = array();
	foreach ($rpl->cmdWatch($pos, "id_") as $event) {
		print_r($event);
		if ($event['event']!='FAKE'){
			$c = true;
			preg_match('/^id\_(\d+)$/',$event['id'],$uid);
			$uid = $uid[1];
			$result['online'][] = array('id'=>$uid,'on'=>(($event['event']=='online')?1:0));
		}
		$pos = $event['pos'];
		$sql = "UPDATE system SET pos = '".$pos."'";
		$db->update($sql);
	}
	if ($c)
		$rpl->send("forsage", json_encode($result));
	sleep(5);
}
?>