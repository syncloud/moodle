#!/bin/bash -ex
DIR=$( cd "$( dirname "$0" )" && pwd )
cd ${DIR}

BUILD_DIR=${DIR}/../build/snap
mkdir -p ${BUILD_DIR}/meta/hooks ${BUILD_DIR}/bin

CGO_ENABLED=0 go build -o ${BUILD_DIR}/meta/hooks/install ./cmd/install
CGO_ENABLED=0 go build -o ${BUILD_DIR}/meta/hooks/configure ./cmd/configure
CGO_ENABLED=0 go build -o ${BUILD_DIR}/meta/hooks/pre-refresh ./cmd/pre-refresh
CGO_ENABLED=0 go build -o ${BUILD_DIR}/meta/hooks/post-refresh ./cmd/post-refresh
CGO_ENABLED=0 go build -o ${BUILD_DIR}/bin/cli ./cmd/cli
CGO_ENABLED=0 go build -o ${BUILD_DIR}/bin/cron ./cmd/cron
