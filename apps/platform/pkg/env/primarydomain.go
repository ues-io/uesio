package env

import (
	"os"
)

var (
	uesioPrimaryDomain string
	uesioPort          string
	uesioHost          string
)

func init() {
	if primaryDomainValue, isSet := os.LookupEnv("UESIO_PRIMARY_DOMAIN"); isSet && primaryDomainValue != "" {
		uesioPrimaryDomain = primaryDomainValue
	} else {
		uesioPrimaryDomain = "uesio.localhost"
	}
	uesioPort = os.Getenv("UESIO_PORT")
	if uesioPort == "" {
		uesioPort = "3000"
	}
	uesioHost = os.Getenv("UESIO_HOST")
}

func GetPrimaryDomain() string {
	return uesioPrimaryDomain
}

func SetPrimaryDomain(newPrimaryDomain string) {
	uesioPrimaryDomain = newPrimaryDomain
}

func GetPort() string {
	return uesioPort
}

func GetHost() string {
	return uesioHost
}
