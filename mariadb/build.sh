#!/bin/sh -ex

DIR=$( cd "$( dirname "$0" )" && pwd )
cd ${DIR}

BUILD_DIR=${DIR}/../build/snap/mariadb
mkdir -p ${BUILD_DIR}

apk add --no-cache mariadb mariadb-client

cp -r /usr ${BUILD_DIR}
cp -r /lib ${BUILD_DIR}

cd ${BUILD_DIR}/usr/bin
rm -f mysqld mysql mysqldump
mv mariadbd mariadbd.bin
mv mariadb mariadb.bin
mv mariadb-dump mariadb-dump.bin
mv my_print_defaults my_print_defaults.bin
mv resolveip resolveip.bin

cp ${DIR}/bin/* ${BUILD_DIR}/usr/bin
