package env

import (
	"os"
	"strings"
)

var devMode bool

func init() {
	ResetDevMode()
}

// ResetDevMode resets the dev mode flag to the environment variable setting
func ResetDevMode() bool {
	devMode = os.Getenv("UESIO_DEV") == "true"
	return devMode
}

// InDevMode returns true if Uesio is running in local development mode
func InDevMode() bool {
	return devMode
}

func IsLocalhost() bool {
	return GetPrimaryDomain() == "localhost" || strings.HasSuffix(GetPrimaryDomain(), ".localhost")
}

// SetDevMode alters the dev mode flag for testing purposes.
// This should be reset by any unit tests using ResetDevMode()
func SetDevMode(val bool) (originalVal bool) {
	originalVal = devMode
	devMode = val
	return originalVal
}
