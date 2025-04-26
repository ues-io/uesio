package siteadmin

import (
	"fmt"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/wire"
)

func GetSiteAdmin() (string, error) {
	return config.GetConfigValue("site")
}

func SetSiteAdmin(siteName string) error {
	return config.SetConfigValue("site", siteName)
}

func SetSiteAdminPrompt(appId string) (string, error) {
	siteName := ""

	appID := appId
	var err error

	if appID == "" {
		appID, err = wire.GetAppID()
		if err != nil {
			return "", err
		}
	}

	options, err := wire.GetAvailableSiteNames(appID)
	if err != nil {
		return "", err
	}

	// If there's only one workspace, just use that one.
	if len(options) == 1 {
		return options[0], SetSiteAdmin(options[0])
	}
	if len(options) == 0 {
		return "", fmt.Errorf("unable to create new workspace for app: %w", err)
	}

	err = survey.AskOne(&survey.Select{
		Message: "Select a site.",
		Options: options,
	}, &siteName)
	if err != nil {
		return "", err
	}
	return siteName, SetSiteAdmin(siteName)
}
