package routing

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/goutils"
)

type Depable interface {
	GetKey() string
	GetBytes() ([]byte, error)
}

type DepMap interface {
	AddItem(item Depable) DepMap
	AddItemIfNotExists(item Depable) (Depable, bool)
	AddItems(deps ...Depable) DepMap
	GetItems() []Depable
	Get(key string) (Depable, bool)
	Has(key string) bool
	Len() int
	MarshalJSON() ([]byte, error)
	Remove(key string) DepMap
	RemoveAll() DepMap
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
	deps map[string]Depable
}

func (mmd *MetadataMergeData) AddItem(dep Depable) DepMap {
	key := dep.GetKey()
	mmd.deps[key] = dep
	return mmd
}

func (mmd *MetadataMergeData) AddItems(deps ...Depable) DepMap {
	for _, dep := range deps {
		mmd.AddItem(dep)
	}
	return mmd
}

func (mmd *MetadataMergeData) AddItemIfNotExists(dep Depable) (Depable, bool) {
	key := dep.GetKey()
	if existingItem, exists := mmd.deps[key]; exists {
		return existingItem, true
	}
	mmd.deps[key] = dep
	return nil, false
}

func (mmd *MetadataMergeData) Has(key string) bool {
	_, exists := mmd.deps[key]
	return exists
}

func (mmd *MetadataMergeData) Get(key string) (Depable, bool) {
	item, exists := mmd.deps[key]
	return item, exists
}

func (mmd *MetadataMergeData) Remove(key string) DepMap {
	delete(mmd.deps, key)
	return mmd
}

func (mmd *MetadataMergeData) RemoveAll() DepMap {
	mmd.deps = map[string]Depable{}
	return mmd
}

func (mmd *MetadataMergeData) GetItems() []Depable {
	return goutils.MapValues(mmd.deps)
}

func (mmd *MetadataMergeData) Len() int {
	return len(mmd.deps)
}

func (mmd *MetadataMergeData) MarshalJSON() ([]byte, error) {

	ids := make([]string, 0)
	entityData := map[string]json.RawMessage{}

	for key, dep := range mmd.deps {
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

func NewItem() DepMap {
	return &MetadataMergeData{
		deps: map[string]Depable{},
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
	Theme            DepMap `json:"theme,omitempty"`
	ViewDef          DepMap `json:"viewdef,omitempty"`
	ComponentPack    DepMap `json:"componentpack,omitempty"`
	ComponentVariant DepMap `json:"componentvariant,omitempty"`
	ComponentType    DepMap `json:"componenttype,omitempty"`
	ConfigValue      DepMap `json:"configvalue,omitempty"`
	Label            DepMap `json:"label,omitempty"`
	FeatureFlag      DepMap `json:"featureflag,omitempty"`
	Wire             DepMap `json:"wire,omitempty"`
	Collection       DepMap `json:"collection,omitempty"`
	Component        DepMap `json:"component,omitempty"`
	StaticFile       DepMap `json:"file,omitempty"`
}
