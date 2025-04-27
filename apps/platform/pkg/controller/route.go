package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/usage"

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
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	route, err := routing.GetRouteFromAssignment(r, collectionNamespace, collectionName, viewtype, id, session, connection)
	if err != nil {
		handleApiNotFoundRoute(w, r, "", "", session)
		return
	}

	// Handle redirect routes
	if route.Type == "redirect" {
		handleRedirectAPIRoute(w, r, route, session)
		return
	}

	routingMergeData, err := getRouteAPIResult(route, session)
	if err != nil {
		handleApiErrorRoute(w, r, route.Path, route.Namespace, session, err)
		return
	}

	filejson.RespondJSON(w, r, routingMergeData)

}

func RouteByPath(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	namespace := vars["namespace"]
	path := vars["route"]

	session := middleware.GetSession(r)

	contextPrefix := session.GetContextURLPrefix()
	prefix := contextPrefix + "/routes/path/" + namespace + "/"

	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	route, err := routing.GetRouteFromPath(r, namespace, path, prefix, session, connection)
	if err != nil {
		handleApiNotFoundRoute(w, r, path, namespace, session)
		return
	}

	// Handle redirect routes
	if route.Type == "redirect" {
		handleRedirectAPIRoute(w, r, route, session)
		return
	}

	routingMergeData, err := getRouteAPIResult(route, session)
	if err != nil {
		handleApiErrorRoute(w, r, route.Path, namespace, session, err)
		return
	}

	filejson.RespondJSON(w, r, routingMergeData)

}

func RouteByKey(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	routeName := vars["name"]
	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	route, err := routing.GetRouteByKey(r, namespace, routeName, session, connection)
	if err != nil {
		handleApiNotFoundRoute(w, r, fmt.Sprintf("%s.%s", namespace, routeName), namespace, session)
		return
	}
	// Handle redirect routes
	if route.Type == "redirect" {
		handleRedirectAPIRoute(w, r, route, session)
		return
	}
	routingMergeData, err := getRouteAPIResult(route, session)
	if err != nil {
		handleApiErrorRoute(w, r, route.Path, namespace, session, err)
		return
	}
	filejson.RespondJSON(w, r, routingMergeData)
}

func handleApiErrorRoute(w http.ResponseWriter, r *http.Request, path, namespace string, session *sess.Session, err error) {
	if routingMergeData, err := getRouteAPIResult(GetErrorRoute(path, namespace, err.Error()), sess.GetAnonSessionFrom(session)); err != nil {
		ctlutil.HandleError(w, err)
	} else {
		filejson.RespondJSON(w, r, routingMergeData)
	}
}

func handleApiNotFoundRoute(w http.ResponseWriter, r *http.Request, path, namespace string, session *sess.Session) {
	if routingMergeData, err := getRouteAPIResult(
		getNotFoundRoute(path, namespace, "you may need to log in again.", "true"),
		sess.GetAnonSessionFrom(session),
	); err != nil {
		ctlutil.HandleError(w, err)
	} else {
		filejson.RespondJSON(w, r, routingMergeData)
	}
}

func handleRedirectAPIRoute(w http.ResponseWriter, r *http.Request, route *meta.Route, session *sess.Session) {
	middleware.SetNoCache(w)

	mergedRouteRedirect, err := MergeRouteData(route.Redirect, &merge.ServerMergeData{
		Session: session,
	})
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	// We need to send a 200 status, not 302, to prevent fetch API
	// from attempting to do its bad redirect behavior, which is not controllable.
	// (Ben: I also tried using "manual" and "error" for the fetch "redirect" properties,
	// but none of them provided the ability to capture the location header from the server
	// WITHOUT doing some unwanted browser behavior).
	http.Redirect(w, r, mergedRouteRedirect, http.StatusOK)
}

