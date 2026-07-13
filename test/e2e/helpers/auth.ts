import { ssh } from './ssh'

export function adminPassword(): string {
  return ssh('cat /var/snap/moodle/current/.admin_password').trim()
}
