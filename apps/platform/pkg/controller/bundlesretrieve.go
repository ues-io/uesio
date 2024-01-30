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

	major, minor, patch, err := meta.ParseVersionStringToInt(version)
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
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/studio.major",
					Value: major,
				},
				{
					Field: "uesio/studio.minor",
					Value: minor,
				},
				{
					Field: "uesio/studio.patch",
					Value: patch,
				},
				{
					Field: "uesio/studio.app->" + commonfields.UniqueKey,
					Value: appID,
				},
			},
		},
		adminSession,
	)

	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle: "+err.Error()))
		return
	}

	if bundle.Contents == nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle: Zip File not present"))
		return
	}
	w.Header().Set("Content-Disposition", fmt.Sprintf("; filename=\"%s.zip\"", version))
	w.Header().Set("Cache-Control", file.CacheFor1Year)
	if _, err := filesource.Download(w, bundle.Contents.ID, adminSession); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle: "+err.Error()))
		return
	}

}
