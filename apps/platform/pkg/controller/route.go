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

func getHomeRoute(session *sess.Session) (*meta.Route, error) {
	homeRoute := session.GetSite().GetAppBundle().HomeRoute
	namespace, name, err := meta.ParseKey(homeRoute)
	if err != nil {
		return nil, err
	}
	route := &meta.Route{
		Name:      name,
		Namespace: namespace,
	}
	err = bundle.Load(route, session)
	if err != nil {
		return nil, err
	}

	return route, nil
}

func getRoute(r *http.Request, namespace, path, prefix string, session *sess.Session) (*meta.Route, error) {
	var route *meta.Route
	var routes meta.RouteCollection

	if path == "" {
		return getHomeRoute(session)
	}

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
func getCollectionRoute(r *http.Request, namespace, collection string, viewtype string, session *sess.Session) (*meta.Route, error) {
	var routes meta.RouteCollection
	err := bundle.LoadAll(&routes, namespace, meta.BundleConditions{
		"studio.collection": namespace + "." + collection,
		"studio.viewtype": viewtype,
	}, session)

	if err != nil {
		return nil, err
	}
	return &routes[0], nil
}

func GetStringInBetween(str string, start string, end string) (result string) {
	s := strings.Index(str, start)
	if s == -1 {
		return
	}
	s += len(start)
	e := strings.Index(str[s:], end)
	if e == -1 {
		return
	}
	return str[s : s+e]
}



func CollectionRoute(viewType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request)   {
		vars := mux.Vars(r)
		collectionName := vars["name"]
		namespace := vars["namespace"]
		id := vars["id"]
	
		session := middleware.GetSession(r)
		workspace := session.GetWorkspace()
		route, err := getCollectionRoute(r, namespace, collectionName, viewType, session)
	
		if err != nil {
			logger.LogErrorWithTrace(r, err)
			respondJSON(w, r, &RouteMergeData{
				View:  "uesio.notfound",
				Theme: "uesio.default",
			})
			return
		}

		// We need 1 param in the path to assign the id to when in detail view
		if (viewType == "detail") {
			paramsCount := strings.Count(route.Path, "{")
			if paramsCount > 1 || paramsCount == 0  {
				respondJSON(w, r, &RouteMergeData{
					View:  "uesio.notfound",
					Theme: "uesio.default",
				})
				return
			}
		}
	

		idParamName := GetStringInBetween(route.Path, "{", "}")
		params := make(map[string]string)
		params[idParamName] = id

		respondJSON(w, r, &RouteMergeData{
			View:      route.ViewRef,
			Params:    params,
			Namespace: route.Namespace,
			Theme:     route.ThemeRef,
			Path:      strings.Replace(route.Path, "{" + idParamName + "}", id, 1),
			Workspace: GetWorkspaceMergeData(workspace),
		})
	
	}
}

// Route is good
func Route(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	namespace := vars["namespace"]
	path := vars["route"]

	session := middleware.GetSession(r)
	workspace := session.GetWorkspace()

	prefix := "/site/routes/" + namespace + "/path/"

	if workspace != nil {
		prefix = "/workspace/" + workspace.GetAppID() + "/" + workspace.Name + "/routes/" + namespace + "/path/"
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

	route, err := getRoute(r, site.GetAppID(), path, "/", session)
	if err != nil {
		HandleMissingRoute(w, r, session, path, err)
		return
	}

	ExecuteIndexTemplate(w, route, false, session)
}
