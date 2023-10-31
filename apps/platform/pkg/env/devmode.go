package env

import "os"

func InDevMode() bool {
	return os.Getenv("UESIO_DEV") == "true"
}
