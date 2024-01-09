package env

import "os"

var (
	UESIO_PRIMARY_DOMAIN string
)

func init() {
	var UESIO_PRIMARY_DOMAIN_VALUE, isSet = os.LookupEnv("UESIO_PRIMARY_DOMAIN")
	if !isSet && InDevMode() {
		UESIO_PRIMARY_DOMAIN = "uesio-dev.com"
	}
	UESIO_PRIMARY_DOMAIN = UESIO_PRIMARY_DOMAIN_VALUE
}

func GetPrimaryDomain() string {
	return UESIO_PRIMARY_DOMAIN
}

func SetPrimaryDomain(uesio_primary_domain string) {
	UESIO_PRIMARY_DOMAIN = uesio_primary_domain
}
