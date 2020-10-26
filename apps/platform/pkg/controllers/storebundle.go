package controllers

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/retrieve"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// StoreBundle function
func StoreBundle(w http.ResponseWriter, r *http.Request) {
	session := middlewares.GetSession(r)

	workspaceID := session.GetWorkspaceID()
	workspaceApp := session.GetWorkspaceApp()

	if workspaceID == "" {
		http.Error(w, "No Workspace provided for bundle storing", http.StatusBadRequest)
		return
	}
	query := r.URL.Query()
	version := query.Get("version")
	description := query.Get("description")
	if version == "" {
		http.Error(w, "Must provide a version in the request query", http.StatusBadRequest)
	}
	if description == "" {
		http.Error(w, "Must provide a description in the request query", http.StatusBadRequest)
	}
	items, err := retrieve.Retrieve(session)
	if err != nil {
		http.Error(w, "Failed to read workspace contents", http.StatusInternalServerError)
		return
	}
	err = datasource.SaveBundleMetadata(workspaceApp, version, description, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = bundlestore.StoreWorkspaceAsBundle(workspaceApp, version, items)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
