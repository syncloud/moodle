#!/bin/bash -e

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )
rm -rf $SNAP_DATA/database/aria_log_control
export MYSQL_HOME=$SNAP_DATA/config
exec ${DIR}/mariadb/usr/bin/mysqld \
  --basedir=$SNAP_DATA/mariadb/usr \
  --datadir=$SNAP_DATA/database \
  --plugin-dir=$SNAP/mariadb/lib/plugin \
  --pid-file=$SNAP_DATA/database/mariadb.pid
