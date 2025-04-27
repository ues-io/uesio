package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BundleVersionsListResponse struct {
	Description string `json:"description"`
	Version     string `json:"version"`
}

func BundleVersionsList(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	// To fetch bundles, enter an admin context.
	adminSession := datasource.GetSiteAdminSession(session)
	vars := mux.Vars(r)
	app := vars["app"]

	var bundles meta.BundleCollection
	if err := datasource.PlatformLoad(
		&bundles,
		&datasource.PlatformLoadOptions{
			BatchSize: 5,
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.major",
				},
				{
					ID: "uesio/studio.minor",
				},
				{
					ID: "uesio/studio.patch",
				},
				{
					ID: "uesio/studio.version",
				},
				{
					ID: "uesio/studio.published",
				},
				{
					ID: "uesio/studio.app",
				},
				{
					ID: "uesio/studio.description",
				},
			},
			Orders: []wire.LoadRequestOrder{
				{
					Field: "uesio/studio.major",
					Desc:  true,
				},
				{
					Field: "uesio/studio.minor",
					Desc:  true,
				},
				{
					Field: "uesio/studio.patch",
					Desc:  true,
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/studio.published",
					Value: true,
				},
				{
					Field: "uesio/studio.app->" + commonfields.UniqueKey,
					Value: app,
				},
			},
		},
		adminSession,
	); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("failed getting bundle versions list", err))
		return
	}

	var responses []BundleVersionsListResponse
	if err := bundles.Loop(func(item meta.Item, index string) error {
		description, err := item.GetField("uesio/studio.description")
		if err != nil {
			return err
		}
		version, err := item.GetField("uesio/studio.version")
		if err != nil {
			return err
		}
		responses = append(responses, BundleVersionsListResponse{
			Description: goutils.StringValue(description),
			Version:     "v" + goutils.StringValue(version),
		})
		return nil
	}); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("failed getting bundle versions list", err))
		return
	}
	filejson.RespondJSON(w, r, responses)
}
