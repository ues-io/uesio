package config

const sessionIDProp = "sessionId"

func GetSessionID() (string, error) {
	return GetConfigValue(sessionIDProp)
}

func SetSessionID(id string) error {
	return SetConfigValue(sessionIDProp, id)
}

func DeleteSessionID() error {
	return DeleteConfigValue(sessionIDProp)
}
