package ws

import (
	"fmt"

	"github.com/AlecAivazis/survey/v2"

	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/wire"
)

// GetWorkspace Returns the name of the current workspace
func GetWorkspace() (string, error) {
	return config.GetConfigValue("workspace")
}

// SetWorkspace Updates local config to set the name of the current workspace
func SetWorkspace(workspaceName string) error {
	return config.SetConfigValue("workspace", workspaceName)
}

// ClearWorkspace Updates local config to remove the current workspace name
func ClearWorkspace() error {
	return config.DeleteConfigValue("workspace")
}

func SetWorkspacePrompt(appId string) (string, error) {
	workspaceName := ""

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

		var newWorkspaceName string
		err = survey.AskOne(&survey.Input{
			Message: "No workspaces found. Enter a workspace name (using a-z or 0-9 only)",
			Default: "dev",
		}, &newWorkspaceName)

		if err != nil {
			return "", err
		}

		// Invoke workspace creation API to create the new workspace
		_, err := wire.CreateNewWorkspace(appID, newWorkspaceName)
		if err != nil {
			return "", fmt.Errorf("unable to create new workspace for app: %w", err)
		}
		return newWorkspaceName, SetWorkspace(newWorkspaceName)
	}

	err = survey.AskOne(&survey.Select{
		Message: "Select a workspace.",
		Options: options,
	}, &workspaceName)
	if err != nil {
		return "", err
	}
	return workspaceName, SetWorkspace(workspaceName)
}
