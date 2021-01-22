package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// AddDependency func
func AddDependency(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	bundleVersion := vars["bundleversion"]
	bundleName := vars["bundlename"]
	workspace := session.GetWorkspaceID()

	if workspace == "" {
		http.Error(w, "No Workspace provided for bundle storing", http.StatusBadRequest)
		return
	}
	if bundleName == "" {
		http.Error(w, "No bundle name provided for in the url", http.StatusBadRequest)
		return
	}

	if bundleVersion == "" {
		http.Error(w, "No bundle version provided for in the url", http.StatusBadRequest)
		return
	}

	err := datasource.AddDependency(workspace, bundleName, bundleVersion, session)
	if err != nil {
		http.Error(w, "Failed to add dependency: "+err.Error(), http.StatusBadRequest)
		return
	}
}

// RemoveDependency func
func RemoveDependency(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	bundlename := vars["bundlename"]
	workspace := session.GetWorkspaceID()

	if workspace == "" {
		http.Error(w, "No Workspace provided for bundle storing", http.StatusBadRequest)
		return
	}
	if bundlename == "" {
		http.Error(w, "No bundleid provided for in the body", http.StatusBadRequest)
		return
	}

	err := datasource.RemoveDependency(workspace, bundlename, session)
	if err != nil {
		http.Error(w, "Failed to add dependency: "+err.Error(), http.StatusBadRequest)
		return
	}
}
