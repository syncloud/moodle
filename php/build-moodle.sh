#!/bin/bash -ex

DIR=$( cd "$( dirname "$0" )" && pwd )
cd ${DIR}

BUILD_DIR=${DIR}/../build/snap/php
MOODLE_VERSION=$1
AUTH_OIDC_VERSION=$2

apt update
apt -y install wget

mkdir -p ${DIR}/build
cd ${DIR}/build

wget https://github.com/moodle/moodle/archive/refs/tags/v${MOODLE_VERSION}.tar.gz -O moodle.tar.gz --progress dot:giga
tar xf moodle.tar.gz
mv moodle-${MOODLE_VERSION} ${BUILD_DIR}/moodle

wget https://github.com/microsoft/moodle-auth_oidc/archive/refs/tags/v${AUTH_OIDC_VERSION}.tar.gz -O auth_oidc.tar.gz --progress dot:giga
tar xf auth_oidc.tar.gz
mv moodle-auth_oidc-${AUTH_OIDC_VERSION} ${BUILD_DIR}/moodle/auth/oidc

cp ${DIR}/config.php ${BUILD_DIR}/moodle/config.php
