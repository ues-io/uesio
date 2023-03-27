package controller

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	// Using text/template here instead of html/template
	// because we trust both the template and the merge data
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

var indexTemplate, cssTemplate *template.Template

func getPackUrl(key string, workspace *routing.WorkspaceMergeData, site *routing.SiteMergeData) string {
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
		return fmt.Sprintf("/workspace/%s/%s/componentpacks/%s/%s/%s/%s", workspace.App, workspace.Name, user, namepart, name, filePath)
	}

	siteBundleVersion := "/" + site.Version

	// Special case --- if this is a Uesio-provided site, we don't (currently) ever update the bundle versions,
	// but we DO update the static assets version for the whole Docker image, so replace the version with that
	if strings.HasPrefix(site.App, "uesio/") && file.GetAssetsPath() != "" {
		siteBundleVersion = file.GetAssetsPath()
	}

	return fmt.Sprintf("/site/componentpacks/%s/%s%s/%s/%s", user, namepart, siteBundleVersion, name, filePath)

}

func init() {
	baseDir := ""
	wd, _ := os.Getwd()
	// Handle path resolution issues when running tests
	if strings.Contains(wd, "pkg/") {
		baseDir = filepath.Join(wd, "..", "..")
	}
	indexPath := filepath.Join(baseDir, "platform", "index.gohtml")
	cssPath := filepath.Join(baseDir, "fonts", "fonts.css")
	indexTemplate = template.Must(template.New("index.gohtml").Funcs(template.FuncMap{
		"getPackURL": getPackUrl,
	}).ParseFiles(indexPath, cssPath))
}

func GetUserMergeData(session *sess.Session) *routing.UserMergeData {
	userInfo := session.GetUserInfo()
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
		Name:        workspace.Name,
		App:         workspace.GetAppFullName(),
		Wrapper:     routing.DEFAULT_BUILDER_COMPONENT,
		SlotWrapper: routing.DEFAULT_BUILDER_SLOT,
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

func GetRoutingMergeData(route *meta.Route, workspace *meta.Workspace, metadata *routing.PreloadMetadata, session *sess.Session) (*routing.RouteMergeData, error) {

	// Prepare wire data for server merge data
	wireData := map[string]meta.Group{}
	if metadata != nil && metadata.Wire != nil {
		for _, entity := range *metadata.Wire {
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
		Workspace:    GetWorkspaceMergeData(workspace),
		Theme:        route.ThemeRef,
		Dependencies: metadata,
		Title:        mergedRouteTitle,
		Tags:         mergedRouteTags,
	}, err
}

func GetSiteMergeData(site *meta.Site) *routing.SiteMergeData {
	return &routing.SiteMergeData{
		Name:      site.Name,
		App:       site.GetAppFullName(),
		Subdomain: site.Subdomain,
		Domain:    site.Domain,
		Version:   site.Bundle.GetVersionString(),
		Title:     site.Title,
		EnableSEO: site.EnableSEO,
	}
}

func ExecuteIndexTemplate(w http.ResponseWriter, route *meta.Route, preload *routing.PreloadMetadata, buildMode bool, session *sess.Session) {
	w.Header().Set("content-type", "text/html")

	site := session.GetSite()
	workspace := session.GetWorkspace()

	devMode := false
	val, _ := os.LookupEnv("UESIO_DEV")
	if val == "true" {
		devMode = true
	}

	routingMergeData, err := GetRoutingMergeData(route, workspace, preload, session)
	if err != nil {
		msg := "Error getting route merge data: " + err.Error()
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	mergeData := routing.MergeData{
		Route:            routingMergeData,
		User:             GetUserMergeData(session),
		Site:             GetSiteMergeData(site),
		DevMode:          devMode,
		PreloadMetadata:  preload,
		StaticAssetsPath: file.GetAssetsPath(),
	}

	err = indexTemplate.Execute(w, mergeData)
	if err != nil {
		msg := "Error Merging Template: " + err.Error()
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
}
