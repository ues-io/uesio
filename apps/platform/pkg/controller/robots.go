package controller

import (
	"fmt"

	"io"
	"net/http"
	"sort"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

const (
	contentTypeHeader = "Content-Type"
	plainText         = "text/plain"
	defaultRobots     = `User-agent: *
Disallow: *`
	allowPath = "\nAllow: %s"
	filePath  = `/site/files/%s/*/%s`
)

var defaultRobotsBytes = []byte(defaultRobots)

func Robots(w http.ResponseWriter, r *http.Request) {

	// Required content type for Robots.txt!
	w.Header().Set(contentTypeHeader, plainText)
	// Always output the default "Deny All" policy
	w.Write(defaultRobotsBytes)

	// If the Site does not have SEO Enabled, or if the Site has no public profile,
	// return a canned file that disallows all indexing/crawling
	session := middleware.GetSession(r)
	contextSite := session.GetContextSite()
	publicProfileName := session.GetContextAppBundle().PublicProfile
	if contextSite == nil || !contextSite.EnableSEO || publicProfileName == "" {
		return
	}

	// If the home route is accessible by a guest, then we need to add it to the allowed paths
	homeRoute, _ := routing.GetHomeRoute(session)

	var routes meta.RouteCollection
	var files meta.FileCollection

	// Load all public routes to get their paths, along with public files.
	// We are assuming that a crawler would have a public guest session,
	// so we can just let our permissions system do the work of finding which routes/files are accessible)
	err := bundle.LoadAllFromAny(session.Context(), &routes, nil, session, nil)

	if err != nil || len(routes) == 0 {
		return
	}

	err = bundle.LoadAllFromAny(session.Context(), &files, nil, session, nil)

	if err != nil {
		return
	}

	// Append to the robots the routes we want to allow
	writeAllowedRoutePaths(w, getPublicRoutePaths(routes), homeRoute)
	writeAllowedCorePaths(w)
	writeAllowedStaticFiles(w, getPublicFilePaths(files))

}

func writeAllowPath(w io.Writer, path string) (int, error) {
	return w.Write(fmt.Appendf(nil, allowPath, path))
}

// Adds all JS/CSS/Fonts, favicon, and vendored asset routes
func writeAllowedCorePaths(w io.Writer) {
	writeAllowPath(w, "/static/vendor/*")
	writeAllowPath(w, "/*/static/ui/*")
	writeAllowPath(w, "/favicon.ico")
	writeAllowPath(w, "/site/componentpacks/*")
	writeAllowPath(w, "/site/fonts/*")
}

func writeAllowedStaticFiles(w io.Writer, publicFiles map[string]bool) {
	// To have a stable output, we need to sort the keys
	keys := goutils.MapKeys(publicFiles)
	sort.Strings(keys)
	for _, path := range keys {
		writeAllowPath(w, path)
	}
}

func writeAllowedRoutePaths(w io.Writer, publicRoutes map[string]bool, homeRoute *meta.Route) {
	// To have a stable output, we need to sort the keys
	keys := make([]string, 0, len(publicRoutes))
	addHomeRoute := false
	normalizedHomeRoutePath := ""
	if homeRoute != nil {
		normalizedHomeRoutePath = normalizePath(homeRoute.Path)
	}
	for k := range publicRoutes {
		keys = append(keys, k)
		if homeRoute != nil && k == normalizedHomeRoutePath {
			addHomeRoute = true
		}
	}
	sort.Strings(keys)
	for _, path := range keys {
		writeAllowPath(w, path)
	}
	// Add the home route last, only if it is accessible by a guest
	if addHomeRoute {
		// We need to add the end-of-line instruction $ because otherwise this would
		// functionally be a * that would cancel out our Disallow directive
		writeAllowPath(w, "/$")
	}
}

func normalizePath(path string) string {
	if !strings.HasPrefix(path, "/") {
		return "/" + path
	}
	return path
}

func getPublicRoutePaths(routes meta.RouteCollection) map[string]bool {
	publicRouteNames := map[string]bool{}

	// Build a unique list of public routes
	for _, route := range routes {
		path := route.Path
		// Trim the path to the first occurrence of a merge,
		// i.e. '/product/{productid}' --> '/product/'
		firstMergeIndex := strings.Index(path, "{")
		if firstMergeIndex > -1 {
			path = path[:firstMergeIndex]
		}
		publicRouteNames[normalizePath(path)] = true
	}
	return publicRouteNames
}

func getFilePath(appFullName, fileName string) string {
	return fmt.Sprintf(filePath, appFullName, fileName)
}

func getPublicFilePaths(files meta.FileCollection) map[string]bool {
	publicFilePaths := map[string]bool{}

	// Build a unique list of public file paths
	for _, file := range files {
		publicFilePaths[getFilePath(file.GetNamespace(), file.Name)] = true
	}
	return publicFilePaths
}
