package tls

import (
	"os"

	"github.com/thecloudmasters/uesio/pkg/env"
)

const (
	selfSignedCertFile       = "ssl/certificate.crt"
	selfSignedPrivateKeyFile = "ssl/private.key"
)

var (
	uesioUseHttps string
)

func init() {
	uesioUseHttps = os.Getenv("UESIO_USE_HTTPS")
	if uesioUseHttps == "" {
		uesioUseHttps = "false"
	}
}

func ServeAppWithTLS() bool {
	return uesioUseHttps == "true"
}

func ServeAppDefaultScheme() string {
	// when running behind load balancer, UESIO_USE_HTTPS=false
	// but we want $Site{scheme} to be https.  This is a
	// special case for serving platform via http when in development.
	if (env.IsLocalhost() && !ServeAppWithTLS()) || uesioUseHttps == "never" {
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
