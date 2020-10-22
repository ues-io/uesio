package controllers

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

func AddDependency(w http.ResponseWriter, r *http.Request) {
	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)
	vars := mux.Vars(r)
	bundleID := vars["bundleid"]
	workspace := site.Workspace.ID

	if workspace == "" {
		http.Error(w, "No Workspace provided for bundle storing", http.StatusBadRequest)
		return
	}
	if bundleID == "" {
		http.Error(w, "No bundleid provided for in the body", http.StatusBadRequest)
		return
	}

	err := datasource.AddDependency(workspace, bundleID, site, sess)
	if err != nil {
		http.Error(w, "Failed to add dependency: "+err.Error(), http.StatusBadRequest)
		return
	}
}

func RemoveDependency(w http.ResponseWriter, r *http.Request) {
	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)
	vars := mux.Vars(r)
	bundleID := vars["bundleid"]
	workspace := site.Workspace.ID

	if workspace == "" {
		http.Error(w, "No Workspace provided for bundle storing", http.StatusBadRequest)
		return
	}
	if bundleID == "" {
		http.Error(w, "No bundleid provided for in the body", http.StatusBadRequest)
		return
	}

	err := datasource.RemoveDependency(workspace, bundleID, site, sess)
	if err != nil {
		http.Error(w, "Failed to add dependency: "+err.Error(), http.StatusBadRequest)
		return
	}
}
