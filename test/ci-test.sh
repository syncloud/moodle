#!/bin/bash -e
DIR=$( cd "$( dirname "$0" )" && pwd )
cd ${DIR}

DISTRO=$1

./deps.sh
py.test -x -s test.py --distro=$DISTRO --ver=$DRONE_BUILD_NUMBER --app=moodle
