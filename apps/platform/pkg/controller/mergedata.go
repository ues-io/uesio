package controller

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	// Using text/template here instead of html/template
	// because we trust both the template and the merge data
	"text/template"
	"time"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"

	"github.com/thecloudmasters/uesio/pkg/adapt"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

var indexTemplate *template.Template

func init() {
	wd, _ := os.Getwd()
	baseDir := wd
	// Handle path resolution issues when running tests
	if strings.Contains(wd, filepath.Join("pkg", "")) {
		baseDir = filepath.Join(wd, "..", "..")
	}
	indexPath := filepath.Join(baseDir, "platform", "index.gohtml")
	cssPath := filepath.Join(baseDir, "..", "..", "dist", "vendor", "fonts", "fonts.css")
	indexTemplate = template.Must(template.New("index.gohtml").Funcs(template.FuncMap{
		"getComponentPackURLs": getComponentPackURLs,
	}).ParseFiles(indexPath, cssPath))
}

func getComponentPackURLs(componentPackDeps *routing.MetadataMergeData, workspace *routing.WorkspaceMergeData, site *routing.SiteMergeData) []string {
	allDeps := componentPackDeps.GetItems()
	packUrls := make([]string, len(allDeps))
	for i, packDep := range allDeps {
		key := packDep.GetKey()
		var packModstamp int64
		if pack, ok := packDep.(*meta.ComponentPack); ok {
			packModstamp = pack.UpdatedAt
		} else {
			packModstamp = time.Now().Unix()
		}
		packUrls[i] = getPackUrl(key, packModstamp, workspace, site)
	}
	return packUrls
}

func getPackUrl(key string, packModstamp int64, workspace *routing.WorkspaceMergeData, site *routing.SiteMergeData) string {
	namespace, name, err := meta.ParseKey(key)
	if err != nil {
		return ""
	}
	user, namepart, err := meta.ParseNamespace(namespace)
	if err != nil {
		return ""
	}

	filePath := "runtime.js"

	if workspace != nil {
		// If we are in a workspace context, use component pack modstamps to load in their resources,
		// since we don't have a stable "site" version that we can safely use, as the bundle dependency list is not immutable.
		return fmt.Sprintf("/workspace/%s/%s/componentpacks/%s/%s/%d/%s/%s", workspace.App, workspace.Name, user, namepart, packModstamp, name, filePath)
	}

	siteBundleVersion := ""

	// Handle requests for system bundles specially,
	// since we don't update their bundle dependencies at all and just use dummy "v0.0.1" everywhere
	if bundlestore.IsSystemBundle(namespace) {
		if file.GetAssetsPath() != "" {
			// We DO update the static assets version for the whole Docker image, so use that if we have it
			siteBundleVersion = file.GetAssetsPath() // assets path SHOULD have a leading / already
		} else if packModstamp != 0 {
			// If we don't have a Git sha, then we are in local development,
			// in which case we want to use the system pack modstamp to avoid stale file loads
			siteBundleVersion = fmt.Sprintf("/%d", packModstamp)
		}
	} else {
		// NON-system bundles
		if namespace == site.App {
			// If requested namespace is the app's name, use the site version
			siteBundleVersion = fmt.Sprintf("/%s", site.Version)
		} else if site.Dependencies != nil {
			// For all other deps, use the site's declared bundle dependency version,
			// which SHOULD be present (otherwise how are they using it...)
			if dep, found := site.Dependencies[namespace]; found && dep.Version != "" {
				siteBundleVersion = "/" + dep.Version
			}
		}
	}

	// If we still don't have a bundle version, for some bizarre reason...
	if siteBundleVersion == "" {
		if packModstamp != 0 {
			// Prefer modstamp
			siteBundleVersion = fmt.Sprintf("/%d", packModstamp)
		} else if site.Version != "" {
			// Final fallback --- use site version
			siteBundleVersion = fmt.Sprintf("/%s", site.Version)
		}
	}

	return fmt.Sprintf("/site/componentpacks/%s%s/%s/%s", namespace, siteBundleVersion, name, filePath)

}

func GetSessionMergeData(session *sess.Session) *routing.SessionMergeData {
	return &routing.SessionMergeData{
		Hash: session.GetSessionIdHash(),
	}

}

func GetUserMergeData(session *sess.Session) *routing.UserMergeData {
	userInfo := session.GetContextUser()
	userPicture := userInfo.GetPicture()
	userMergeData := &routing.UserMergeData{
		ID:        userInfo.ID,
		Username:  userInfo.UniqueKey,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Profile:   userInfo.Profile,
		Site:      session.GetSite().ID,
		Language:  userInfo.Language,
	}
	if userPicture != nil {
		userMergeData.Picture = &routing.UserPictureMergeData{
			ID:        userPicture.ID,
			UpdatedAt: userPicture.UpdatedAt,
		}
	}
	return userMergeData
}

