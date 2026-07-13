#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd ${DIR}

BUILD_DIR=${DIR}/../build/snap
TEST_DIR=${DIR}/../build
cp -r ${DIR}/../config ${DIR}/../build/
sed -i "s#{{ .AppDir }}#$BUILD_DIR#g" $TEST_DIR/config/php.ini
#sed -i "s#include=.*#include=$TEST_DIR/config/www.conf#g" $TEST_DIR/config/php-fpm.conf
export SNAP_DATA=$TEST_DIR

${BUILD_DIR}/php/bin/php-fpm.sh --version
${BUILD_DIR}/php/bin/php-fpm.sh --version | ( ! grep Warning )
${BUILD_DIR}/php/bin/php.sh --version
${BUILD_DIR}/php/bin/php.sh -i
${BUILD_DIR}/php/bin/php.sh -i | grep -i "gd support" | grep -i enabled
