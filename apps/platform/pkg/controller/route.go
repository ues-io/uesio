package controller

import (
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/usage"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"
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
	route, err := routing.GetRouteFromAssignment(r, collectionNamespace, collectionName, viewtype, id, session)
	if err != nil {
		handleApiNotFoundRoute(w, r, "", session)
		return
	}

	// Handle redirect routes
	if route.Type == "redirect" {
		handleRedirectAPIRoute(w, r, route, session)
		return
	}

	routingMergeData, err := getRouteAPIResult(route, session)
	if err != nil {
		handleApiErrorRoute(w, r, route.Path, session, err)
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
		handleApiNotFoundRoute(w, r, path, session)
		return
	}

	// Handle redirect routes
	if route.Type == "redirect" {
		handleRedirectAPIRoute(w, r, route, session)
		return
	}

	routingMergeData, err := getRouteAPIResult(route, session)
	if err != nil {
		handleApiErrorRoute(w, r, route.Path, session, err)
		return
	}

	file.RespondJSON(w, r, routingMergeData)

}

func handleApiErrorRoute(w http.ResponseWriter, r *http.Request, path string, session *sess.Session, err error) {
	routingMergeData, err := getRouteAPIResult(getErrorRoute(path, err.Error()), sess.GetAnonSession(session.GetSite()))
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	file.RespondJSON(w, r, routingMergeData)
}

func handleApiNotFoundRoute(w http.ResponseWriter, r *http.Request, path string, session *sess.Session) {
	routingMergeData, err := getRouteAPIResult(getNotFoundRoute(path), sess.GetAnonSession(session.GetSite()))
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	file.RespondJSON(w, r, routingMergeData)
}

func handleRedirectAPIRoute(w http.ResponseWriter, r *http.Request, route *meta.Route, session *sess.Session) {
	w.Header().Set("Cache-Control", "no-cache")

	mergedRouteRedirect, err := MergeRouteData(route.Redirect, &merge.ServerMergeData{
		Session: session,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// We need to send a 200 status, not 302, to prevent fetch API
	// from attempting to do its bad redirect behavior, which is not controllable.
	// (Ben: I also tried using "manual" and "error" for the fetch "redirect" properties,
	// but none of them provided the ability to capture the location header from the server
	// WITHOUT doing some unwanted browser behavior).
	http.Redirect(w, r, mergedRouteRedirect, http.StatusOK)
}

func getRouteAPIResult(route *meta.Route, session *sess.Session) (*routing.RouteMergeData, error) {

	depsCache, err := routing.GetMetadataDeps(route, session)
	if err != nil {
		return nil, err
	}

	return GetRoutingMergeData(route, depsCache, session)
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

func HandleErrorRoute(w http.ResponseWriter, r *http.Request, session *sess.Session, path string, err error, redirect bool) {
	logger.Log("Error Getting Route: "+err.Error(), logger.INFO)
	// If our profile is the public profile, redirect to the login route
	if redirect && session.IsPublicProfile() {
		if auth.RedirectToLoginRoute(w, r, session, auth.NotFound) {
			return
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
	path := vars["route"]
	session := middleware.GetSession(r)
	prefix := strings.TrimSuffix(r.URL.Path, path)
	serveRouteInternal(w, r, session, vars["namespace"], path, prefix)
}

func ServeLocalRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["route"]
	session := middleware.GetSession(r)
	serveRouteInternal(w, r, session, session.GetSite().GetAppFullName(), path, "/")
}

func serveRouteInternal(w http.ResponseWriter, r *http.Request, session *sess.Session, namespace, path, prefix string) {
	route, err := routing.GetRouteFromPath(r, namespace, path, prefix, session)
	if err != nil {
		HandleErrorRoute(w, r, session, path, err, true)
		return
	}

	usage.RegisterEvent("LOAD", "ROUTE", route.GetKey(), 0, session)
	// Handle redirect routes
	if route.Type == "redirect" {
		w.Header().Set("Cache-Control", "no-cache")

		mergedRouteRedirect, err := MergeRouteData(route.Redirect, &merge.ServerMergeData{
			Session: session,
		})
		if err != nil {
			HandleErrorRoute(w, r, session, path, err, true)
		}

		http.Redirect(w, r, mergedRouteRedirect, http.StatusFound)
		return
	}
	// Handle view routes
	depsCache, err := routing.GetMetadataDeps(route, session)
	if err != nil {
		HandleErrorRoute(w, r, session, path, err, false)
		return
	}

	ExecuteIndexTemplate(w, route, depsCache, false, session)
}
