package controller

import (
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BundlesListResponse struct {
	App           string `json:"app"`
	Description   string `json:"description"`
	Icon          string `json:"icon"`
	Color         string `json:"color"`
	LatestVersion string `json:"latestVersion"`
}

func BundlesList(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	//check if the uesio/studio.bundlelisting is published and uesio approved
	bundlelistings := &wire.Collection{}
	_, err := datasource.Load([]*wire.LoadOp{
		{
			CollectionName: "uesio/studio.bundlelisting",
			Collection:     bundlelistings,
			Query:          true,
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.status",
				},
				{
					ID: "uesio/studio.approved",
				},
				{
					ID: "uesio/studio.app",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/studio.status",
					Value: "PUBLISHED",
				},
				{
					Field: "uesio/studio.approved",
					Value: true,
				},
			},
		},
	}, session, nil)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle List: "+err.Error()))
		return
	}

	appIds := []string{}
	err = bundlelistings.Loop(func(item meta.Item, index string) error {
		id, err := item.GetField("uesio/studio.app->uesio/core.id")
		if err != nil {
			return err
		}
		appIds = append(appIds, id.(string))
		return nil
	})
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle List: "+err.Error()))
		return
	}

	var bundles meta.BundleCollection
	if err := datasource.PlatformLoad(
		&bundles,
		&datasource.PlatformLoadOptions{
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
					ID: "uesio/studio.published",
				},
				{
					ID: "uesio/studio.app",
					Fields: []wire.LoadRequestField{
						{
							ID: "uesio/studio.fullname",
						},
						{
							ID: "uesio/studio.description",
						},
						{
							ID: "uesio/studio.icon",
						},
						{
							ID: "uesio/studio.color",
						},
					},
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
					Field:    "uesio/studio.app",
					Value:    appIds,
					Operator: "IN",
				},
			},
		},
		session,
	); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle List: "+err.Error()))
		return
	}

	responses := map[string]BundlesListResponse{}
	err = bundles.Loop(func(item meta.Item, index string) error {
		app, err := item.GetField("uesio/studio.app->uesio/studio.fullname")
		if err != nil {
			return err
		}
		description, err := item.GetField("uesio/studio.app->uesio/studio.description")
		if err != nil {
			return err
		}
		icon, err := item.GetField("uesio/studio.app->uesio/studio.icon")
		if err != nil {
			return err
		}
		color, err := item.GetField("uesio/studio.app->uesio/studio.color")
		if err != nil {
			return err
		}

		major, err := item.GetField("uesio/studio.major")
		if err != nil {
			return err
		}

		minor, err := item.GetField("uesio/studio.minor")
		if err != nil {
			return err
		}

		patch, err := item.GetField("uesio/studio.patch")
		if err != nil {
			return err
		}

		if _, ok := responses[app.(string)]; !ok {
			responses[app.(string)] = BundlesListResponse{App: app.(string), Description: description.(string), Icon: icon.(string), Color: color.(string), LatestVersion: fmt.Sprintf("v%v.%v.%v", major, minor, patch)}
		}

		return nil
	})
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle List: "+err.Error()))
		return
	}

	file.RespondJSON(w, r, responses)

}
