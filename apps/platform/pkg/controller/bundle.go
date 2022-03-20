package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Bundle(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	app := session.GetContextAppName()

	if app == "" {
		msg := "Error creating a new bundle, missing app"
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	workspace := session.GetWorkspace()

	if workspace == nil {
		msg := "Error creating a new bundle, missing workspace"
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	var bundles meta.BundleCollection

	err := datasource.PlatformLoad(
		&bundles,
		&datasource.PlatformLoadOptions{
			Orders: []adapt.LoadRequestOrder{
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
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.app",
					Value: app,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		msg := "Error creating a new bundle, " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	version := ""

	if len(bundles) == 0 {
		version = "v0.0.1"
	} else {
		version, err = bundles.GetItem(0).(*meta.Bundle).GetNextPatchVersionString()
		if err != nil {
			msg := "Error creating a new bundle, " + err.Error()
			logger.LogWithTrace(r, msg, logger.ERROR)
			http.Error(w, msg, http.StatusBadRequest)
			return
		}
	}

	wsbs, err := bundlestore.GetBundleStoreByType("workspace")
	if err != nil {
		msg := "Error creating a new bundle, " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	err = datasource.CreateBundle(app, workspace.Name, version, "", wsbs, session)
	if err != nil {
		msg := "Error creating a new bundle, " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, &BotResponse{
		Success: true,
	})

}
