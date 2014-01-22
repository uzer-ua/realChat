CREATE DATABASE forsage;
USE forsage;

DROP TABLE IF EXISTS `chat`;
CREATE TABLE `chat` (
	`id_chat` int(11) NOT NULL AUTO_INCREMENT,
	`message` text NOT NULL,
	`date` int(11) NOT NULL,
	`id_users` int(11) NOT NULL,
	PRIMARY KEY (`id_chat`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `system`;
CREATE TABLE `system` (
	`pos` int(11) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
	`id_users` int(11) NOT NULL AUTO_INCREMENT,
	`uid` int(11) NOT NULL,
	`name` varchar(50) NOT NULL,
	`first_name` varchar(50) NOT NULL DEFAULT '',
	`last_name` varchar(50) NOT NULL DEFAULT '',
	`photo` varchar(100) NOT NULL,
	`last_active` int(11) NOT NULL DEFAULT '0',
	`settings` varchar(255) NOT NULL DEFAULT 'a:0,s:0,m:0',
	`sid` varchar(32) NOT NULL DEFAULT '',
	`lcheck` int(11) NOT NULL DEFAULT '0',
	`hide` tinyint(1) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id_users`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `white_list`;
CREATE TABLE `white_list` (
	`id` int(11) NOT NULL,
	PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;