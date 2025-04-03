package controller

import (
	"fmt"
	"net/http"
	"sort"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BundlesListResponse struct {
	App         string `json:"app"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
}

func BundlesList(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	// to expose bundle listings to guest users, who don't have access, we will enter an admin context.
	adminSession := datasource.GetSiteAdminSession(session)

	// fetch uesio/studio.bundlelisting records that are published and uesio approved
	bundleListings := &wire.Collection{}
	err := datasource.LoadWithError(&wire.LoadOp{
		CollectionName: "uesio/studio.bundlelisting",
		Collection:     bundleListings,
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
	}, adminSession, nil)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException(fmt.Errorf("Failed Getting Bundle List: %w", err)))
		return
	}

	var responses []*BundlesListResponse
	if err = bundleListings.Loop(func(item meta.Item, index string) error {
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
		responses = append(responses, &BundlesListResponse{
			App:         goutils.StringValue(app),
			Description: goutils.StringValue(description),
			Icon:        goutils.StringValue(icon),
			Color:       goutils.StringValue(color),
		})
		return nil
	}); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException(fmt.Errorf("Failed Getting Bundle List: %w", err)))
		return
	}
	sort.Slice(responses, func(i, j int) bool {
		return responses[i].App < responses[j].App
	})
	filejson.RespondJSON(w, r, responses)
}
