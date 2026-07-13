#!/bin/sh -ex

DIR=$( cd "$( dirname "$0" )" && pwd )
cd ${DIR}

BUILD_DIR=${DIR}/../build/snap/mariadb
mkdir -p ${BUILD_DIR}

cp -r /usr ${BUILD_DIR}
cp -r /lib ${BUILD_DIR}

mv ${BUILD_DIR}/usr/bin/resolveip ${BUILD_DIR}/usr/bin/resolveip.bin
mv ${BUILD_DIR}/usr/bin/my_print_defaults ${BUILD_DIR}/usr/bin/my_print_defaults.bin
mv ${BUILD_DIR}/usr/bin/mysqld ${BUILD_DIR}/usr/bin/mysqld.bin
mv ${BUILD_DIR}/usr/bin/mysql ${BUILD_DIR}/usr/bin/mysql.bin
mv ${BUILD_DIR}/usr/bin/mariadb-dump ${BUILD_DIR}/usr/bin/mariadb-dump.bin

cp ${DIR}/bin/* ${BUILD_DIR}/usr/bin

