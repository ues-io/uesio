package controller

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func BundlesRetrieve(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	// to expose bundles to guest users, who don't have access, we will enter an admin context.
	adminSession := datasource.GetSiteAdminSession(session)

	appID, ok := vars["app"]
	if !ok {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle missing required parameter app"))
		return
	}

	version, ok := vars["version"]
	if !ok {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle missing required parameter version"))
		return
	}

	major, minor, patch, err := meta.ParseVersionString(version)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle: "+err.Error()))
		return
	}

	var bundle meta.Bundle
	err = datasource.PlatformLoadOne(
		&bundle,
		&datasource.PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.contents",
					Fields: []wire.LoadRequestField{
						{
							ID: commonfields.Id,
						},
					},
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.UniqueKey,
					Value: fmt.Sprintf("%s:%s:%s:%s", appID, major, minor, patch),
				},
			},
		},
		adminSession,
	)

	if err != nil {
		ctlutil.HandleError(w, exceptions.NewNotFoundException(fmt.Sprintf("could not find bundle: %s/%s", appID, version)))
		return
	}

	// TODO: We could regenerate the bundle on demand, if not found
	if bundle.Contents == nil {
		ctlutil.HandleError(w, exceptions.NewNotFoundException("zip file not found for this bundle"))
		return
	}
	w.Header().Set("Content-Disposition", fmt.Sprintf("; filename=\"%s.zip\"", version))
	w.Header().Set("Cache-Control", file.CacheFor1Year)
	if _, err := filesource.Download(w, bundle.Contents.ID, adminSession); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle: "+err.Error()))
		return
	}

}
