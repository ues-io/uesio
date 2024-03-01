package preload

import (
	"encoding/json"
	"sort"

	"github.com/thecloudmasters/uesio/pkg/goutils"
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

type MetadataMergeData map[string]Depable

func (mmd *MetadataMergeData) AddItem(dep Depable) *MetadataMergeData {
	(*mmd)[dep.GetKey()] = dep
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
	_, exists := (*mmd)[key]
	return exists
}

func (mmd *MetadataMergeData) Get(key string) (Depable, bool) {
	dep, exists := (*mmd)[key]
	return dep, exists
}

func (mmd *MetadataMergeData) GetItems() []Depable {
	keys := goutils.MapKeys(*mmd)
	sort.Strings(keys)
	depsArray := make([]Depable, len(keys))
	for i, key := range keys {
		depsArray[i] = (*mmd)[key]
	}

	return depsArray
}

func (mmd *MetadataMergeData) Len() int {
	return len(*mmd)
}

func (mmd *MetadataMergeData) MarshalJSON() ([]byte, error) {

	data := make([]json.RawMessage, 0)

	for _, dep := range mmd.GetItems() {
		rawData, err := dep.GetBytes()
		if err == nil {
			data = append(data, rawData)
		}
	}

	return json.Marshal(data)

}

func NewItem() *MetadataMergeData {
	return &MetadataMergeData{}
}

func NewPreloadMetadata() *PreloadMetadata {
	return &PreloadMetadata{
		Collection:       NewItem(),
		Component:        NewItem(),
		ComponentPack:    NewItem(),
		ComponentType:    NewItem(),
		ComponentVariant: NewItem(),
		ConfigValue:      NewItem(),
		FeatureFlag:      NewItem(),
		Label:            NewItem(),
		RouteAssignment:  NewItem(),
		SelectList:       NewItem(),
		StaticFile:       NewItem(),
		Theme:            NewItem(),
		ViewDef:          NewItem(),
		Wire:             NewItem(),
	}
}

type PreloadMetadata struct {
	Collection       *MetadataMergeData `json:"collection,omitempty"`
	Component        *MetadataMergeData `json:"component,omitempty"`
	ComponentPack    *MetadataMergeData `json:"componentpack,omitempty"`
	ComponentType    *MetadataMergeData `json:"componenttype,omitempty"`
	ComponentVariant *MetadataMergeData `json:"componentvariant,omitempty"`
	ConfigValue      *MetadataMergeData `json:"configvalue,omitempty"`
	FeatureFlag      *MetadataMergeData `json:"featureflag,omitempty"`
	Label            *MetadataMergeData `json:"label,omitempty"`
	RouteAssignment  *MetadataMergeData `json:"routeassignment,omitempty"`
	SelectList       *MetadataMergeData `json:"selectlist,omitempty"`
	StaticFile       *MetadataMergeData `json:"file,omitempty"`
	Theme            *MetadataMergeData `json:"theme,omitempty"`
	ViewDef          *MetadataMergeData `json:"viewdef,omitempty"`
	Wire             *MetadataMergeData `json:"wire,omitempty"`
}
