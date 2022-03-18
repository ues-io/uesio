package controller

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func CollectionRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collectionName := vars["name"]
	collectionNamespace := vars["namespace"]
	id := vars["id"]
	viewtype := vars["viewtype"]

	session := middleware.GetSession(r)
	workspace := session.GetWorkspace()
	route, err := routing.GetRouteFromCollection(r, collectionNamespace, collectionName, viewtype, id, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &RouteMergeData{
			View:  "uesio/core.notfound",
			Theme: "uesio/core.default",
		})
		return
	}

	respondJSON(w, r, &RouteMergeData{
		View:      route.ViewRef,
		Params:    route.Params,
		Namespace: route.Namespace,
		Theme:     route.ThemeRef,
		Path:      route.Path,
		Workspace: GetWorkspaceMergeData(workspace),
	})

}

// Route is good
func Route(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	namespace := vars["namespace"]
	path := vars["route"]

	session := middleware.GetSession(r)
	workspace := session.GetWorkspace()

	prefix := "/site/routes/path/" + namespace + "/"

	if workspace != nil {
		prefix = "/workspace/" + workspace.GetAppID() + "/" + workspace.Name + "/routes/path/" + namespace + "/"
	}

	route, err := routing.GetRouteFromPath(r, namespace, path, prefix, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &RouteMergeData{
			View:  "uesio/core.notfound",
			Theme: "uesio/core.default",
		})
		return
	}

	respondJSON(w, r, &RouteMergeData{
		View:      route.ViewRef,
		Params:    route.Params,
		Namespace: route.Namespace,
		Theme:     route.ThemeRef,
		Path:      route.Path,
		Workspace: GetWorkspaceMergeData(workspace),
	})

}

func getNotFoundRoute(path string) *meta.Route {
	return &meta.Route{
		ViewRef:   "uesio/core.notfound",
		Namespace: "uesio/core",
		Path:      path,
		ThemeRef:  "uesio/core.default",
	}
}

func getLoginRoute(session *sess.Session) (*meta.Route, error) {
	loginRoute, err := meta.NewRoute(session.GetLoginRoute())
	if err != nil {
		return nil, err
	}
	err = bundle.Load(loginRoute, session)
	if err != nil {
		return nil, err
	}
	return loginRoute, nil
}

// HandleMissingRoute function
func HandleMissingRoute(w http.ResponseWriter, r *http.Request, session *sess.Session, path string, err error) {
	logger.LogWithTrace(r, "Error Getting Route: "+err.Error(), logger.INFO)
	// If our profile is the public profile, redirect to the login route
	if session.IsPublicProfile() {
		loginRoute, err := getLoginRoute(session)
		if err == nil {
			requestedPath := r.URL.Path
			redirectPath := "/" + loginRoute.Path
			if redirectPath != requestedPath {
				if requestedPath != "" && requestedPath != "/" {
					redirectPath = redirectPath + "?r=" + requestedPath
				}
				http.Redirect(w, r, redirectPath, 302)
				return
			}
		}
	}

	// If we're logged in, but still no route, return the uesio.notfound view
	ExecuteIndexTemplate(w, getNotFoundRoute(path), false, session)
}

// ServeRoute serves a route
func ServeRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	path := vars["route"]

	session := middleware.GetSession(r)
	prefix := strings.TrimSuffix(r.URL.Path, path)

	route, err := routing.GetRouteFromPath(r, namespace, path, prefix, session)
	if err != nil {
		HandleMissingRoute(w, r, session, path, err)
		return
	}

	ExecuteIndexTemplate(w, route, false, session)
}

// ServeLocalRoute serves a route
func ServeLocalRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["route"]

	session := middleware.GetSession(r)
	site := session.GetSite()

	route, err := routing.GetRouteFromPath(r, site.GetAppID(), path, "/", session)
	if err != nil {
		HandleMissingRoute(w, r, session, path, err)
		return
	}

	ExecuteIndexTemplate(w, route, false, session)
}
