<?php
	// ini_set('display_errors', 1);
	// ini_set('display_startup_errors', 1);
	// error_reporting(E_ALL);

	$day = $_GET['day'] ?? "Sunday";
	$time = $_GET['time'] ?? "6";
	$ampm = $_GET['ampm'] ?? "pm";
	$timez = $_GET['timezone'] ?? "Australia/Sydney";

	$day = strtolower($day);
	$day = ucfirst($day);

	$time = intval($time);

	$timezone = new DateTimeZone($timez);

	$currentDateTime = new DateTime('now', $timezone);
	$currentTime = $currentDateTime->format('H:i');

	if ($currentDateTime->format('l') == $day) {
		$nextDateTime = new DateTime('now', $timezone);
	} else {
		$nextDateTime = new DateTime('next ' . $day, $timezone);
	}

	$nextDateTime->setTime($time, 0);
	$interval = $currentDateTime->diff($nextDateTime);

	$days = $interval->d;
	$hours = $interval->h;
	$minutes = $interval->i;
	$seconds = $interval->s;

	$result = '';

	if ($days > 0) $result .= $days . 'd, ';
	if ($days > 0 || $hours > 0) $result .= $hours . 'h, ';
	if ($minutes > 0) $result .= $minutes . 'm, ';

	$result .= $seconds . 's';

	if ($currentDateTime > $nextDateTime) $result .= ' ago';

	echo rtrim($result, ', ');
?>
