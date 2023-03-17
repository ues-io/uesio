package controller

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"io"
	"net/http"
	"sort"
	"strings"
)

const (
	contentTypeHeader = "Content-Type"
	plainText         = "text/plain"
	defaultRobots     = `User-agent: *
Disallow: /`
	allowPath = "\nAllow: %s"
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

	var routes meta.RouteCollection

	// Load all public routes to get their paths. We are assuming that a crawler would have a public guest session,
	// so we can just let our permissions system do the work of finding which routes are accessible)
	err := bundle.LoadAllFromAny(&routes, nil, session, nil)

	if err != nil || len(routes) == 0 {
		return
	}

	// Append to the robots the routes we want to allow
	writeAllowPaths(w, getPublicRoutePaths(routes))

}

func writeAllowPaths(w io.Writer, publicRoutes map[string]bool) {
	// To have a stable output, we need to sort the keys
	keys := make([]string, 0, len(publicRoutes))
	for k, _ := range publicRoutes {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, path := range keys {
		w.Write([]byte(fmt.Sprintf(allowPath, path)))
	}
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
		if !strings.HasPrefix(path, "/") {
			path = fmt.Sprintf("/%s", path)
		}
		publicRouteNames[path] = true
	}
	return publicRouteNames
}
