package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getRoute(r *http.Request, namespace, path, prefix string, session *sess.Session) (*meta.Route, error) {
	var route *meta.Route
	var routes meta.RouteCollection

	err := bundle.LoadAll(&routes, namespace, nil, session)
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
			route = &item
			break
		}
	}

	if route == nil {
		return nil, errors.New("No Route Found in Cache")
	}

	// Cast the item to a route and add params
	route.Params = routematch.Vars
	route.Path = path

	return route, nil
}

// Route is good
func Route(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)

	namespace := vars["namespace"]
	path := vars["route"]

	session := middleware.GetSession(r)
	workspace := session.GetWorkspace()

	prefix := "/site/routes/" + namespace + "/"

	if workspace != nil {
		prefix = "/workspace/" + workspace.GetAppID() + "/" + workspace.Name + "/routes/" + namespace + "/"
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
		Theme:     route.ThemeRef,
		Path:      path,
		Workspace: GetWorkspaceMergeData(workspace),
	})

}

func getNotFoundRoute(path string) *meta.Route {
	return &meta.Route{
		ViewRef:   "uesio.notfound",
		Namespace: "uesio",
		Path:      path,
		ThemeRef:  "uesio.default",
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

	session := middleware.GetSession(r)
	site := session.GetSite()

	route, err := getRoute(r, site.AppID, path, "/", session)
	if err != nil {
		HandleMissingRoute(w, r, session, path, err)
		return
	}

	ExecuteIndexTemplate(w, route, false, session)
}
