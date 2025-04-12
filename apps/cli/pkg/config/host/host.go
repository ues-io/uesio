package host

import (
	"fmt"
	"os"

	"github.com/AlecAivazis/survey/v2"

	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/env"
)

var validHostsDevMode = []string{
	// Not using tls.ServeAppDefaultScheme() here because often times the cli
	// will be run directly from command line and not have the environment
	// variables set
	buildStudioHostUrl("http", env.GetPrimaryDomain(), env.GetPort()),
	buildStudioHostUrl("https", env.GetPrimaryDomain(), env.GetPort()),
	buildStudioHostUrl("https", "ues.io", ""),
	buildStudioHostUrl("https", "ues-dev.io", ""),
}
var validHostsRegular = []string{
	buildStudioHostUrl("https", "ues.io", ""),
}

func GetValidHosts() []string {
	if env.InDevMode() {
		return validHostsDevMode
	} else {
		return validHostsRegular
	}
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
	host := os.Getenv("UESIO_CLI_HOST")
	if host != "" {
		return host, SetHost(host)
	}
	validHosts := GetValidHosts()
	// If we are not in dev mode
	if len(validHosts) == 1 {
		host = validHosts[0]
		return host, SetHost(host)
	}
	err := survey.AskOne(&survey.Select{
		Message: "Select a host.",
		Options: validHosts,
	}, &host)
	if err != nil {
		return "", err
	}
	return host, SetHost(host)
}

func buildStudioHostUrl(scheme string, domain string, port string) string {
	if port != "" {
		port = ":" + port
	}
	return fmt.Sprintf("%s://studio.%s%s", scheme, domain, port)
}
