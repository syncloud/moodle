<?php
unset($CFG);
global $CFG;
$CFG = new stdClass();

$CFG->dbtype    = 'mariadb';
$CFG->dblibrary = 'native';
$CFG->dbhost    = 'localhost';
$CFG->dbname    = 'moodle';
$CFG->dbuser    = 'moodle';
$CFG->dbpass    = 'moodle';
$CFG->prefix    = 'mdl_';
$CFG->dboptions = array(
    'dbpersist' => 0,
    'dbport'    => '',
    'dbsocket'  => getenv('SNAP_DATA') . '/mysql.sock',
    'dbcollation' => 'utf8mb4_unicode_ci',
);

$CFG->wwwroot   = '{{ .AppUrl }}';
$CFG->dataroot  = '{{ .DataRoot }}';
$CFG->tempdir   = getenv('SNAP_DATA') . '/temp';
$CFG->admin     = 'admin';

$CFG->directorypermissions = 02777;
$CFG->sslproxy  = true;
$CFG->curlsecurityblockedhosts = '';

require_once(getenv('SNAP') . '/php/moodle/lib/setup.php');
