#!/bin/bash -e
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )
LIBS=$(echo ${DIR}/lib/*-linux-gnu*)
LIBS=$LIBS:$(echo ${DIR}/usr/lib/*-linux-gnu*)
LIBS=$LIBS:$(echo ${DIR}/usr/lib)
LIBS=$LIBS:$(echo ${DIR}/usr/lib/*-linux-gnu*/samba)
export MAGICK_CODER_MODULE_PATH=$(echo ${DIR}/usr/lib/ImageMagickCoders)
export PHP_INI_SCAN_DIR=${DIR}/usr/local/etc/php/conf.d
${DIR}/lib/*-linux*/ld-*.so \
  --library-path $LIBS \
  ${DIR}/usr/local/sbin/php-fpm \
  -y $SNAP_DATA/config/php-fpm.conf \
  -c $SNAP_DATA/config/php.ini \
  "$@"
