package controller

import (
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func RouteAssignment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collectionName := vars["name"]
	collectionNamespace := vars["namespace"]
	id := vars["id"]
	viewtype := vars["viewtype"]

	session := middleware.GetSession(r)
	workspace := session.GetWorkspace()
	route, err := routing.GetRouteFromAssignment(r, collectionNamespace, collectionName, viewtype, id, session)
	if err != nil {
		logger.LogError(err)
		file.RespondJSON(w, r, &routing.RouteMergeData{
			View:  "uesio/core.notfound",
			Theme: "uesio/core.default",
			Title: "Not Found",
		})
		return
	}

	depsCache, err := routing.GetMetadataDeps(route, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	routingMergeData, err := GetRoutingMergeData(route, workspace, depsCache, session)
	// TODO: Display Internal Server Error page???
	if err != nil {
		logger.LogError(err)
		return
	}

	file.RespondJSON(w, r, routingMergeData)

}

func Route(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	namespace := vars["namespace"]
	path := vars["route"]

	session := middleware.GetSession(r)
	workspace := session.GetWorkspace()

	prefix := "/site/routes/path/" + namespace + "/"

	if workspace != nil {
		prefix = "/workspace/" + workspace.GetAppFullName() + "/" + workspace.Name + "/routes/path/" + namespace + "/"
	}

	route, err := routing.GetRouteFromPath(r, namespace, path, prefix, session)
	if err != nil {
		logger.LogError(err)
		file.RespondJSON(w, r, &routing.RouteMergeData{
			View:  "uesio/core.notfound",
			Theme: "uesio/core.default",
		})
		return
	}

	depsCache, err := routing.GetMetadataDeps(route, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	routingMergeData, err := GetRoutingMergeData(route, workspace, depsCache, session)
	// TODO: Display Internal Server Error page???
	if err != nil {
		logger.LogError(err)
		return
	}

	file.RespondJSON(w, r, routingMergeData)

}

func getNotFoundRoute(path string) *meta.Route {
	return &meta.Route{
		ViewRef: "uesio/core.notfound",
		BundleableBase: meta.BundleableBase{
			Namespace: "uesio/core",
		},
		Path:     path,
		ThemeRef: "uesio/core.default",
		Title:    "Not Found",
	}
}

func getErrorRoute(path string, err string) *meta.Route {
	params := map[string]string{"error": err}
	return &meta.Route{
		ViewRef: "uesio/core.error",
		BundleableBase: meta.BundleableBase{
			Namespace: "uesio/core",
		},
		Path:     path,
		ThemeRef: "uesio/core.default",
		Params:   params,
		Title:    "Error",
	}
}

func getLoginRoute(session *sess.Session) (*meta.Route, error) {
	loginRoute, err := meta.NewRoute(session.GetLoginRoute())
	if err != nil {
		return nil, err
	}
	err = bundle.Load(loginRoute, session, nil)
	if err != nil {
		return nil, err
	}
	return loginRoute, nil
}

func HandleErrorRoute(w http.ResponseWriter, r *http.Request, session *sess.Session, path string, err error, redirect bool) {
	logger.Log("Error Getting Route: "+err.Error(), logger.INFO)
	// If our profile is the public profile, redirect to the login route
	if redirect && session.IsPublicProfile() {
		loginRoute, err := getLoginRoute(session)
		if err == nil {
			requestedPath := r.URL.Path
			redirectPath := "/" + loginRoute.Path
			if redirectPath != requestedPath {
				if requestedPath != "" && requestedPath != "/" {
					redirectPath = redirectPath + "?r=" + requestedPath
				}
				http.Redirect(w, r, redirectPath, http.StatusFound)
				return
			}
		}
	}

	var route *meta.Route
	if redirect {
		route = getNotFoundRoute(path)
	} else {
		route = getErrorRoute(path, err.Error())
	}

	// We can upgrade to the site session so we can be sure to have access to the not found route
	adminSession := sess.GetAnonSession(session.GetSite())
	depsCache, _ := routing.GetMetadataDeps(route, adminSession)

	acceptHeader := r.Header.Get("Accept")
	// Only serve an HTML response to user-agents who are requesting HTML (e.g. browsers)
	// otherwise, don't serve any content at all, just return 404 status code
	if strings.Contains(acceptHeader, "html") {
		// Must write 404 status BEFORE executing index template
		w.WriteHeader(http.StatusNotFound)
		ExecuteIndexTemplate(w, route, depsCache, false, adminSession)
		return
	}
	http.Error(w, "Not Found", http.StatusNotFound)
}

func ServeRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	path := vars["route"]

	session := middleware.GetSession(r)
	prefix := strings.TrimSuffix(r.URL.Path, path)

	route, err := routing.GetRouteFromPath(r, namespace, path, prefix, session)
	if err != nil {
		HandleErrorRoute(w, r, session, path, err, true)
		return
	}

	depsCache, err := routing.GetMetadataDeps(route, session)
	if err != nil {
		HandleErrorRoute(w, r, session, path, err, false)
		return
	}

	ExecuteIndexTemplate(w, route, depsCache, false, session)
}

func ServeLocalRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["route"]

	session := middleware.GetSession(r)
	site := session.GetSite()

	route, err := routing.GetRouteFromPath(r, site.GetAppFullName(), path, "/", session)
	if err != nil {
		HandleErrorRoute(w, r, session, path, err, true)
		return
	}

	depsCache, err := routing.GetMetadataDeps(route, session)
	if err != nil {
		HandleErrorRoute(w, r, session, path, err, false)
		return
	}

	ExecuteIndexTemplate(w, route, depsCache, false, session)
}
