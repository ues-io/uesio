package config

const sessionIdProp = "sessionId"

func GetSessionID() (string, error) {
	return GetConfigValue(sessionIdProp)
}

func SetSessionID(id string) error {
	return SetConfigValue(sessionIdProp, id)
}

func DeleteSessionID() error {
	return DeleteConfigValue(sessionIdProp)
}
