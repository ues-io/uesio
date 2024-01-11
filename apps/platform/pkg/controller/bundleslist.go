package controller

import (
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
	App         string `json:"app"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
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
		},
	}, session, nil)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle List: "+err.Error()))
		return
	}

	responses := []BundlesListResponse{}
	err = bundlelistings.Loop(func(item meta.Item, index string) error {
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

		responses = append(responses, BundlesListResponse{App: app.(string), Description: description.(string), Icon: icon.(string), Color: color.(string)})

		return nil
	})
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle List: "+err.Error()))
		return
	}

	file.RespondJSON(w, r, responses)

}
