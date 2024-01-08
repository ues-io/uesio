package env

import "os"

func GetPrimaryDomain() string {

	var primaryDomain, isSet = os.LookupEnv("UESIO_PRIMARY_DOMAIN")
	if !isSet  && InDevMode() {
		primaryDomain = "uesio-dev.com"
	}

	return primaryDomain
}
