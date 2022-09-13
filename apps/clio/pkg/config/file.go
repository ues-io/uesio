package config

import (
	"encoding/json"
	"os"
)

var CONFIG_FILE = ".clio"

func GetConfigValue(key string) (string, error) {
	data, err := GetConfigData()
	if err != nil {
		return "", err
	}
	value, ok := data[key]
	if !ok {
		return "", nil
	}
	return value, nil
}

func SetConfigValue(key, value string) error {
	data, err := GetConfigData()
	if err != nil {
		return err
	}
	data[key] = value
	return SetConfigData(data)
}

func SetConfigData(data map[string]string) error {
	f, err := os.Create(CONFIG_FILE)
	if err != nil {
		return err
	}
	defer f.Close()
	return json.NewEncoder(f).Encode(&data)
}

func GetConfigData() (map[string]string, error) {
	data := map[string]string{}
	f, err := os.Open(CONFIG_FILE)
	if err != nil {
		return map[string]string{}, nil
	}
	err = json.NewDecoder(f).Decode(&data)
	if err != nil {
		return nil, err
	}
	return data, nil
}
