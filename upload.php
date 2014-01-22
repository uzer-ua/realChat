<?php
	//include('session.php');
	header('Content-Type: text/html; charset=utf-8');
	//print_r($_REQUEST);
	//print_r($_FILES);
	$response = array();
	if (isset($_FILES['thefile'])){
		if (!$_FILES['thefile']['error'] && $_FILES['thefile']['size'] && $_FILES['thefile']['tmp_name']){
			$nn = ((count(scandir('uploads/'))-2)/4)+1;
			$ext = end(explode(".", $_FILES['thefile']['name']));
			if (!in_array(strtolower($ext),array('gif','jpeg','jpg','png'))){
				$response['error'] = 'Unsupported file';
			}
			else{
				move_uploaded_file($_FILES["thefile"]["tmp_name"],"uploads/".$nn.'.'.$ext);
				$props = GetImageSize('uploads/'.$nn.'.'.$ext);
				//var_dump($props);
				if (!$props){
					$response['error'] = 'It seems, file you loaded is not an image.';
				}
				$oi = false;
				switch(strtolower($ext)){
					case 'gif':{
						$oi = imagecreatefromgif('uploads/'.$nn.'.'.$ext);
					}break;
					case 'jpeg':
					case 'jpg':{
						$oi = imagecreatefromjpeg('uploads/'.$nn.'.'.$ext);
					}break;
					case 'png':{
						$oi = imagecreatefrompng('uploads/'.$nn.'.'.$ext);
					}
				}
				if (!$oi){
					$response['error'] = 'Unexpected error';
				}
				$ss = array(75,75);
				$ps = array(300,300);
				$fs = array(1280,960);
				//create small
				if ($props[0]>75 || $props[1]>75){
					if ($props[0]>$props[1]){
						$ss[1] = (int)($props[1]*75/$props[0]);
					}
					else{
						$ss[0] = (int)($props[0]*75/$props[1]);
					}
				}
				else{
					//copy('uploads/'.$nn.'.'.$ext,'uploads/'.$nn.'p.'.$ext);
					$ps[0] = $props[0];
					$ps[1] = $props[1];
				}
				$si = imagecreatetruecolor($ss[0],$ss[1]);
				imagecopyresampled($si,$oi,0,0,0,0,$ss[0],$ss[1],$props[0],$props[1]);
				//create preview
				if ($props[0]>300 || $props[1]>300){
					if ($props[0]>$props[1]){
						$ps[1] = (int)($props[1]*300/$props[0]);
					}
					else{
						$ps[0] = (int)($props[0]*300/$props[1]);
					}
				}
				else{
					//copy('uploads/'.$nn.'.'.$ext,'uploads/'.$nn.'p.'.$ext);
					$ps[0] = $props[0];
					$ps[1] = $props[1];
				}
				$pi = imagecreatetruecolor($ps[0],$ps[1]);
				imagecopyresampled($pi,$oi,0,0,0,0,$ps[0],$ps[1],$props[0],$props[1]);
				//create final
				if ($props[0]>1280 || $props[1]>960){
					if ($props[0]>$props[1]){
						$fs[1] = (int)($props[1]*1280/$props[0]);
					}
					else{
						$fs[0] = (int)($props[0]*960/$props[1]);
					}
				}
				else{
					//copy('uploads/'.$nn.'.'.$ext,'uploads/'.$nn.'p.'.$ext);
					$fs[0] = $props[0];
					$fs[1] = $props[1];
				}
				$fi = imagecreatetruecolor($fs[0],$fs[1]);
				imagecopyresampled($fi,$oi,0,0,0,0,$fs[0],$fs[1],$props[0],$props[1]);
				imagejpeg($pi,'uploads/'.$nn.'p.jpg');
				imagejpeg($fi,'uploads/'.$nn.'f.jpg');
				imagejpeg($si,'uploads/'.$nn.'s.jpg');
				imagedestroy($pi);
				imagedestroy($fi);
				imagedestroy($si);
				$response['id'] = $nn;
				$response['ext'] = $ext;
				$response['size'] = $ss;
			}
		}
		else{
			$response['error'] = 'Error uploading file';
		}
	}
	else{
		$response['error'] = 'File not uploaded';
	}
	echo json_encode($response);
?>