package routing

import (
	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type MetadataState struct {
	MetadataType string `json:"type"`
	Key          string `json:"key"`
	Content      string `json:"content"`
}

type MetadataMergeData struct {
	IDs      []string                 `json:"ids"`
	Entities map[string]MetadataState `json:"entities"`
}

func (mmd *MetadataMergeData) AddItem(id string, metadataType string, content string) {
	mmd.IDs = append(mmd.IDs, id)
	mmd.Entities[id] = MetadataState{
		MetadataType: metadataType,
		Key:          id,
		Content:      content,
	}
}

func GetMetadataDeps(route *meta.Route, session *sess.Session) (*MetadataMergeData, error) {

	deps := &MetadataMergeData{
		IDs:      []string{},
		Entities: map[string]MetadataState{},
	}

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

	deps.AddItem("theme:"+route.ThemeRef, "theme", string(bytes))

	return deps, nil
}
