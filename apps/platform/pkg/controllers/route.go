package controllers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getRoute(r *http.Request, namespace, path, prefix string, session *sess.Session) (*metadata.Route, error) {
	var route metadata.Route
	var routes metadata.RouteCollection

	err := bundles.LoadAll(&routes, namespace, nil, session)
	if err != nil {
		return nil, err
	}

	router := mux.NewRouter()

	for _, item := range routes {
		router.Path(prefix + item.Path)
	}

	routematch := &mux.RouteMatch{}

	matched := router.Match(r, routematch)

	if !matched {
		return nil, errors.New("No Route Match Found: " + path)
	}

	pathTemplate, err := routematch.Route.GetPathTemplate()
	if err != nil {
		return nil, errors.New("No Path Template For Route Found")
	}

	pathTemplate = strings.Replace(pathTemplate, prefix, "", 1)

	for _, item := range routes {
		if item.Path == pathTemplate {
			route = item
			break
		}
	}

	if &route == nil {
		return nil, errors.New("No Route Found in Cache")
	}

	// Cast the item to a route and add params
	route.Params = routematch.Vars
	route.Path = path

	return &route, nil
}

// RouteAPI is good
func RouteAPI(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)

	namespace := vars["namespace"]
	path := vars["route"]

	session := middlewares.GetSession(r)
	workspace := session.GetWorkspace()

	prefix := "/site/routes/" + namespace + "/"

	if workspace != nil {
		prefix = "/workspace/" + workspace.AppRef + "/" + workspace.Name + "/routes/" + namespace + "/"
	}

	route, err := getRoute(r, namespace, path, prefix, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		respondJSON(w, r, &RouteMergeData{
			View:  "uesio.notfound",
			Theme: "uesio.default",
		})
		return
	}

	respondJSON(w, r, &RouteMergeData{
		View:      route.ViewRef,
		Params:    route.Params,
		Namespace: route.Namespace,
		Path:      path,
		Workspace: GetWorkspaceMergeData(workspace),
	})

}

func getNotFoundRoute(path string) *metadata.Route {
	return &metadata.Route{
		ViewRef:   "uesio.notfound",
		Namespace: "uesio",
		Path:      path,
		ThemeRef:  "uesio.default",
	}
}

func getLoginRoute(session *sess.Session) (*metadata.Route, error) {
	loginRoute, err := metadata.NewRoute(session.GetLoginRoute())
	if err != nil {
		return nil, err
	}
	err = bundles.Load(loginRoute, session)
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
			if requestedPath != "" && requestedPath != "/" {
				redirectPath = redirectPath + "?r=" + requestedPath
			}
			if redirectPath != requestedPath {
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

	session := middlewares.GetSession(r)
	prefix := strings.TrimSuffix(r.URL.Path, path)

	route, err := getRoute(r, namespace, path, prefix, session)
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

	session := middlewares.GetSession(r)
	site := session.GetSite()

	route, err := getRoute(r, site.AppRef, path, "/", session)
	if err != nil {
		HandleMissingRoute(w, r, session, path, err)
		return
	}

	ExecuteIndexTemplate(w, route, false, session)
}
