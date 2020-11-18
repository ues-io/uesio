package environment

import (
	"errors"
	"os"
)

// ConfigStore struct
type ConfigStore struct {
}

var configValues = map[string]map[string]map[string]string{
	"studio": {
		"uesio": {
			"googleClientId":    os.Getenv("GOOGLE_AUTH_CLIENT_ID"),
			"googleProjectId":   os.Getenv("GOOGLE_CLOUD_PROJECT"),
			"facebookAppId":     os.Getenv("FACEBOOK_APP_ID"),
			"cognitoClientId":   os.Getenv("COGNITO_CLIENT_ID"),
			"cognitoPoolId":     os.Getenv("COGNITO_POOL_ID"),
			"genericFileBucket": os.Getenv("UESIO_PLATFORM_BUCKET"),
		},
		"crm": {
			"aws_region": os.Getenv("AWS_REGION"),
		},
	},
	"uat": {
		"uesio": {
			"googleClientId":    os.Getenv("GOOGLE_AUTH_CLIENT_ID"),
			"googleProjectId":   os.Getenv("GOOGLE_CLOUD_PROJECT"),
			"facebookAppId":     os.Getenv("FACEBOOK_APP_ID"),
			"cognitoClientId":   os.Getenv("COGNITO_CLIENT_ID"),
			"cognitoPoolId":     os.Getenv("COGNITO_POOL_ID"),
			"genericFileBucket": os.Getenv("UESIO_PLATFORM_BUCKET"),
		},
		"crm": {
			"aws_region": os.Getenv("AWS_REGION"),
		},
	},
}

// Get function
func (cs *ConfigStore) Get(namespace, name, site string) (string, error) {
	errorMessage := "Config Value not found: " + namespace + " : " + name + " : " + site
	siteStore, ok := configValues[site]
	if !ok {
		return "", errors.New(errorMessage)
	}
	appStore, ok := siteStore[namespace]
	if !ok {
		return "", errors.New(errorMessage)
	}
	value, ok := appStore[name]
	if !ok {
		return "", errors.New(errorMessage)
	}
	return value, nil
}

// Set function
func (cs *ConfigStore) Set(namespace, name, value, site string) error {
	return errors.New("You cannot set config values in the environment store")
}
