package routing

import (
	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type MetadataState struct {
	Key     string `json:"key"`
	Content string `json:"content"`
}

type MetadataMergeData struct {
	IDs      []string                 `json:"ids"`
	Entities map[string]MetadataState `json:"entities"`
}

func (mmd *MetadataMergeData) AddItem(id, content string) {
	mmd.IDs = append(mmd.IDs, id)
	mmd.Entities[id] = MetadataState{
		Key:     id,
		Content: content,
	}
}

type PreloadMetadata struct {
	Themes *MetadataMergeData
}

func (pm *PreloadMetadata) GetThemes() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.Themes
}

func (pm *PreloadMetadata) AddTheme(id, content string) {
	if pm.Themes == nil {
		pm.Themes = &MetadataMergeData{
			IDs:      []string{},
			Entities: map[string]MetadataState{},
		}
	}
	pm.Themes.AddItem(id, content)
}

func GetMetadataDeps(route *meta.Route, session *sess.Session) (*PreloadMetadata, error) {

	deps := &PreloadMetadata{}

	themeNamespace, themeName, err := meta.ParseKey(route.ThemeRef)
	if err != nil {
		return nil, err
	}

	theme := meta.Theme{
		Name:      themeName,
		Namespace: themeNamespace,
	}

	err = bundle.Load(&theme, session)
	if err != nil {
		return nil, err
	}

	bytes, err := yaml.Marshal(&theme)
	if err != nil {
		return nil, err
	}

	deps.AddTheme(route.ThemeRef, string(bytes))

	return deps, nil
}
