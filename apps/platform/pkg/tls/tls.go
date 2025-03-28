package tls

import (
	"os"

	"github.com/thecloudmasters/uesio/pkg/env"
)

const (
	selfSignedCertFile       = "ssl/certificate.crt"
	selfSignedPrivateKeyFile = "ssl/private.key"
)

func ServeAppWithTLS() bool {
	return os.Getenv("UESIO_USE_HTTPS") == "true"
}

func ServeAppDefaultScheme() string {
	// when running behind load balance, UESIO_DEV=false
	// but we want $Site{scheme} to be https.  This is a
	// special case for serving platform via http in dev mode.
	// An alternative to this approach is to add env variable
	// e.g., UESIO_DEFAULT_SCHEME with the default being https.
	if env.InDevMode() && !ServeAppWithTLS() {
		return "http"
	}

	return "https"
}

func GetSelfSignedCertFilePath() string {
	return selfSignedCertFile
}

func GetSelfSignedPrivateKeyFile() string {
	return selfSignedPrivateKeyFile
}