func GetWorkspaceMergeData(workspace *meta.Workspace) *routing.WorkspaceMergeData {
	if workspace == nil {
		return nil
	}

	return &routing.WorkspaceMergeData{
		Name:    workspace.Name,
		App:     workspace.GetAppFullName(),
		Wrapper: routing.DEFAULT_BUILDER_COMPONENT,
	}
}

func MergeRouteData(mergeableText string, mergeData *merge.ServerMergeData) (string, error) {

	// No need to merge if no merge syntax
	if !strings.Contains(mergeableText, "{") {
		return mergeableText, nil
	}

	template, err := templating.NewWithFuncs(mergeableText, templating.ForceErrorFunc, merge.ServerMergeFuncs)
	if err != nil {
		return "", err
	}

	return templating.Execute(template, mergeData)
}

func GetRoutingMergeData(route *meta.Route, metadata *routing.PreloadMetadata, session *sess.Session) (*routing.RouteMergeData, error) {

	// Prepare wire data for server merge data
	wireData := map[string]meta.Group{}
	if metadata != nil && metadata.Wire != nil {
		for _, entity := range metadata.Wire.GetItems() {
			wire := entity.(*adapt.LoadOp)
			wireData[wire.WireName] = wire.Collection
		}
	}

	serverMergeData := &merge.ServerMergeData{
		Session:     session,
		ParamValues: route.Params,
		WireData:    wireData,
	}

	// Default if no text
	routeTitle := route.Title
	if routeTitle == "" {
		routeTitle = "Uesio"
	}

	mergedRouteTitle, err := MergeRouteData(routeTitle, serverMergeData)
	if err != nil {
		return nil, err
	}

	var mergedRouteTags []meta.Tag

	if len(route.Tags) > 0 {
		for _, tag := range route.Tags {
			mergedContent, err := MergeRouteData(tag.Content, serverMergeData)
			if err == nil {
				mergedRouteTags = append(mergedRouteTags, meta.Tag{
					Type:     tag.Type,
					Location: tag.Location,
					Name:     tag.Name,
					Content:  mergedContent,
				})
			} else {
				return nil, err
			}
		}
	}

	return &routing.RouteMergeData{
		View:         route.ViewRef,
		Params:       route.Params,
		Namespace:    route.Namespace,
		Path:         route.Path,
		Workspace:    GetWorkspaceMergeData(session.GetWorkspace()),
		Theme:        route.ThemeRef,
		Dependencies: metadata,
		Title:        mergedRouteTitle,
		Tags:         mergedRouteTags,
	}, err
}

func GetSiteMergeData(site *meta.Site) *routing.SiteMergeData {
	return &routing.SiteMergeData{
		Name:         site.Name,
		App:          site.GetAppFullName(),
		Subdomain:    site.Subdomain,
		Domain:       site.Domain,
		Version:      site.Bundle.GetVersionString(),
		Title:        site.Title,
		EnableSEO:    site.EnableSEO,
		Dependencies: site.GetAppBundle().Dependencies,
	}
}

func ExecuteIndexTemplate(w http.ResponseWriter, route *meta.Route, preload *routing.PreloadMetadata, buildMode bool, session *sess.Session) {

	// #2783 Prevent 3rd party sites from iframing Uesio
	// Add a content security policy header to prevent any other sites from iframing this site
	// TODO: make this configurable by site (see issue #2782)
	w.Header().Set("content-security-policy", "frame-ancestors 'none';")

	w.Header().Set("content-type", "text/html")

	site := session.GetSite()

	routingMergeData, err := GetRoutingMergeData(route, preload, session)
	if err != nil {
		HandleError(w, errors.New("Error getting route merge data: "+err.Error()))
		return
	}

	vendorScriptUrls := file.GetVendorScriptUrls()

	mergeData := routing.MergeData{
		Route:               routingMergeData,
		User:                GetUserMergeData(session),
		Session:             GetSessionMergeData(session),
		Site:                GetSiteMergeData(site),
		PreloadMetadata:     preload,
		MonacoEditorVersion: file.GetMonacoEditorVersion(),
		StaticAssetsPath:    file.GetAssetsPath(),
		StaticAssetsHost:    file.GetAssetsHost(),
		VendorScriptUrls:    vendorScriptUrls,
	}
	// Initiate early preloads of all vendor scripts via Link headers
	// TODO: Header order seems to be non-deterministic, so unless we can guarantee the order, or load these as modules
	// which get invoked in a fixed order later on, we can't use this approach for things like React/ReactDOM
	// for _, script := range vendorScriptUrls {
	// 	w.Header().Add("Link", fmt.Sprintf("<%s>; rel=preload; as=script", script))
	// }

	if err = indexTemplate.Execute(w, mergeData); err != nil {
		HandleError(w, errors.New("Error merging template: "+err.Error()))
		return
	}
}
