import { ssh, scpFrom } from './helpers/ssh'
import * as fs from 'node:fs'
import { execSync } from 'node:child_process'

const TMP_DIR = '/tmp/syncloud/moodle-ui'
const artifactRoot = process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifact'

export default async function () {
  fs.mkdirSync(artifactRoot, { recursive: true })
  ssh(`mkdir -p ${TMP_DIR}`, { throw: false })
  ssh(`journalctl > ${TMP_DIR}/journalctl.log`, { throw: false })
  scpFrom(`${TMP_DIR}/journalctl.log`, artifactRoot, { throw: false })
  try { execSync(`chmod -R a+r ${artifactRoot}`) } catch {}
}
