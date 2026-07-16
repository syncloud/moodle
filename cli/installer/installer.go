package installer

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"github.com/syncloud/golib/config"
	"github.com/syncloud/golib/linux"
	"github.com/syncloud/golib/platform"
	"go.uber.org/zap"
	"os"
	"path"
	"time"

	cp "github.com/otiai10/copy"
)

const App = "moodle"

type Variables struct {
	App       string
	AppDir    string
	DataDir   string
	CommonDir string
	DataRoot  string
	AppUrl    string
}

type Installer struct {
	newVersionFile     string
	currentVersionFile string
	configDir          string
	platformClient     *platform.Client
	database           *Database
	installFile        string
	adminPasswordFile  string
	appDir             string
	dataDir            string
	commonDir          string
	executor           *Executor
	logger             *zap.Logger
}

func New(logger *zap.Logger) *Installer {
	appDir := fmt.Sprintf("/snap/%s/current", App)
	dataDir := fmt.Sprintf("/var/snap/%s/current", App)
	commonDir := fmt.Sprintf("/var/snap/%s/common", App)
	configDir := path.Join(dataDir, "config")
	executor := NewExecutor(logger)
	return &Installer{
		newVersionFile:     path.Join(appDir, "version"),
		currentVersionFile: path.Join(dataDir, "version"),
		configDir:          configDir,
		platformClient:     platform.New(),
		database:           NewDatabase(App, appDir, dataDir, configDir, App, executor, logger),
		installFile:        path.Join(dataDir, "installed"),
		adminPasswordFile:  path.Join(dataDir, ".admin_password"),
		appDir:             appDir,
		dataDir:            dataDir,
		commonDir:          commonDir,
		executor:           executor,
		logger:             logger,
	}
}

func (i *Installer) Install() error {
	err := linux.CreateUser(App)
	if err != nil {
		return err
	}

	err = i.UpdateConfigs()
	if err != nil {
		return err
	}

	err = i.database.Init()
	if err != nil {
		return err
	}

	err = i.StorageChange()
	if err != nil {
		return err
	}

	return i.FixPermissions()
}

func (i *Installer) Configure() error {
	err := i.database.WaitForDatabase(60 * time.Second)
	if err != nil {
		return err
	}

	err = i.UpdateConfigs()
	if err != nil {
		return err
	}

	if i.IsInstalled() {
		err = i.Upgrade()
	} else {
		err = i.Initialize()
	}
	if err != nil {
		return err
	}

	err = i.configureOidc()
	if err != nil {
		return err
	}

	err = i.DomainChange()
	if err != nil {
		return err
	}

	return i.UpdateVersion()
}

func (i *Installer) Initialize() error {
	err := i.StorageChange()
	if err != nil {
		return err
	}

	err = i.database.createDb()
	if err != nil {
		return err
	}

	password, err := i.getOrCreateAdminPassword()
	if err != nil {
		return err
	}

	err = i.moodleCli(
		"admin/cli/install_database.php",
		"--agree-license",
		"--lang=en",
		"--adminuser=admin",
		fmt.Sprintf("--adminpass=%s", password),
		"--adminemail=admin@example.com",
		"--fullname=Syncloud Moodle",
		"--shortname=moodle",
	)
	if err != nil {
		return err
	}

	return os.WriteFile(i.installFile, []byte("installed"), 0644)
}

func (i *Installer) Upgrade() error {
	err := i.moodleCli("admin/cli/upgrade.php", "--non-interactive", "--allow-unstable")
	if err != nil {
		return err
	}
	return i.StorageChange()
}

func (i *Installer) configureOidc() error {
	authUrl, err := i.platformClient.GetAppUrl("auth")
	if err != nil {
		return err
	}

	secret, err := i.platformClient.RegisterOIDCClient(App, "/auth/oidc/", false, "client_secret_post")
	if err != nil {
		return err
	}

	cmds := [][]string{
		{"--component=auth_oidc", "--name=idptype", "--set=3"},
		{"--component=auth_oidc", "--name=clientid", "--set=" + App},
		{"--component=auth_oidc", "--name=clientauthmethod", "--set=1"},
		{"--component=auth_oidc", "--name=clientsecret", "--set=" + secret},
		{"--component=auth_oidc", "--name=authendpoint", "--set=" + authUrl + "/api/oidc/authorization"},
		{"--component=auth_oidc", "--name=tokenendpoint", "--set=" + authUrl + "/api/oidc/token"},
		{"--component=auth_oidc", "--name=oidcscope", "--set=openid profile email groups"},
		{"--component=auth_oidc", "--name=loginflow", "--set=authcode"},
		{"--component=auth_oidc", "--name=opname", "--set=Syncloud"},
		{"--component=auth_oidc", "--name=icon", "--set=moodle:t/user"},
		{"--component=auth_oidc", "--name=forceredirect", "--set=1"},
		{"--name=auth", "--set=oidc"},
	}
	for _, c := range cmds {
		args := append([]string{"admin/cli/cfg.php"}, c...)
		if err := i.moodleCli(args...); err != nil {
			return err
		}
	}
	return nil
}

