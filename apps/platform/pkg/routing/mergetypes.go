package routing

import (
	"encoding/json"
	"log/slog"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type LoginResponse struct {
	User                   *UserMergeData `json:"user"`
	RedirectPath           string         `json:"redirectPath,omitempty"`
	RedirectRouteName      string         `json:"redirectRouteName,omitempty"`
	RedirectRouteNamespace string         `json:"redirectRouteNamespace,omitempty"`
}

type RouteMergeData struct {
	View         string              `json:"view"`
	Params       map[string]string   `json:"params"`
	Namespace    string              `json:"namespace"`
	Path         string              `json:"path"`
	Workspace    *WorkspaceMergeData `json:"workspace"`
	Theme        string              `json:"theme"`
	Title        string              `json:"title"`
	Dependencies *PreloadMetadata    `json:"dependencies"`
	Tags         []meta.Tag          `json:"tags"`
}

type UserPictureMergeData struct {
	ID        string `json:"id"`
	UpdatedAt int64  `json:"updatedat"`
}

type UserMergeData struct {
	FirstName string                `json:"firstname"`
	LastName  string                `json:"lastname"`
	Profile   string                `json:"profile"`
	Site      string                `json:"site"`
	ID        string                `json:"id"`
	Username  string                `json:"username"`
	Picture   *UserPictureMergeData `json:"picture"`
	Language  string                `json:"language"`
}

type SiteMergeData struct {
	Name         string                      `json:"name"`
	App          string                      `json:"app"`
	Version      string                      `json:"version"`
	Domain       string                      `json:"domain"`
	Subdomain    string                      `json:"subdomain"`
	Title        string                      `json:"title"`
	EnableSEO    bool                        `json:"-"`
	Dependencies meta.BundleDefDependencyMap `json:"dependencies"`
}

type WorkspaceMergeData struct {
	Id      string `json:"id"`
	Name    string `json:"name"`
	App     string `json:"app"`
	Wrapper string `json:"wrapper,omitempty"`
}

type SessionMergeData struct {
	Hash    string `json:"hash"`
	Expires string `json:"expires"`
}

type MergeData struct {
	Route     *RouteMergeData     `json:"route"`
	User      *UserMergeData      `json:"user"`
	Site      *SiteMergeData      `json:"site"`
	Session   *SessionMergeData   `json:"session,omitempty"`
	Workspace *WorkspaceMergeData `json:"workspace,omitempty"`

	MonacoEditorVersion string   `json:"-"`
	StaticAssetsPath    string   `json:"-"`
	StaticAssetsHost    string   `json:"-"`
	VendorScriptUrls    []string `json:"-"`
	*PreloadMetadata    `json:"-"`
}

// String function controls how MergeData is marshalled
// This is actually pretty silly but I did it to make the output
// look pretty in the html source.
func (md MergeData) String() string {
	// Remove the component pack dep info because we don't need it on the client
	md.ComponentPack = nil

	serialized, err := json.MarshalIndent(md, "        ", "  ")
	//json, err := json.Marshal(md)
	if err != nil {
		slog.Error(err.Error())
		return ""
	}
	return string(serialized)
}
