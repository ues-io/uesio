package config

const tokenProp = "token"

func GetToken() (string, error) {
	return GetConfigValue(tokenProp)
}

func SetToken(token string) error {
	return SetConfigValue(tokenProp, token)
}

func DeleteToken() error {
	return DeleteConfigValue(tokenProp)
}
