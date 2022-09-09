package config

import "github.com/AlecAivazis/survey/v2"

var validHosts = []string{
	"https://studio.uesio-dev.com:3000",
	"https://studio.ues.io",
	"https://studio.ues-dev.io",
	"https://studio.ues-uat.io",
}

func GetHost() (string, error) {
	return GetConfigValue("host")
}

func SetHost(value string) error {
	return SetConfigValue("host", value)
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
