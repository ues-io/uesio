package controller

import (
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
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

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
	indexTemplate = template.Must(template.New("index.gohtml").Funcs(template.FuncMap{
		"getComponentPackURLs":      getComponentPackURLs,
		"getComponentPackStyleURLs": getComponentPackStyleURLs,
		"getFontCSSURLs":            getFontCSSURLs,
	}).ParseFiles(indexPath))
}

func getComponentPackURLs(componentPackDeps *preload.MetadataMergeData, workspace *preload.WorkspaceMergeData, site *preload.SiteMergeData) []string {
	allDeps := componentPackDeps.GetItems()
	packUrls := make([]string, len(allDeps))
	for i, packDep := range allDeps {
		key := packDep.GetKey()
		var packModstamp int64
		workspaceMergeData := workspace
		if pack, ok := packDep.(*meta.ComponentPack); ok {
			packModstamp = pack.UpdatedAt
			if pack.SiteOnly {
				workspaceMergeData = nil
			}
		} else {
			packModstamp = time.Now().Unix()
		}

		packUrls[i] = getPackUrl(key, packModstamp, workspaceMergeData, site, "runtime.js")
	}
	return packUrls
}

func getComponentPackStyleURLs(componentPackDeps *preload.MetadataMergeData, workspace *preload.WorkspaceMergeData, site *preload.SiteMergeData) []string {
	allDeps := componentPackDeps.GetItems()
	packUrls := []string{}
	for _, packDep := range allDeps {
		key := packDep.GetKey()
		var packModstamp int64
		if pack, ok := packDep.(*meta.ComponentPack); ok {
			packModstamp = pack.UpdatedAt
			if pack.HasStyles {
				packUrls = append(packUrls, getPackUrl(key, packModstamp, workspace, site, "runtime.css"))
			}
		}
	}
	return packUrls
}

func getFontCSSURLs(fontDeps *preload.MetadataMergeData, workspace *preload.WorkspaceMergeData, site *preload.SiteMergeData) []string {
	allDeps := fontDeps.GetItems()
	fontUrls := []string{}
	for _, fontDep := range allDeps {
		key := fontDep.GetKey()
		var fontModstamp int64
		if font, ok := fontDep.(*meta.Font); ok {
			fontModstamp = font.UpdatedAt
			if font.CSSPath != "" {
				fontUrls = append(fontUrls, getFontUrl(key, fontModstamp, workspace, site, font.CSSPath))
			}
		}
	}
	return fontUrls
}

