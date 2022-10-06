package host

import (
	"fmt"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/clio/pkg/config"
)

var validHosts = []string{
	"https://studio.uesio-dev.com:3000",
	"https://studio.ues.io",
	"https://studio.ues-dev.io",
	"https://studio.ues-uat.io",
}

func GetHostURL(url string) (string, error) {
	host, err := GetHostPrompt()
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%s", host, url), nil
}

func GetHost() (string, error) {
	return config.GetConfigValue("host")
}

func SetHost(value string) error {
	return config.SetConfigValue("host", value)
}

func GetHostPrompt() (string, error) {
	value, err := GetHost()
	if err != nil {
		return "", err
	}
	if value == "" {
		return SetHostPrompt()
	}
	return value, nil
}

func SetHostPrompt() (string, error) {
	host := ""
	err := survey.AskOne(&survey.Select{
		Message: "Select a host.",
		Options: validHosts,
	}, &host)
	if err != nil {
		return "", err
	}
	return host, SetHost(host)
}
