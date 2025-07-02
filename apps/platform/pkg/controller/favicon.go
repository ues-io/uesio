package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
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
		ctlutil.HandleError(r.Context(), w, exceptions.NewNotFoundException("favicon file not found"))
		return
	}

	// NOTE: We do not set <link rel="icon" href="/favicon.ico"> or similar in HTML and instead rely on browsers automatically
	// requesting /favicon.ico when no favicon is specified. We should generate the link meta tag in the rendered html
	// from the site config ideally but for now, we're just going to not cache favicon until permanent solution can be implemented.
	// We can't use UESIO_BUILD_VERSION as a cache buster (e.g., /favicon.ico?v=UESIO_BUILD_VERSION) because favicon is site specific.
	// TODO: Implement a proper and permanent solution for including favicon in generated html on a site basis or if not possible,
	// consider a low cache setting or just leave not-cacheable which is not really ideal especially given it rarely would change.
	file.ServeFileContent(fileItem, "", false, w, r)

}
