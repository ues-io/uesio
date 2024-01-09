package env

import "os"

var (
	UESIO_BUNDLE_STORE_DOMAIN string
)

func init() {
	var UESIO_BUNDLE_STORE_DOMAIN_VALUE, isSet = os.LookupEnv("UESIO_BUNDLE_STORE_DOMAIN")
	if !isSet && InDevMode() {
		UESIO_BUNDLE_STORE_DOMAIN = "ues.io"
	}
	UESIO_BUNDLE_STORE_DOMAIN = UESIO_BUNDLE_STORE_DOMAIN_VALUE
}

func GetPrimaryDomain() string {
	return UESIO_BUNDLE_STORE_DOMAIN
}

func SetPrimaryDomain(uesio_bundle_store_domain string) {
	UESIO_BUNDLE_STORE_DOMAIN = uesio_bundle_store_domain
}
