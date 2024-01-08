package env

import "os"

func GetPrimaryDomain() string {

	var primaryDomain, isSet = os.LookupEnv("UESIO_PRIMARY_DOMAIN")
	if !isSet {
		primaryDomain = "ues.io"
		if InDevMode() {
			primaryDomain = "uesio-dev.com"
		}
	}

	return primaryDomain
}
