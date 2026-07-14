<?php
namespace local_syncloud;

defined('MOODLE_INTERNAL') || die();

class observer {
    const ADMIN_GROUP = 'syncloud';

    public static function user_loggedin(\core\event\user_loggedin $event) {
        global $CFG, $DB;

        $userid = (int)$event->objectid;
        $user = \core_user::get_user($userid);
        if (!$user || $user->auth !== 'oidc') {
            return;
        }

        $isadmin = in_array(self::ADMIN_GROUP, self::groups($user), true);

        $admins = array_filter(array_map('trim', explode(',', (string)$CFG->siteadmins)));
        $admins = array_values(array_diff($admins, [(string)$userid]));
        if ($isadmin) {
            $admins[] = (string)$userid;
        }
        set_config('siteadmins', implode(',', $admins));
    }

    private static function groups(\stdClass $user): array {
        global $DB;

        $token = $DB->get_record('auth_oidc_token', ['username' => $user->username]);
        if (!$token || empty($token->idtoken)) {
            return [];
        }

        $parts = explode('.', $token->idtoken);
        if (count($parts) < 2) {
            return [];
        }

        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        if (!is_array($payload) || !isset($payload['groups'])) {
            return [];
        }

        return is_array($payload['groups']) ? $payload['groups'] : [$payload['groups']];
    }
}
