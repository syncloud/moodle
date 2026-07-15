import os
from os.path import dirname, join
from subprocess import check_output

import pytest
import requests

from syncloudlib.integration.hosts import add_host_alias
from syncloudlib.integration.installer import local_install, wait_for_installer

DIR = dirname(__file__)
TMP_DIR = '/tmp/syncloud'


@pytest.fixture(scope="session")
def module_setup(request, device, data_dir, platform_data_dir, app_dir, artifact_dir):
    def module_teardown():
        platform_log_dir = join(artifact_dir, 'platform_log')
        os.mkdir(platform_log_dir)
        device.scp_from_device('{0}/log/*'.format(platform_data_dir), platform_log_dir)

        device.run_ssh('mkdir {0}'.format(TMP_DIR), throw=False)
        device.run_ssh('top -bn 1 -w 500 -c > {0}/top.log'.format(TMP_DIR), throw=False)
        device.run_ssh('ps auxfw > {0}/ps.log'.format(TMP_DIR), throw=False)
        device.run_ssh('netstat -nlp > {0}/netstat.log'.format(TMP_DIR), throw=False)
        device.run_ssh('journalctl > {0}/journalctl.log'.format(TMP_DIR), throw=False)
        device.run_ssh('ls -la /snap/moodle/current/ > {0}/snap.ls.log'.format(TMP_DIR), throw=False)
        device.run_ssh('ls -la {0}/ > {1}/app.ls.log'.format(app_dir, TMP_DIR), throw=False)
        device.run_ssh('ls -la {0}/ > {1}/data.ls.log'.format(data_dir, TMP_DIR), throw=False)
        device.run_ssh('ls -la {0}/config/moodle > {1}/config.moodle.ls.log'.format(data_dir, TMP_DIR), throw=False)
        device.run_ssh('cat {0}/config/moodle/config.php > {1}/config.php.log'.format(data_dir, TMP_DIR), throw=False)

        app_log_dir = join(artifact_dir, 'log')
        os.mkdir(app_log_dir)
        device.scp_from_device('{0}/*'.format(TMP_DIR), app_log_dir)
        check_output('chmod -R a+r {0}'.format(artifact_dir), shell=True)

    request.addfinalizer(module_teardown)


def test_start(module_setup, device, device_host, app, domain):
    add_host_alias(app, device_host, domain)
    device.run_ssh('date', retries=100)
    device.run_ssh('mkdir {0}'.format(TMP_DIR))


@pytest.mark.flaky(retries=50, delay=10)
def test_activate_device(device):
    device.run_ssh('rm -f /var/snap/platform/current/syncloud.crt', throw=False)
    response = device.activate_custom()
    assert response.status_code == 200, response.text


def test_install(device_session, app_archive_path, device_host, device_password, domain):
    local_install(device_host, device_password, app_archive_path)
    wait_for_installer(device_session, domain)


@pytest.mark.flaky(retries=30, delay=2)
def test_index(app_domain):
    response = requests.get('https://{0}/'.format(app_domain), verify=False, timeout=30)
    assert response.status_code == 200, response.text


def test_storage_change_event(device):
    device.run_ssh('snap run moodle.storage-change > {0}/storage-change.log'.format(TMP_DIR))


def test_access_change_event(device):
    device.run_ssh('snap run moodle.access-change > {0}/access-change.log'.format(TMP_DIR))


def test_reinstall(app_archive_path, device_host, device_password, device_session, domain):
    local_install(device_host, device_password, app_archive_path)
    wait_for_installer(device_session, domain)
