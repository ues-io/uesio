package env

import (
	"os"
)

var (
	uesioPrimaryDomain string
)

func init() {
	if primaryDomainValue, isSet := os.LookupEnv("UESIO_PRIMARY_DOMAIN"); isSet && primaryDomainValue != "" {
		uesioPrimaryDomain = primaryDomainValue
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
