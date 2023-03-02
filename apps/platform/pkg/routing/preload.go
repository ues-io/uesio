package routing

import (
	"github.com/francoispqt/gojay"
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

type MetadataMergeData struct {
	IDs      []string               `json:"ids"`
	Entities map[string]interface{} `json:"entities"`
}

func NewItem() *MetadataMergeData {
	return &MetadataMergeData{
		IDs:      []string{},
		Entities: map[string]interface{}{},
	}
}

func (mmd *MetadataMergeData) AddItemDep(dep Depable) error {
	id := dep.GetKey()
	//parsedbytes, err := dep.GetBytes()
	//if err != nil {
	//	return err
	//}
	return mmd.AddItem(id, dep)
}

func (mmd *MetadataMergeData) AddItem(id string, entity interface{}) error {
	_, ok := mmd.Entities[id]
	if !ok {
		mmd.IDs = append(mmd.IDs, id)
		mmd.Entities[id] = entity
	}
	return nil
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
		MetadataText:     NewItem(),
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
	MetadataText     *MetadataMergeData   `json:"metadatatext,omitempty"`
	Wire             *MetadataMergeData   `json:"wire,omitempty"`
	Collection       *MetadataMergeData   `json:"collection,omitempty"`
	Component        *ComponentsMergeData `json:"component,omitempty"`
}

type MetadataTextItem struct {
	Content      string
	Key          string
	MetadataType string
}

func (mti *MetadataTextItem) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("content", mti.Content)
	enc.AddStringKey("key", mti.Key)
	enc.AddStringKey("metadatatype", mti.MetadataType)
}

func (mti *MetadataTextItem) IsNil() bool {
	return mti == nil
}

type Depable interface {
	GetKey() string
	GetBytes() ([]byte, error)
}
