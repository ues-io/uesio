package controller

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"

	// Using text/template here instead of html/template
	// because we trust both the template and the merge data
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// RouteMergeData stuff to merge
type RouteMergeData struct {
	View         string                   `json:"view"`
	Params       map[string]string        `json:"params"`
	Namespace    string                   `json:"namespace"`
	Path         string                   `json:"path"`
	Workspace    *WorkspaceMergeData      `json:"workspace"`
	Theme        string                   `json:"theme"`
	Dependencies *routing.PreloadMetadata `json:"dependencies"`
}

// UserMergeData stuff to merge
type UserMergeData struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Profile   string `json:"profile"`
	Site      string `json:"site"`
	ID        string `json:"id"`
	PictureID string `json:"picture"`
	Language  string `json:"language"`
}

// SiteMergeData stuff to merge
type SiteMergeData struct {
	Name      string `json:"name"`
	App       string `json:"app"`
	Version   string `json:"version"`
	Domain    string `json:"domain"`
	Subdomain string `json:"subdomain"`
}

// WorkspaceMergeData stuff to merge
type WorkspaceMergeData struct {
	Name string `json:"name"`
	App  string `json:"app"`
}

type ComponentMergeData struct {
	ID            string      `json:"id"`
	ComponentType string      `json:"componentType"`
	View          string      `json:"view"`
	State         interface{} `json:"state"`
}

type ComponentsMergeData struct {
	IDs      []string                      `json:"ids"`
	Entities map[string]ComponentMergeData `json:"entities"`
}

// MergeData stuff to merge
type MergeData struct {
	Route            *RouteMergeData            `json:"route"`
	User             *UserMergeData             `json:"user"`
	Site             *SiteMergeData             `json:"site"`
	Workspace        *WorkspaceMergeData        `json:"workspace,omitempty"`
	Component        *ComponentsMergeData       `json:"component,omitempty"`
	ThemePreload     *routing.MetadataMergeData `json:"theme,omitempty"`
	ViewDef          *routing.MetadataMergeData `json:"viewdef,omitempty"`
	ComponentPack    *routing.MetadataMergeData `json:"componentpack,omitempty"`
	ComponentVariant *routing.MetadataMergeData `json:"componentvariant,omitempty"`
	ReactBundle      string                     `json:"-"`
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
		ID:        userInfo.ID,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Profile:   userInfo.Profile,
		PictureID: userInfo.GetPictureID(),
		Site:      session.GetSite().ID,
		Language:  userInfo.Language,
	}
}

// GetWorkspaceMergeData function
func GetWorkspaceMergeData(workspace *meta.Workspace) *WorkspaceMergeData {
	if workspace == nil {
		return nil
	}
	return &WorkspaceMergeData{
		Name: workspace.Name,
		App:  workspace.GetAppFullName(),
	}
}

func GetComponentMergeData(buildMode bool) *ComponentsMergeData {
	if !buildMode {
		return nil
	}
	return &ComponentsMergeData{
		IDs: []string{"$root/uesio/studio.runtime/buildmode"},
		Entities: map[string]ComponentMergeData{
			"$root/uesio/studio.runtime/buildmode": {
				ID:            "buildmode",
				ComponentType: "uesio/studio.runtime",
				View:          "$root",
				State:         true,
			},
		},
	}
}

// ExecuteIndexTemplate function
func ExecuteIndexTemplate(w http.ResponseWriter, route *meta.Route, preload *routing.PreloadMetadata, buildMode bool, session *sess.Session) {
	w.Header().Set("content-type", "text/html")

	site := session.GetSite()
	workspace := session.GetWorkspace()

	ReactSrc := "production.min"
	val, _ := os.LookupEnv("UESIO_DEV")
	if val == "true" {
		ReactSrc = "development"
	}

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
			Name:      site.Name,
			App:       site.GetAppFullName(),
			Subdomain: site.Subdomain,
			Domain:    site.Domain,
		},
		ThemePreload:     preload.GetThemes(),
		ViewDef:          preload.GetViewDef(),
		Component:        GetComponentMergeData(buildMode),
		ComponentPack:    preload.GetComponenPack(),
		ComponentVariant: preload.GetComponentVariant(),
		ReactBundle:      ReactSrc,
	}

	// Not checking this error for now.
	_ = indexTemplate.Execute(w, mergeData)
}
