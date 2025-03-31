package env

import (
	"os"
)

var (
	uesioPrimaryDomain string
)

func init() {
	if primaryDomainValue, isSet := os.LookupEnv("UESIO_PRIMARY_DOMAIN"); isSet {
		uesioPrimaryDomain = primaryDomainValue
	} else if InDevMode() {
		// TODO: eliminate the special case for dev mode and use localhost (localhost refactor)
		uesioPrimaryDomain = "uesio-dev.com"
	} else {
		uesioPrimaryDomain = "localhost"
	}
}

func GetPrimaryDomain() string {
	return uesioPrimaryDomain
}

func SetPrimaryDomain(newPrimaryDomain string) {
	uesioPrimaryDomain = newPrimaryDomain
}
