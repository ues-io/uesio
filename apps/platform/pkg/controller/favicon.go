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

	fileItem, err := meta.NewFile(middleware.GetSession(r).GetSite().GetFavicon())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewNotFoundException("favicon file not found"))
		return
	}

	// NOTE: We include a <link rel="icon" href="/favicon.ico?v={{ .Site.Version }}" sizes="any"> in the HTML currently to support
	// cache busting so we can set a cache control header here to allow caching. However, the current approach has several
	// limitations that should be addressed
	// TODO: see https://github.com/ues-io/uesio/issues/4674
	file.ServeFileContent(fileItem, "", true, w, r)
}