func (i *Installer) DomainChange() error {
	err := i.UpdateConfigs()
	if err != nil {
		return err
	}
	if !i.IsInstalled() {
		return nil
	}
	return i.moodleCli("admin/cli/purge_caches.php")
}

func (i *Installer) moodleCli(args ...string) error {
	full := append([]string{"run", "moodle.moodle-cli"}, args...)
	_, err := i.executor.Run("snap", full...)
	return err
}

func (i *Installer) IsInstalled() bool {
	_, err := os.Stat(i.installFile)
	return err == nil
}

func (i *Installer) PreRefresh() error {
	return i.database.Backup()
}

func (i *Installer) PostRefresh() error {
	err := i.UpdateConfigs()
	if err != nil {
		return err
	}
	err = i.ClearVersion()
	if err != nil {
		return err
	}
	return i.FixPermissions()
}

func (i *Installer) StorageChange() error {
	storageDir, err := i.platformClient.InitStorage(App, App)
	if err != nil {
		return err
	}

	err = linux.CreateMissingDirs(i.dataRoot(storageDir))
	if err != nil {
		return err
	}

	return linux.Chown(storageDir, App)
}

func (i *Installer) dataRoot(storageDir string) string {
	return path.Join(storageDir, "moodledata")
}

func (i *Installer) ClearVersion() error {
	return os.RemoveAll(i.currentVersionFile)
}

func (i *Installer) UpdateVersion() error {
	return cp.Copy(i.newVersionFile, i.currentVersionFile)
}

func (i *Installer) UpdateConfigs() error {
	err := linux.CreateMissingDirs(
		path.Join(i.dataDir, "nginx"),
		path.Join(i.dataDir, "temp"),
		path.Join(i.dataDir, "config", "moodle"),
	)
	if err != nil {
		return err
	}

	storageDir, err := i.platformClient.InitStorage(App, App)
	if err != nil {
		return err
	}

	appUrl, err := i.platformClient.GetAppUrl(App)
	if err != nil {
		i.logger.Warn("app url is not available yet", zap.Error(err))
		appUrl = ""
	}

	variables := Variables{
		App:       App,
		AppDir:    i.appDir,
		DataDir:   i.dataDir,
		CommonDir: i.commonDir,
		DataRoot:  i.dataRoot(storageDir),
		AppUrl:    appUrl,
	}

	err = config.Generate(
		path.Join(i.appDir, "config"),
		path.Join(i.dataDir, "config"),
		variables,
	)
	if err != nil {
		return err
	}

	return linux.Chown(i.dataDir, App)
}

func (i *Installer) BackupPreStop() error {
	return i.PreRefresh()
}

func (i *Installer) RestorePreStart() error {
	return i.PostRefresh()
}

func (i *Installer) RestorePostStart() error {
	return i.Configure()
}

func (i *Installer) AccessChange() error {
	return i.DomainChange()
}

func (i *Installer) FixPermissions() error {
	err := linux.Chown(i.dataDir, App)
	if err != nil {
		return err
	}
	return linux.Chown(i.commonDir, App)
}

func (i *Installer) getOrCreateAdminPassword() (string, error) {
	content, err := os.ReadFile(i.adminPasswordFile)
	if err == nil {
		return string(content), nil
	}

	buf := make([]byte, 16)
	_, err = rand.Read(buf)
	if err != nil {
		return "", err
	}
	password := fmt.Sprintf("Aa1!%s", hex.EncodeToString(buf))

	err = os.WriteFile(i.adminPasswordFile, []byte(password), 0600)
	if err != nil {
		return "", err
	}
	return password, nil
}