func getRouteAPIResult(route *meta.Route, session *sess.Session) (*preload.RouteMergeData, error) {
	usage.RegisterEvent("LOAD", "ROUTE", route.GetKey(), 0, session)
	depsCache, err := routing.GetMetadataDeps(route, session)
	if err != nil {
		return nil, err
	}

	return GetRoutingMergeData(route, depsCache, session)
}

func getNotFoundRoute(path, namespace, err, displayButton string) *meta.Route {
	params := map[string]any{"error": err, "title": "Nothing to see here.", "icon": "😞", "displayButton": displayButton}
	if namespace == "" {
		namespace = "uesio/core"
	}
	return &meta.Route{
		ViewRef: "uesio/core.error",
		BundleableBase: meta.BundleableBase{
			Namespace: namespace,
		},
		Path:     path,
		ThemeRef: "uesio/core.default",
		Params:   params,
		Title:    "Not Found",
	}
}

func GetErrorRoute(path, namespace, err string) *meta.Route {
	params := map[string]any{"error": err, "title": "Error", "icon": "🤯", "displayButton": "false"}
	if namespace == "" {
		namespace = "uesio/core"
	}
	return &meta.Route{
		ViewRef: "uesio/core.error",
		BundleableBase: meta.BundleableBase{
			Namespace: namespace,
		},
		Path:     path,
		ThemeRef: "uesio/core.default",
		Params:   params,
		Title:    "Error",
	}
}

type errorResponse struct {
	Code    int    `json:"code"`
	Status  string `json:"status"`
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

func HandleErrorRoute(w http.ResponseWriter, r *http.Request, session *sess.Session, path string, namespace string, incomingErr error, redirect bool) {
	slog.Debug("error getting route: " + incomingErr.Error())

	// If this is an invalid param exception

	// If our profile is the public profile, redirect to the login route
	if redirect && session.IsPublicProfile() {
		if auth.RedirectToLoginRoute(w, r, session, auth.NotFound) {
			return
		}
	}

	var route *meta.Route
	if redirect {
		showButton := "false"
		if exceptions.IsType[*exceptions.UnauthorizedException](incomingErr) || exceptions.IsType[*exceptions.ForbiddenException](incomingErr) {
			showButton = "true"
		}
		route = getNotFoundRoute(path, namespace, incomingErr.Error(), showButton)
	} else {
		route = GetErrorRoute(path, namespace, incomingErr.Error())
	}

	var errorSession *sess.Session

	// If we're in a workspace context, just use the workspace session.
	if session.GetWorkspace() != nil {
		errorSession = session
	} else {
		// Otherwise, Enter into a version context to display the error page
		versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
		if err != nil {
			ctlutil.HandleError(w, fmt.Errorf("error getting version session: %w", err))
			return
		}
		errorSession = versionSession
	}

	depsCache, err := routing.GetMetadataDeps(route, errorSession)
	if err != nil {
		ctlutil.HandleError(w, fmt.Errorf("error getting error route metadata: %w", err))
		return
	}

	// This method is usually used for returning "not found" ctlutil, so if we can't derive a more specific error code,
	// default to 404, but ideally we would have a more specific code here.
	statusCode := exceptions.GetStatusCodeForError(incomingErr)
	if statusCode == http.StatusInternalServerError {
		statusCode = http.StatusNotFound
	}
	acceptHeader := r.Header.Get("Accept")
	// Only serve an HTML response to user-agents who are requesting HTML (e.g. browsers)
	// otherwise, don't serve any content at all, just return the status code
	if strings.Contains(acceptHeader, "html") {
		// Must write status code BEFORE executing index template
		w.WriteHeader(statusCode)
		ExecuteIndexTemplate(w, route, depsCache, false, session)
		return
	}
	// Respond with a structured JSON error response
	w.WriteHeader(statusCode)
	filejson.RespondJSON(w, r, getErrorResponse(incomingErr, statusCode))
}

func getErrorResponse(err error, statusCode int) *errorResponse {
	resp := &errorResponse{
		Code:   statusCode,
		Status: strings.Replace(http.StatusText(statusCode), strconv.Itoa(statusCode), "", 1),
		Error:  err.Error(),
	}
	var paramException *exceptions.InvalidParamException
	if errors.As(err, &paramException) && paramException.Details != "" {
		resp.Details = paramException.Details
	}
	return resp
}

func ServeRouteByKey(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	routeName := vars["name"]
	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		HandleErrorRoute(w, r, session, r.URL.Path, namespace, err, true)
		return
	}
	route, err := routing.GetRouteByKey(r, namespace, routeName, session, connection)
	if err != nil {
		handleApiNotFoundRoute(w, r, fmt.Sprintf("%s.%s", namespace, routeName), namespace, session)
		return
	}
	ServeRouteInternal(w, r, session, route.Path, route)
}

func ServeRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["route"]
	session := middleware.GetSession(r)
	prefix := strings.TrimSuffix(r.URL.Path, path)
	if route, err := fetchRoute(w, r, session, vars["namespace"], path, prefix); err == nil {
		ServeRouteInternal(w, r, session, path, route)
	}
}

func ServeLocalRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["route"]
	session := middleware.GetSession(r)
	if route, err := fetchRoute(w, r, session, session.GetSite().GetAppFullName(), path, "/"); err == nil {
		ServeRouteInternal(w, r, session, path, route)
	}
}

func fetchRoute(w http.ResponseWriter, r *http.Request, session *sess.Session, namespace, path, prefix string) (*meta.Route, error) {
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		HandleErrorRoute(w, r, session, path, namespace, err, true)
		return nil, err
	}
	route, err := routing.GetRouteFromPath(r, namespace, path, prefix, session, connection)
	if err != nil {
		HandleErrorRoute(w, r, session, path, namespace, err, true)
		return nil, err
	}
	return route, nil
}

func ServeRouteInternal(w http.ResponseWriter, r *http.Request, session *sess.Session, path string, route *meta.Route) {
	usage.RegisterEvent("LOAD", "ROUTE", route.GetKey(), 0, session)
	var err error
	switch route.Type {
	case "redirect":
		// Handle redirect routes
		middleware.SetNoCache(w)
		mergedRouteRedirect, err := MergeRouteData(route.Redirect, &merge.ServerMergeData{
			Session: session,
		})
		if err != nil {
			HandleErrorRoute(w, r, session, path, route.Namespace, err, true)
			return
		}
		http.Redirect(w, r, mergedRouteRedirect, http.StatusFound)
		return
	case "bot":
		response := route.GetResponse()
		statusCode := response.StatusCode
		if statusCode == 0 {
			statusCode = http.StatusOK
		}
		// For the future: also support response.RedirectRoute
		// load the route, find its path, and redirect the user there
		if response.RedirectURL != "" {
			if statusCode < 300 {
				statusCode = http.StatusFound
			}
			http.Redirect(w, r, response.RedirectURL, statusCode)
			return
		} else if response.Body != nil {
			// Perform appropriate serialization if needed
			contentType := response.Headers.Get(contentTypeHeader)
			var marshalled []byte
			if strings.Contains(contentType, "json") {
				if _, isString := response.Body.(string); !isString {
					marshalled, err = json.Marshal(response.Body)
					if err != nil {
						ctlutil.HandleError(w, err)
						return
					}
				}
			} else {
				// Otherwise, just write the thing as text
				marshalled = fmt.Appendf(nil, "%v", response.Body)
			}
			if marshalled != nil {
				if _, err = w.Write(marshalled); err != nil {
					ctlutil.HandleError(w, err)
					return
				}
			}
		}
		w.WriteHeader(statusCode)
		return
	default:
		// Handle view routes
		depsCache, err := routing.GetMetadataDeps(route, session)
		if err != nil {
			HandleErrorRoute(w, r, session, path, route.Namespace, err, false)
			return
		}
		ExecuteIndexTemplate(w, route, depsCache, false, session)
	}
}
