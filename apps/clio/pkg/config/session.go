package config

import "github.com/zalando/go-keyring"

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
