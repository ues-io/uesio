package controllers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

func getRoute(r *http.Request, namespace, path, prefix string, site *metadata.Site, sess *session.Session) (*metadata.Route, error) {
	var route metadata.Route
	var routes metadata.RouteCollection

	err := datasource.LoadMetadataCollection(&routes, namespace, nil, site, sess)
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
		return nil, errors.New("No Route Match Found")
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

func respondWithRoute(response *RouteMergeData, w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode(response)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// RouteAPI is good
func RouteAPI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/yaml")

	vars := mux.Vars(r)

	namespace := vars["namespace"]
	path := vars["route"]

	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	prefix := "/site/routes/" + namespace + "/"

	if site.Workspace != nil {
		prefix = "/workspace/" + site.Workspace.AppRef + "/" + site.Workspace.Name + "/routes/" + namespace + "/"
	}

	route, err := getRoute(r, namespace, path, prefix, site, sess)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		// Respond with the notfound view which is publicly accessible
		respondWithRoute(&RouteMergeData{
			ViewName:      "notfound",
			ViewNamespace: "uesio",
		}, w, r)
		return
	}

	viewNamespace, viewName, err := metadata.ParseKey(route.ViewRef)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	respondWithRoute(&RouteMergeData{
		ViewName:      viewName,
		ViewNamespace: viewNamespace,
		Params:        route.Params,
		Namespace:     route.Namespace,
		Path:          path,
		Workspace:     GetWorkspaceMergeData(site),
	}, w, r)

}

// RedirectToLogin function
func RedirectToLogin(w http.ResponseWriter, r *http.Request) {
	// TODO: This is special. NOTHING SPECIAL!
	redirectPath := "/login"
	if r.URL.Path != "" && r.URL.Path != "/" {
		redirectPath = redirectPath + "?r=" + r.URL.Path
	}
	http.Redirect(w, r, redirectPath, 302)
}

// ServeRoute serves a route
func ServeRoute() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		path := vars["route"]

		site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
		sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

		prefix := "/app/" + namespace + "/"

		if site.Workspace != nil {
			prefix = "/workspace/" + site.Workspace.AppRef + "/" + site.Workspace.Name + prefix
		}

		route, err := getRoute(r, namespace, path, prefix, site, sess)
		if err != nil {
			logger.LogErrorWithTrace(r, err)
			RedirectToLogin(w, r)
			return
		}

		ExecuteIndexTemplate(w, route, false, site, sess)
	}
}

// ServeLocalRoute serves a route
func ServeLocalRoute() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		path := vars["route"]

		site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
		sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

		route, err := getRoute(r, site.AppRef, path, "/", site, sess)
		if err != nil {
			logger.LogWithTrace(r, "Error Getting Route: "+err.Error(), logger.INFO)
			RedirectToLogin(w, r)
			return
		}

		ExecuteIndexTemplate(w, route, false, site, sess)
	}
}
