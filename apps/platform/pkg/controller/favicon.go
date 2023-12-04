package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
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
		HandleError(w, exceptions.NewNotFoundException("favicon file not found"))
		return
	}

	file.ServeFileContent(fileItem, "", w, r)

}
