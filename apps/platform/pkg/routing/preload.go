package routing

import (
	"encoding/json"
)

type ComponentMergeData struct {
	ID            string      `json:"id"`
	ComponentType string      `json:"componentType"`
	View          string      `json:"view"`
	State         interface{} `json:"state"`
}

func NewComponentsMergeData() *ComponentsMergeData {
	return &ComponentsMergeData{
		IDs:      []string{},
		Entities: map[string]ComponentMergeData{},
	}
}

type ComponentsMergeData struct {
	IDs      []string                      `json:"ids"`
	Entities map[string]ComponentMergeData `json:"entities"`
}

func (cmd *ComponentsMergeData) AddItem(componentID string, state interface{}) {
	cmd.IDs = append(cmd.IDs, componentID)
	cmd.Entities[componentID] = ComponentMergeData{
		ID:    componentID,
		State: state,
	}
}

type MetadataMergeData []Depable

func (mmd *MetadataMergeData) MarshalJSON() ([]byte, error) {

	ids := make([]string, 0)
	entityData := map[string]json.RawMessage{}

	for _, dep := range *mmd {
		key := dep.GetKey()
		_, ok := entityData[key]
		if ok {
			continue
		}
		ids = append(ids, key)
		rawData, err := dep.GetBytes()
		if err == nil {
			entityData[key] = rawData
		}
	}

	return json.Marshal(&struct {
		IDs      []string                   `json:"ids"`
		Entities map[string]json.RawMessage `json:"entities"`
	}{
		ids,
		entityData,
	})

}

func NewItem() *MetadataMergeData {
	return &MetadataMergeData{}
}

func (mmd *MetadataMergeData) AddItem(dep Depable) {
	*mmd = append(*mmd, dep)
}

func NewPreloadMetadata() *PreloadMetadata {
	return &PreloadMetadata{
		Component:        NewComponentsMergeData(),
		Theme:            NewItem(),
		ViewDef:          NewItem(),
		ComponentPack:    NewItem(),
		ComponentVariant: NewItem(),
		ConfigValue:      NewItem(),
		Label:            NewItem(),
		FeatureFlag:      NewItem(),
		Wire:             NewItem(),
		Collection:       NewItem(),
	}
}

type PreloadMetadata struct {
	Theme            *MetadataMergeData   `json:"theme,omitempty"`
	ViewDef          *MetadataMergeData   `json:"viewdef,omitempty"`
	ComponentPack    *MetadataMergeData   `json:"componentpack,omitempty"`
	ComponentVariant *MetadataMergeData   `json:"componentvariant,omitempty"`
	ConfigValue      *MetadataMergeData   `json:"configvalue,omitempty"`
	Label            *MetadataMergeData   `json:"label,omitempty"`
	FeatureFlag      *MetadataMergeData   `json:"featureflag,omitempty"`
	Wire             *MetadataMergeData   `json:"wire,omitempty"`
	Collection       *MetadataMergeData   `json:"collection,omitempty"`
	Component        *ComponentsMergeData `json:"component,omitempty"`
}

type Depable interface {
	GetKey() string
	GetBytes() ([]byte, error)
}
