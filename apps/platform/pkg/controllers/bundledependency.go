package controllers

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// AddDependency func
func AddDependency(w http.ResponseWriter, r *http.Request) {
	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

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

// RemoveDependency func
func RemoveDependency(w http.ResponseWriter, r *http.Request) {
	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

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
