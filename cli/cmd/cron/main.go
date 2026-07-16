package main

import (
	"os"
	"os/exec"
	"path"
	"time"

	"go.uber.org/zap"
	"hooks/log"
)

const interval = time.Minute

func main() {
	logger := log.Logger(zap.DebugLevel)
	snap := os.Getenv("SNAP")
	php := path.Join(snap, "php", "bin", "php.sh")
	cron := path.Join(snap, "php", "moodle", "admin", "cli", "cron.php")
	for {
		logger.Info("running moodle cron")
		cmd := exec.Command(php, cron)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			logger.Error("cron failed", zap.Error(err))
		}
		time.Sleep(interval)
	}
}
