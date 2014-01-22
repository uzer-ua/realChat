<?php
chdir(dirname(__FILE__));
require_once "realplexor.php";
$rpl = new Dklab_Realplexor("127.0.0.1","10010");
$result = array();
$result['error'] = 'unauth';
$rpl->send("forsage", json_encode($result),array('id_20088379'));
?>