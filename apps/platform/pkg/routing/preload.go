package routing

import (
	"encoding/json"
	"fmt"

	"github.com/francoispqt/gojay"
	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type MetadataMergeData struct {
	IDs      []string                   `json:"ids"`
	Entities map[string]json.RawMessage `json:"entities"`
}

func NewItem() *MetadataMergeData {
	return &MetadataMergeData{
		IDs:      []string{},
		Entities: map[string]json.RawMessage{},
	}
}

func (mmd *MetadataMergeData) AddItem(id string, content []byte) error {
	_, ok := mmd.Entities[id]
	if !ok {
		mmd.IDs = append(mmd.IDs, id)
		mmd.Entities[id] = content
	}
	return nil
}

func NewPreloadMetadata() *PreloadMetadata {
	return &PreloadMetadata{
		Theme:            NewItem(),
		ViewDef:          NewItem(),
		ComponentPack:    NewItem(),
		ComponentVariant: NewItem(),
		ConfigValue:      NewItem(),
		Label:            NewItem(),
		MetadataText:     NewItem(),
		FeatureFlag:      NewItem(),
	}
}

type MetadataResponse struct {
	Color string `json:"color"`
	Icon  string `json:"icon"`
}

type PreloadMetadata struct {
	Theme            *MetadataMergeData          `json:"theme,omitempty"`
	ViewDef          *MetadataMergeData          `json:"viewdef,omitempty"`
	ComponentPack    *MetadataMergeData          `json:"componentpack,omitempty"`
	ComponentVariant *MetadataMergeData          `json:"componentvariant,omitempty"`
	ConfigValue      *MetadataMergeData          `json:"configvalue,omitempty"`
	Label            *MetadataMergeData          `json:"label,omitempty"`
	FeatureFlag      *MetadataMergeData          `json:"featureflag,omitempty"`
	MetadataText     *MetadataMergeData          `json:"metadatatext,omitempty"`
	Namespaces       map[string]MetadataResponse `json:"namespaces,omitempty"`
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
	gojay.MarshalerJSONObject
	GetKey() string
}

func (pm *PreloadMetadata) AddItem(item Depable, includeText bool) error {

	var bucket *MetadataMergeData
	var metadataType string
	var metadataText string
	switch v := item.(type) {
	case *meta.Theme:
		bucket = pm.Theme
		metadataType = "theme"
	case *meta.View:
		bucket = pm.ViewDef
		metadataType = "viewdef"
		if includeText {
			bytes, err := yaml.Marshal(v.Definition)
			if err != nil {
				return err
			}
			metadataText = string(bytes)
		}
	case *meta.ComponentVariant:
		bucket = pm.ComponentVariant
		metadataType = "componentvariant"
	case *meta.ComponentPack:
		bucket = pm.ComponentPack
		metadataType = "componentpack"
	case *meta.ConfigValue:
		bucket = pm.ConfigValue
		metadataType = "configvalue"
	case *meta.Label:
		bucket = pm.Label
		metadataType = "label"
	case *meta.FeatureFlag:
		bucket = pm.FeatureFlag
		metadataType = "featureflag"
	default:
		return fmt.Errorf("Cannot add this type to dependencies: %T", v)
	}

	if includeText {

		if pm.MetadataText == nil {
			pm.MetadataText = NewItem()
		}
		fullKey := metadataType + ":" + item.GetKey()
		bytes, err := gojay.MarshalJSONObject(&MetadataTextItem{
			Content:      metadataText,
			Key:          item.GetKey(),
			MetadataType: metadataType,
		})
		if err != nil {
			return err
		}
		pm.MetadataText.AddItem(fullKey, bytes)
	}

	parsedbytes, err := gojay.MarshalJSONObject(item)
	if err != nil {
		return err
	}

	return bucket.AddItem(item.GetKey(), parsedbytes)

}

func (pm *PreloadMetadata) GetThemes() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.Theme
}

func (pm *PreloadMetadata) GetViewDef() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.ViewDef
}

func (pm *PreloadMetadata) GetComponentPack() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.ComponentPack
}

func (pm *PreloadMetadata) GetComponentVariant() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.ComponentVariant
}

func (pm *PreloadMetadata) GetLabel() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.Label
}

func (pm *PreloadMetadata) GetConfigValue() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.ConfigValue
}

func (pm *PreloadMetadata) GetFeatureFlags() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.FeatureFlag
}
