package ws

import (
	"errors"
	"fmt"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/wire"
)

func GetWorkspace() (string, error) {
	return config.GetConfigValue("workspace")
}

func SetWorkspace(value string) error {
	return config.SetConfigValue("workspace", value)
}

func SetWorkspacePrompt(appId string) (string, error) {
	workspace := ""

	appID := appId
	var err error

	if appID == "" {
		appID, err = wire.GetAppID()
		if err != nil {
			return "", err
		}
	}

	options, err := wire.GetAvailableWorkspaceNames(appID)
	if err != nil {
		return "", err
	}

	// If there's only one workspace, just use that one.
	if len(options) == 1 {
		return options[0], SetWorkspace(options[0])
	}
	if len(options) == 0 {

		var newWorkspace string
		err = survey.AskOne(&survey.Input{
			Message: "No workspaces found. Enter a workspace name (using a-z or 0-9 only)",
			Default: "dev",
		}, &newWorkspace)

		if err != nil {
			return "", err
		}

		// Invoke workspace creation API to create a default "dev" workspace
		_, err := wire.CreateNewWorkspace(appID, newWorkspace)
		if err != nil {
			return "", errors.New("unable to create new workspace for app: " + err.Error())
		}
		return newWorkspace, SetWorkspace(newWorkspace)
	}

	err = survey.AskOne(&survey.Select{
		Message: "Select a workspace.",
		Options: options,
	}, &workspace)
	if err != nil {
		return "", err
	}
	return workspace, SetWorkspace(workspace)
}

func SetWorkspaceByID(appId string, workspace string) (string, error) {

	appID := appId
	var err error

	if appID == "" {
		appID, err = wire.GetAppID()
		if err != nil {
			return "", err
		}
	}

	options, err := wire.GetAvailableWorkspaceNames(appID)
	if err != nil {
		return "", err
	}

	if contains(options, workspace) {
		return workspace, SetWorkspace(workspace)
	}

	return "", fmt.Errorf("Workspace: '%s' not found", workspace)

}

func contains(options []string, ws string) bool {
	for _, option := range options {
		if option == ws {
			return true
		}
	}
	return false
}
