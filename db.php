<?php
define("MAX_BUFFER_SIZE", 8000);
class db_connect {
    var $showSQL=0;
    var $DBHost = "";
    var $DBUser = "";
    var $DBPass = "";
    var $DBName = "";
    var $pid;
    var $debug;
    var $exec = true;
    var $foundRows;
    var $lastErrorNo = 0;
    var $lastErrorMEssage = "";
    var $isErrorDublicate = false;
    var $counter = 0;
    var $qLog;
    var $mysqlResult;
    function db_connect($user, $pass, $db, $host) {
        $this->DBHost = $host;
        $this->DBUser = $user;
        $this->DBPass = $pass;
        $this->DBName = $db;
        $this->debug = false;
        $this->login();
    }
    function login() {
        @$this->pid = mysql_connect($this->DBHost, $this->DBUser, $this->DBPass);
        if (mysql_error()) {
			echo '<b>Database error:</b> '.mysql_error();
			die;
        }
	    @mysql_select_db($this->DBName, $this->pid);
	    if (mysql_error($this->pid)) {
        	echo '<b>Database error:</b> '.mysql_error($this->pid);
        	die;
	    }
	    return true;
    }
    function logoff() {
        return mysql_close($this->pid);
    }
    function select($qstr, $dump = false, $id="")
	{
		//if(defined("DB_DEBUG") && DB_DEBUG) echo $qstr."<br><br>";
		if($this->showSQL) echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
		if ($tmp = @mysql_query($qstr, $this->pid))
		{
			$res = array();
			while ($row = mysql_fetch_assoc($tmp))
			{
				if($id)
				{
					$res[$row[$id]] = $row;
				}
				else
				{
					array_push($res, $row);
				}
			}
			if ($dump)
			{
				$names = array();
                for ($i = 0; $i < mysql_num_fields($tmp); $i++) {
                    $names[] = mysql_field_name($tmp, $i);
                }
                echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
                $this->dumpResult($names, $res);
            }
            mysql_free_result($tmp);
			if (preg_match("/SQL_CALC_FOUND_ROWS/", $qstr))
			{
				$count_result = mysql_fetch_assoc(mysql_query("Select FOUND_ROWS() as cnt"));
				$this->foundRows = $count_result["cnt"];
			}
            return $res;
        } else {
            $this->lastErrorNo = mysql_errno();
            $this->lastErrorMEssage = mysql_error();
            $this->isErrorDublicate = (1062 == $this->lastErrorNo);
          if ($this->debug) {
              echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
              echo '<p style="color:red; font-weight:bold"><b>Error:</b> '.mysql_error().'</p>';
              return false;
          }
        }
    }
    function selectBuffer($qstr) {
    if($this->showSQL) echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
        $this->counter++;
        if ($this->mysqlResult = @mysql_query($qstr, $this->pid)) {
            return true;
        } elseif ($this->debug) {
            echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
            echo '<p style="color:red; font-weight:bold"><b>Error:</b> '.mysql_error().'</p>';
            return false;
        }
    }
    function readBuffer() {
        $i = 0;
        $res = array();
        while ((++$i < MAX_BUFFER_SIZE) && ($row = mysql_fetch_assoc($this->mysqlResult))) {
            array_push($res, $row);
        }
        return $res;
    }
    function purgeBuffer() {
        return mysql_free_result($this->mysqlResult);
    }
    function insert($qstr, $type = "insert") {
    if($this->showSQL) echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
        $this->counter++;
        if ($this->exec) {
            if ($res = mysql_query($qstr, $this->pid)) {
                $this->lastErrorNo = 0;
                $this->lastErrorMEssage = "";
                $this->isErrorDublicate = false;
                if ($type == "insert") {
                    return mysql_insert_id($this->pid);
                } else {
                    return $res;
                }
            } else {
                $this->lastErrorNo = mysql_errno();
                $this->lastErrorMEssage = mysql_error();
                $this->isErrorDublicate = (1062 == $this->lastErrorNo);
                if ($this->debug) {
                    echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
                    echo '<p style="color:red; font-weight:bold"><b>Error:</b> '.mysql_error().'</p>';
                }
                return 0;
            }
        }
    }
    function update($qstr) {
    if($this->showSQL) echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
        return $this->insert($qstr, "update");
    }
    function deletesql($qstr) {
    if($this->showSQL) echo '<p style="font-family:Courier"><b>SQL></b> '.$qstr.'</p>';
        return $this->insert($qstr, "delete");
    }
    function get_affected_rows() {
        return mysql_affected_rows($this->pid);
    }
    function dumpResult($names, $res) {
        echo '<table cellpadding="0" cellspacing="0" border="1">';
        echo '<tr style="padding:3px; font-weight:bold; background-color:#CCCCCC"><td>'.join('</td><td>', $names).'</tr>';
        foreach ($res as $row) {
            echo '<tr style="padding:3px;"><td>'.join('&nbsp;</td><td>', $row).'&nbsp;</tr>';
        }
        echo '<table>';
    }

}
$db = new db_connect('db', 'db', 'forsage', '127.0.0.1');
$db->update("SET NAMES 'utf8'");
//print_r($db->select("show variables like 'char%'"));die;
?>