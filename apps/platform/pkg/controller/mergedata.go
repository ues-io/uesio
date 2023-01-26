package controller

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	// Using text/template here instead of html/template
	// because we trust both the template and the merge data
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
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

func ExecuteIndexTemplate(w http.ResponseWriter, route *meta.Route, preload *routing.PreloadMetadata, buildMode bool, session *sess.Session) {
	w.Header().Set("content-type", "text/html")

	site := session.GetSite()
	workspace := session.GetWorkspace()

	devMode := false
	val, _ := os.LookupEnv("UESIO_DEV")
	if val == "true" {
		devMode = true
	}

	routeTitle := route.Title
	if routeTitle == "" {
		routeTitle = "Uesio"
	}

	mergeData := routing.MergeData{
		Route: &routing.RouteMergeData{
			View:      route.ViewRef,
			Params:    route.Params,
			Namespace: route.Namespace,
			Path:      route.Path,
			Workspace: GetWorkspaceMergeData(workspace),
			Theme:     route.ThemeRef,
			Title:     routeTitle,
		},
		User: GetUserMergeData(session),
		Site: &routing.SiteMergeData{
			Name:      site.Name,
			App:       site.GetAppFullName(),
			Subdomain: site.Subdomain,
			Domain:    site.Domain,
			Version:   site.Bundle.GetVersionString(),
		},
		DevMode:          devMode,
		PreloadMetadata:  preload,
		StaticAssetsPath: file.GetAssetsPath(),
	}

	err := indexTemplate.Execute(w, mergeData)
	if err != nil {
		msg := "Error Merging Template: " + err.Error()
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
}
