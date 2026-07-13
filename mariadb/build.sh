#!/bin/sh -ex

DIR=$( cd "$( dirname "$0" )" && pwd )
cd ${DIR}

BUILD_DIR=${DIR}/../build/snap/mariadb
mkdir -p ${BUILD_DIR}

cp -r /usr ${BUILD_DIR}
cp -r /lib ${BUILD_DIR}

cd ${BUILD_DIR}/usr/bin
rm -f mysqld mysql mysqldump
for b in mariadbd mariadb mariadb-dump my_print_defaults resolveip; do
  mv $b $b.bin
done

cp ${DIR}/bin/* ${BUILD_DIR}/usr/bin
