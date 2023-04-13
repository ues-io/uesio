package ws

import (
	"errors"

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

func GetWorkspacePrompt() (string, error) {
	value, err := GetWorkspace()
	if err != nil {
		return "", err
	}
	if value == "" {
		return SetWorkspacePrompt()
	}
	return value, nil
}

func SetWorkspacePrompt() (string, error) {
	workspace := ""

	options, err := wire.GetAvailableWorkspaceNames()
	if err != nil {
		return "", err
	}

	// If there's only one workspace, just use that one.
	if len(options) == 1 {
		return options[0], SetWorkspace(options[0])
	}
	if len(options) == 0 {
		return "", errors.New("no workspaces found for this app")
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
