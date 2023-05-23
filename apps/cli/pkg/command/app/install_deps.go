package app

import (
	"fmt"
	"os/exec"
)

// Run npm install in a target directory
func installDeps(targetDir string) error {
	cmd := exec.Command("npm", "install")
	if targetDir != "" {
		cmd.Dir = targetDir
	}
	_, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("could not install dependencies: %s", err.Error())
	}
	return nil
}
