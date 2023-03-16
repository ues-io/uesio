package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Favicon(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	bundledef := session.GetContextAppBundle()

	favicon := bundledef.Favicon
	if favicon == "" {
		favicon = "uesio/core.favicon"
	}
	fileItem, err := meta.NewFile(favicon)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	file.ServeFileContent(fileItem, "", w, r)

}
