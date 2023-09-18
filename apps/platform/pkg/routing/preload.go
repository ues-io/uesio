package routing

import (
	"encoding/json"
)

type Depable interface {
	GetKey() string
	GetBytes() ([]byte, error)
}

type ComponentMergeData struct {
	ID    string      `json:"id"`
	State interface{} `json:"state"`
}

func (c *ComponentMergeData) GetKey() string {
	return c.ID
}

func (c *ComponentMergeData) GetBytes() ([]byte, error) {
	return json.Marshal(c)
}

func NewComponentMergeData(componentID string, state interface{}) Depable {
	return &ComponentMergeData{
		ID:    componentID,
		State: state,
	}
}

type MetadataMergeData struct {
	ids  map[string]int
	deps []Depable
}

func (mmd *MetadataMergeData) AddItem(dep Depable) *MetadataMergeData {
	key := dep.GetKey()
	index, ok := mmd.ids[key]
	if !ok {
		mmd.ids[key] = len(mmd.deps)
		mmd.deps = append(mmd.deps, dep)
	} else {
		mmd.deps[index] = dep
	}
	return mmd
}

func (mmd *MetadataMergeData) AddItems(deps ...Depable) *MetadataMergeData {
	for _, dep := range deps {
		mmd.AddItem(dep)
	}
	return mmd
}

func (mmd *MetadataMergeData) AddItemIfNotExists(dep Depable) (Depable, bool) {
	existingDep, exists := mmd.Get(dep.GetKey())
	if exists {
		return existingDep, true
	}
	mmd.AddItem(dep)
	return nil, false
}

func (mmd *MetadataMergeData) Has(key string) bool {
	_, exists := mmd.ids[key]
	return exists
}

func (mmd *MetadataMergeData) Get(key string) (Depable, bool) {
	if index, exists := mmd.ids[key]; exists {
		return mmd.deps[index], true
	}
	return nil, false
}

func (mmd *MetadataMergeData) GetItems() []Depable {
	return mmd.deps
}

func (mmd *MetadataMergeData) Len() int {
	return len(mmd.deps)
}

func (mmd *MetadataMergeData) MarshalJSON() ([]byte, error) {

	data := make([]json.RawMessage, 0)

	for _, dep := range mmd.deps {

		rawData, err := dep.GetBytes()
		if err == nil {
			data = append(data, rawData)
		}
	}

	return json.Marshal(data)

}

func NewItem() *MetadataMergeData {
	return &MetadataMergeData{
		ids:  map[string]int{},
		deps: []Depable{},
	}
}

func NewPreloadMetadata() *PreloadMetadata {
	return &PreloadMetadata{
		Component:        NewItem(),
		Theme:            NewItem(),
		ViewDef:          NewItem(),
		ComponentPack:    NewItem(),
		ComponentType:    NewItem(),
		ComponentVariant: NewItem(),
		ConfigValue:      NewItem(),
		Label:            NewItem(),
		FeatureFlag:      NewItem(),
		Wire:             NewItem(),
		Collection:       NewItem(),
		StaticFile:       NewItem(),
	}
}

type PreloadMetadata struct {
	Theme            *MetadataMergeData `json:"theme,omitempty"`
	ViewDef          *MetadataMergeData `json:"viewdef,omitempty"`
	ComponentPack    *MetadataMergeData `json:"componentpack,omitempty"`
	ComponentVariant *MetadataMergeData `json:"componentvariant,omitempty"`
	ComponentType    *MetadataMergeData `json:"componenttype,omitempty"`
	ConfigValue      *MetadataMergeData `json:"configvalue,omitempty"`
	Label            *MetadataMergeData `json:"label,omitempty"`
	FeatureFlag      *MetadataMergeData `json:"featureflag,omitempty"`
	Wire             *MetadataMergeData `json:"wire,omitempty"`
	Collection       *MetadataMergeData `json:"collection,omitempty"`
	Component        *MetadataMergeData `json:"component,omitempty"`
	StaticFile       *MetadataMergeData `json:"file,omitempty"`
}
