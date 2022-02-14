package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Bundle(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	app := vars["app"] //don't need app and WS we can get it from another place for sure!
	workspace := vars["workspace"]
	session := middleware.GetSession(r)

	var bundles meta.BundleCollection

	err := datasource.PlatformLoadWithOrder(&bundles, []adapt.LoadRequestOrder{
		{
			Field: "studio.major",
			Desc:  true,
		},
		{
			Field: "studio.minor",
			Desc:  true,
		},
		{
			Field: "studio.patch",
			Desc:  true,
		},
	}, []adapt.LoadRequestCondition{
		{
			Field: "studio.app",
			Value: app,
		},
	}, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	version := ""

	if len(bundles) == 0 {
		version = "v0.0.1"
	} else {
		version, err = bundles.GetItem(0).(*meta.Bundle).GetNextPatchVersionString()
		if err != nil {
			logger.LogErrorWithTrace(r, err)
			respondJSON(w, r, &BotResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
	}

	wsbs, err := bundlestore.GetBundleStoreByType("workspace")
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	err = datasource.CreateBundle(app, workspace, version, "", wsbs, session)

	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

}
