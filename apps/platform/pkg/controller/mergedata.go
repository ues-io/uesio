package controller

import (
	"encoding/json"
	"net/http"
	"path/filepath"

	// Using text/template here instead of html/template
	// because we trust both the template and the merge data
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// RouteMergeData stuff to merge
type RouteMergeData struct {
	View      string              `json:"view"`
	Params    map[string]string   `json:"params"`
	Namespace string              `json:"namespace"`
	Path      string              `json:"path"`
	Workspace *WorkspaceMergeData `json:"workspace"`
	Theme     string              `json:"theme"`
}

// UserMergeData stuff to merge
type UserMergeData struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Profile   string `json:"profile"`
	Site      string `json:"site"`
}

// SiteMergeData stuff to merge
type SiteMergeData struct {
	Name    string `json:"name"`
	App     string `json:"app"`
	Version string `json:"version"`
}

// WorkspaceMergeData stuff to merge
type WorkspaceMergeData struct {
	Name string `json:"name"`
	App  string `json:"app"`
}

// BuilderMergeData stuff to merge
type BuilderMergeData struct {
	BuildMode bool `json:"buildMode"`
}

// MergeData stuff to merge
type MergeData struct {
	Route     *RouteMergeData     `json:"route"`
	User      *UserMergeData      `json:"user"`
	Site      *SiteMergeData      `json:"site"`
	Workspace *WorkspaceMergeData `json:"workspace"`
	Builder   *BuilderMergeData   `json:"builder"`
}

var indexTemplate *template.Template

func init() {
	indexPath := filepath.Join(filepath.Join("platform", "index.gohtml"))
	indexTemplate = template.Must(template.ParseFiles(indexPath))
}

// String function controls how MergeData is marshalled
// This is actually pretty silly but I did it to make the output
// look pretty in the html source.
func (md MergeData) String() string {
	json, err := json.MarshalIndent(md, "        ", "    ")
	if err != nil {
		return ""
	}
	return string(json)
}

// GetUserMergeData function
func GetUserMergeData(session *sess.Session) *UserMergeData {
	userInfo := session.GetUserInfo()
	return &UserMergeData{
		Site:      userInfo.Site,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Profile:   userInfo.Profile,
	}
}

// GetWorkspaceMergeData function
func GetWorkspaceMergeData(workspace *meta.Workspace) *WorkspaceMergeData {
	if workspace == nil {
		return nil
	}
	return &WorkspaceMergeData{
		Name: workspace.Name,
		App:  workspace.AppRef,
	}
}

// ExecuteIndexTemplate function
func ExecuteIndexTemplate(w http.ResponseWriter, route *meta.Route, buildMode bool, session *sess.Session) {
	w.Header().Set("content-type", "text/html")

	site := session.GetSite()
	workspace := session.GetWorkspace()

	mergeData := MergeData{
		Route: &RouteMergeData{
			View:      route.ViewRef,
			Params:    route.Params,
			Namespace: route.Namespace,
			Path:      route.Path,
			Workspace: GetWorkspaceMergeData(workspace),
			Theme:     route.ThemeRef,
		},
		User: GetUserMergeData(session),
		Site: &SiteMergeData{
			Name:    site.Name,
			Version: site.VersionRef,
			App:     site.AppRef,
		},
		Builder: &BuilderMergeData{
			BuildMode: buildMode,
		},
	}

	// Not checking this error for now.
	_ = indexTemplate.Execute(w, mergeData)
}
