local name = 'moodle';
local version = '4.5.12';
local platform = '26.04.10';
local store_publisher = 'stable-303';
local go = '1.25';
local nginx = '1.29.3-alpine3.22';
local php = '8.3.9-fpm-bullseye';
local mariadb = '11.4.12';
local debian = 'bookworm-slim';
local python = '3.12-slim-bookworm';
local playwright = 'v1.48.2-jammy';
local distro_default = 'bookworm';
local distros = ['bookworm', 'buster'];

local platform_image(distro, arch) =
    'syncloud/platform-' + distro + '-' + arch + ':' + platform;

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
            name: 'nginx',
            image: 'nginx:' + nginx,
            commands: ['./nginx/build.sh'],
        },
    ] + [
        {
            name: 'nginx test ' + distro,
            image: platform_image(distro, arch),
            commands: ['./nginx/test.sh'],
        }
        for distro in distros
    ] + [
        {
            name: 'php',
            image: 'php:' + php,
            commands: [
                './php/build.sh',
                './php/build-moodle.sh ' + version,
            ],
        },
    ] + [
        {
            name: 'php test ' + distro,
            image: platform_image(distro, arch),
            commands: ['./php/test.sh'],
        }
        for distro in distros
    ] + [
        {
            name: 'mariadb',
            image: 'linuxserver/mariadb:' + mariadb,
            commands: ['./mariadb/build.sh'],
        },
    ] + [
        {
            name: 'mariadb test ' + distro,
            image: platform_image(distro, arch),
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
            commands: ['./test/ci-test.sh ' + distro + ' ' + arch],
        }
        for distro in distros
    ] + (if test_ui then [
        {
            name: 'test-ui-desktop',
            image: 'mcr.microsoft.com/playwright:' + playwright,
            commands: ['./test/e2e/run.sh e2e-desktop desktop'],
        },
        {
            name: 'test-ui-mobile',
            image: 'mcr.microsoft.com/playwright:' + playwright,
            commands: ['./test/e2e/run.sh e2e-mobile mobile'],
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
                branch: ['master', 'stable'],
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
            image: platform_image(distro, arch),
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
    ],
}];

build('amd64', true) +
build('arm64', false) +
build('arm', false)
