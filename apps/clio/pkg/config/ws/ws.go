package ws

import (
	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/wire"
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

	err = survey.AskOne(&survey.Select{
		Message: "Select a workspace.",
		Options: options,
	}, &workspace)
	if err != nil {
		return "", err
	}
	return workspace, SetWorkspace(workspace)
}
