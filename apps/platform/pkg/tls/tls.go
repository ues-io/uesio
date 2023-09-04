package tls

import "os"

const (
	selfSignedCertFile       = "ssl/certificate.crt"
	selfSignedPrivateKeyFile = "ssl/private.key"
)

func ServeAppWithTLS() bool {
	return os.Getenv("UESIO_USE_HTTPS") == "true"
}

func GetSelfSignedCertFilePath() string {
	return selfSignedCertFile
}

func GetSelfSignedPrivateKeyFile() string {
	return selfSignedPrivateKeyFile
}
