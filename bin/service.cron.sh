#!/bin/bash -e
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )
while true; do
  ${DIR}/php/bin/php.sh ${DIR}/php/moodle/admin/cli/cron.php || true
  sleep 60
done
