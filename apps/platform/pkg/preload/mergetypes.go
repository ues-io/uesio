package preload

import (
	"encoding/json"
	"log/slog"
	"maps"
	"slices"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type LoginResponse struct {
	User                   *UserMergeData `json:"user"`
	RedirectPath           string         `json:"redirectPath,omitempty"`
	RedirectRouteName      string         `json:"redirectRouteName,omitempty"`
	RedirectRouteNamespace string         `json:"redirectRouteNamespace,omitempty"`
	SessionId              string         `json:"sessionId"`
}

type RouteMergeData struct {
	Dependencies *PreloadMetadata    `json:"dependencies"`
	Namespace    string              `json:"namespace"`
	Params       map[string]any      `json:"params"`
	Path         string              `json:"path"`
	Tags         []meta.Tag          `json:"tags"`
	Theme        string              `json:"theme"`
	Title        string              `json:"title"`
	Type         string              `json:"type"`
	View         string              `json:"view"`
	Workspace    *WorkspaceMergeData `json:"workspace"`
}

type UserPictureMergeData struct {
	ID        string `json:"id"`
	UpdatedAt int64  `json:"updatedat"`
}

type UserMergeData struct {
	FirstName    string                `json:"firstname"`
	LastName     string                `json:"lastname"`
	Profile      string                `json:"profile"`
	ProfileLabel string                `json:"profileLabel"`
	Site         string                `json:"site"`
	ID           string                `json:"id"`
	Username     string                `json:"username"`
	Picture      *UserPictureMergeData `json:"picture"`
	Language     string                `json:"language"`
	NamedPerms   []string              `json:"namedPermissions"`
}

type SiteMergeData struct {
	Name           string                      `json:"name"`
	App            string                      `json:"app"`
	Version        string                      `json:"version"`
	Domain         string                      `json:"domain"`
	Subdomain      string                      `json:"subdomain"`
	Scheme         string                      `json:"scheme"`
	Title          string                      `json:"title"`
	EnableSEO      bool                        `json:"-"`
	Dependencies   meta.BundleDefDependencyMap `json:"dependencies"`
	FaviconVersion string                      `json:"faviconVersion"`
}

type WorkspaceMergeData struct {
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

	StaticAssetsPath string `json:"-"`
	StaticAssetsHost string `json:"-"`
	*PreloadMetadata `json:"-"`
}

// String function controls how MergeData is marshalled
// This is actually pretty silly but I did it to make the output
// look pretty in the html source.
func (md MergeData) String() string {
	// Remove the component pack dep info because we don't need it on the client
	if md.PreloadMetadata != nil {
		md.ComponentPack = nil
	}

	serialized, err := json.MarshalIndent(md, "        ", "  ")
	//json, err := json.Marshal(md)
	if err != nil {
		slog.Error(err.Error())
		return ""
	}
	return string(serialized)
}

func GetUserMergeData(session *sess.Session) *UserMergeData {
	userInfo := session.GetContextUser()
	userPicture := userInfo.GetPicture()
	userProfile := userInfo.GetProfileRef()
	userMergeData := &UserMergeData{
		ID:        userInfo.ID,
		Username:  userInfo.UniqueKey,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Profile:   userInfo.Profile,
		Site:      session.GetSite().ID,
		Language:  userInfo.Language,
	}
	if userProfile != nil {
		userMergeData.ProfileLabel = userProfile.Label
	}
	permissions := session.GetContextPermissions()
	if permissions != nil {
		userMergeData.NamedPerms = slices.Collect(maps.Keys(permissions.NamedRefs))
	}
	if userPicture != nil {
		userMergeData.Picture = &UserPictureMergeData{
			ID:        userPicture.ID,
			UpdatedAt: userPicture.UpdatedAt,
		}
	}
	return userMergeData
}
