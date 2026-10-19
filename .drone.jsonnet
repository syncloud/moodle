local name = 'moodle';
local version = '5.3.0';
local auth_oidc = '5.2.1';
local platform = '26.07.01';
local store_publisher = 'stable-346';
local go = '1.25';
local nginx = '1.29.3-alpine3.22';
local php = '8.3.9-fpm-bookworm';
local mariadb = 'alpine:3.21';
local debian = 'bookworm-slim';
local python = '3.12-slim-bookworm';
local playwright = 'v1.48.2-jammy';
local distro_default = 'bookworm';
local distros = ['bookworm', 'buster'];

local platform_image(distro) =
    'syncloud/platform-' + distro + ':' + platform;

local build(arch, test_ui) = [{
    kind: 'pipeline',
    type: 'docker',
    name: arch,
    platform: {
        os: 'linux',
        arch: arch,
    },
    steps: [
        {
            name: 'cleanup',
            image: 'docker:27-cli',
            volumes: [{ name: 'docker-sock', path: '/var/run/docker.sock' }],
            commands: [
                'docker container prune -f',
                'docker builder prune -f',
                'docker image prune -f',
            ],
        },
        {
            name: 'nginx',
            image: 'nginx:' + nginx,
            commands: ['./nginx/build.sh'],
        },
    ] + [
        {
            name: 'nginx test ' + distro,
            image: platform_image(distro),
            commands: ['./nginx/test.sh'],
        }
        for distro in distros
    ] + [
        {
            name: 'php',
            image: 'php:' + php,
            commands: [
                './php/build.sh',
                './php/build-moodle.sh ' + version + ' ' + auth_oidc,
            ],
        },
    ] + [
        {
            name: 'php test ' + distro,
            image: platform_image(distro),
            commands: ['./php/test.sh'],
        }
        for distro in distros
    ] + [
        {
            name: 'mariadb',
            image: mariadb,
            commands: ['./mariadb/build.sh'],
        },
    ] + [
        {
            name: 'mariadb test ' + distro,
            image: platform_image(distro),
            commands: ['./mariadb/test.sh'],
        }
        for distro in distros
    ] + [
        {
            name: 'cli',
            image: 'golang:' + go,
            commands: ['./cli/build.sh'],
        },
        {
            name: 'package',
            image: 'debian:' + debian,
            commands: ['./package.sh ' + name + ' $DRONE_BUILD_NUMBER'],
        },
    ] + [
        {
            name: 'test ' + distro,
            image: 'python:' + python,
            commands: ['./test/ci-test.sh test.py ' + distro + ' ' + arch],
        }
        for distro in distros
    ] + (if test_ui then [
        {
            name: 'e2e',
            image: 'mcr.microsoft.com/playwright:' + playwright,
            commands: ['./test/e2e/run.sh e2e specs/01-ui.spec.ts'],
        },
        {
            name: 'test-upgrade-prev',
            image: 'python:' + python,
            commands: ['./test/ci-test.sh upgrade_prev.py ' + distro_default + ' ' + arch],
        },
        {
            name: 'e2e-before-upgrade',
            image: 'mcr.microsoft.com/playwright:' + playwright,
            commands: ['./test/e2e/run.sh e2e-before-upgrade specs/02-pre-upgrade.spec.ts'],
        },
        {
            name: 'test-upgrade',
            image: 'python:' + python,
            commands: ['./test/ci-test.sh upgrade.py ' + distro_default + ' ' + arch],
        },
        {
            name: 'e2e-after-upgrade',
            image: 'mcr.microsoft.com/playwright:' + playwright,
            commands: ['./test/e2e/run.sh e2e-after-upgrade specs/03-post-upgrade.spec.ts'],
        },
    ] else []) + [
        {
            name: 'publish',
            image: 'syncloud/store-publisher:' + store_publisher,
            environment: {
                SYNCLOUD_TOKEN: { from_secret: 'SYNCLOUD_TOKEN' },
            },
            command: ['snap', '-c', '${DRONE_BRANCH}'],
            when: {
                branch: ['stable'],
                event: ['push'],
            },
        },
        {
            name: 'artifact',
            image: 'appleboy/drone-scp:1.6.4',
            settings: {
                host: { from_secret: 'artifact_host' },
                username: 'artifact',
                key: { from_secret: 'artifact_key' },
                timeout: '2m',
                command_timeout: '2m',
                target: '/home/artifact/repo/' + name + '/${DRONE_BUILD_NUMBER}-' + arch,
                source: ['artifact/*'],
                strip_components: 1,
            },
            when: {
                status: ['failure', 'success'],
                event: ['push'],
            },
        },
    ],
    trigger: {
        event: ['push'],
    },
    services: [
        {
            name: name + '.' + distro + '.com',
            image: platform_image(distro),
            privileged: true,
            entrypoint: ['/bin/sh', '-c', "mkdir -p /etc/systemd/system/snapd.service.d && printf '[Service]\\nExecStartPost=/bin/sh -c \"/usr/bin/snap set system refresh.hold=2099-01-01T00:00:00Z\"\\n' > /etc/systemd/system/snapd.service.d/disable-refresh.conf && exec /sbin/init"],
            volumes: [
                { name: 'dbus', path: '/var/run/dbus' },
                { name: 'dev', path: '/dev' },
            ],
        }
        for distro in distros
    ],
    volumes: [
        { name: 'dbus', host: { path: '/var/run/dbus' } },
        { name: 'dev', host: { path: '/dev' } },
        { name: 'shm', temp: {} },
        { name: 'docker-sock', host: { path: '/var/run/docker.sock' } },
    ],
}];

build('amd64', true) +
build('arm64', false)