func getSiteBundleVersion(namespace string, modstamp int64, site *preload.SiteMergeData) string {
	siteBundleVersion := ""

	// Handle requests for system bundles specially,
	// since we don't update their bundle dependencies at all and just use dummy "v0.0.1" everywhere
	if bundlestore.IsSystemBundle(namespace) {
		if file.GetAssetsPath() != "" {
			// We DO update the static assets version for the whole Docker image, so use that if we have it
			siteBundleVersion = file.GetAssetsPath() // assets path SHOULD have a leading / already
		} else if modstamp != 0 {
			// If we don't have a Git sha, then we are in local development,
			// in which case we want to use the system pack modstamp to avoid stale file loads
			siteBundleVersion = fmt.Sprintf("/%d", modstamp)
		}
	} else {
		// NON-system bundles
		if namespace == site.App {
			// If requested namespace is the app's name, use the site version
			siteBundleVersion = "/" + site.Version
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
		if modstamp != 0 {
			// Prefer modstamp
			siteBundleVersion = fmt.Sprintf("/%d", modstamp)
		} else if site.Version != "" {
			// Final fallback --- use site version
			siteBundleVersion = "/" + site.Version
		}
	}

	return siteBundleVersion

}

func getPackUrl(key string, modstamp int64, workspace *preload.WorkspaceMergeData, site *preload.SiteMergeData, filePath string) string {
	return getAssetUrl(key, "componentpacks", modstamp, workspace, site, filePath)
}

func getFontUrl(key string, modstamp int64, workspace *preload.WorkspaceMergeData, site *preload.SiteMergeData, filePath string) string {
	return getAssetUrl(key, "fonts", modstamp, workspace, site, filePath)
}

func getAssetUrl(key, prefix string, modstamp int64, workspace *preload.WorkspaceMergeData, site *preload.SiteMergeData, filePath string) string {
	namespace, name, err := meta.ParseKey(key)
	if err != nil {
		return ""
	}
	user, namepart, err := meta.ParseNamespace(namespace)
	if err != nil {
		return ""
	}

	if workspace != nil {
		// If we are in a workspace context, use component pack modstamps to load in their resources,
		// since we don't have a stable "site" version that we can safely use, as the bundle dependency list is not immutable.
		return fmt.Sprintf("/workspace/%s/%s/%s/%s/%s/%d/%s/%s", workspace.App, workspace.Name, prefix, user, namepart, modstamp, name, filePath)
	}

	siteBundleVersion := getSiteBundleVersion(namespace, modstamp, site)

	return fmt.Sprintf("/site/%s/%s%s/%s/%s", prefix, namespace, siteBundleVersion, name, filePath)

}

func GetWorkspaceMergeData(workspace *meta.Workspace) *preload.WorkspaceMergeData {
	if workspace == nil {
		return nil
	}

	return &preload.WorkspaceMergeData{
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

func GetRoutingMergeData(route *meta.Route, metadata *preload.PreloadMetadata, session *sess.Session) (*preload.RouteMergeData, error) {

	// Prepare wire data for server merge data
	wireData := map[string]meta.Group{}
	if metadata != nil && metadata.Wire != nil {
		for _, entity := range metadata.Wire.GetItems() {
			wire := entity.(*wire.LoadOp)
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

	return &preload.RouteMergeData{
		Dependencies: metadata,
		Namespace:    route.Namespace,
		Params:       route.Params,
		Path:         route.Path,
		Tags:         mergedRouteTags,
		Theme:        route.ThemeRef,
		Title:        mergedRouteTitle,
		Type:         route.Type,
		View:         route.ViewRef,
		Workspace:    GetWorkspaceMergeData(session.GetWorkspace()),
	}, err
}

func GetSiteMergeData(site *meta.Site) *preload.SiteMergeData {
	return &preload.SiteMergeData{
		Name:           site.Name,
		App:            site.GetAppFullName(),
		Subdomain:      site.Subdomain,
		Domain:         site.Domain,
		Scheme:         site.Scheme,
		Version:        site.Bundle.GetVersionString(),
		Title:          site.Title,
		EnableSEO:      site.EnableSEO,
		Dependencies:   site.GetAppBundle().Dependencies,
		FaviconVersion: getFaviconVersion(site),
	}
}

// NOTE: Technically speaking, the actual favicon used by a site could point to a different bundle
// which could have a version different from the site bundle version. However, looking up the favicon
// to that level has a perf cost (even though it would be cached) that seems unnecessary in the majority
// of cases. As written below, we will align the favicon caching with the site bundle version which
// should be sufficient for most use cases. If needed, a specific lookup to the referenced favicon could
// be performed and the version of the actual favicon source used instead.
func getFaviconVersion(site *meta.Site) string {
	// intentionally ignore error here since it should not happen
	// and if so we use version of bundle as a fallback
	fileItem, _ := meta.NewFile(site.GetFavicon())
	if bundlestore.IsSystemBundle(fileItem.Namespace) {
		return os.Getenv("UESIO_BUILD_VERSION")
	} else {
		return site.Bundle.GetVersionString()
	}
}

func ExecuteIndexTemplate(w http.ResponseWriter, route *meta.Route, preloadmeta *preload.PreloadMetadata, buildMode bool, session *sess.Session) {

	// #2783 Prevent 3rd party sites from iframing Uesio
	// Add a content security policy header to prevent any other sites from iframing this site
	// TODO: make this configurable by site (see issue #2782)
	w.Header().Set("content-security-policy", "frame-ancestors 'none';")

	w.Header().Set("content-type", "text/html")

	site := session.GetSite()

	routingMergeData, err := GetRoutingMergeData(route, preloadmeta, session)
	if err != nil {
		ctlutil.HandleError(session.Context(), w, fmt.Errorf("error getting route merge data: %w", err))
		return
	}

	mergeData := preload.MergeData{
		Route:            routingMergeData,
		User:             preload.GetUserMergeData(session),
		Site:             GetSiteMergeData(site),
		PreloadMetadata:  preloadmeta,
		StaticAssetsPath: file.GetAssetsPath(),
		StaticAssetsHost: file.GetAssetsHost(),
	}

	if err = indexTemplate.Execute(w, mergeData); err != nil {
		ctlutil.HandleError(session.Context(), w, fmt.Errorf("error merging template: %w", err))
		return
	}
}
