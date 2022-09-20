package config

import "github.com/zalando/go-keyring"

func GetSessionID() (string, error) {
	id, err := keyring.Get("uesio", "clio")
	if err != nil && err != keyring.ErrNotFound {
		return "", err
	}
	return id, nil
}

func SetSessionID(id string) error {
	return keyring.Set("uesio", "clio", id)
}

func DeleteSessionID() error {
	appName, err := GetApp()
	if err != nil {
		return err
	}
	return keyring.Delete("uesio", appName)
}
