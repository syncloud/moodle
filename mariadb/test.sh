#!/bin/sh -ex

DIR=$( cd "$( dirname "$0" )" && pwd )
cd ${DIR}

BUILD_DIR=${DIR}/../build/snap/mariadb
${BUILD_DIR}/usr/bin/mysqld --help
${BUILD_DIR}/usr/bin/mysql --help


