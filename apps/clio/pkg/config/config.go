package config

import (
	"github.com/thecloudmasters/clio/pkg/localbundlestore"
	"github.com/zalando/go-keyring"
)

func GetApp() (string, error) {

	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef("", "", nil, nil)
	if err != nil {
		return "", err
	}

	return def.Name, nil

}

func GetWorkspace() (string, error) {
	return "dev", nil
}

func GetHost() (string, error) {
	return "https://studio.uesio-dev.com:3000", nil
}

func GetSessionID() (string, error) {
	appName, err := GetApp()
	if err != nil {
		return "", err
	}
	id, err := keyring.Get("uesio", appName)
	if err != nil && err != keyring.ErrNotFound {
		return "", err
	}
	return id, nil
}

func SetSessionID(id string) error {
	appName, err := GetApp()
	if err != nil {
		return err
	}
	return keyring.Set("uesio", appName, id)
}

func DeleteSessionID() error {
	appName, err := GetApp()
	if err != nil {
		return err
	}
	return keyring.Delete("uesio", appName)
}
