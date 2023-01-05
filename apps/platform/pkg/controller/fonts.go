package controller

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/logger"
)

func Fonts() http.Handler {
	cwd, err := os.Getwd()
	if err != nil {
		logger.LogError(err)
		panic("Failed to obtain working directory")
	}
	fontServer := http.FileServer(http.Dir(filepath.Join(cwd, "fonts")))
	return http.StripPrefix("/fonts", fontServer)
}
