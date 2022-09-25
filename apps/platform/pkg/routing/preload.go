package routing

import (
	"encoding/json"
	"fmt"

	"github.com/francoispqt/gojay"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"gopkg.in/yaml.v3"
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
	return &PreloadMetadata{}
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
	Wire             *MetadataMergeData          `json:"wire,omitempty"`
	Collection       *MetadataMergeData          `json:"collection,omitempty"`
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
	GetKey() string
	GetBytes() ([]byte, error)
}

func (pm *PreloadMetadata) AddItem(item Depable, includeText bool) error {

	var bucket *MetadataMergeData
	var metadataType string
	var metadataText string
	switch v := item.(type) {
	case *meta.Theme:
		if pm.Theme == nil {
			pm.Theme = NewItem()
		}
		bucket = pm.Theme
		metadataType = "theme"
	case *meta.View:
		if pm.ViewDef == nil {
			pm.ViewDef = NewItem()
		}
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
		if pm.ComponentVariant == nil {
			pm.ComponentVariant = NewItem()
		}
		bucket = pm.ComponentVariant
		metadataType = "componentvariant"
	case *meta.ComponentPack:
		if pm.ComponentPack == nil {
			pm.ComponentPack = NewItem()
		}
		bucket = pm.ComponentPack
		metadataType = "componentpack"
	case *meta.ConfigValue:
		if pm.ConfigValue == nil {
			pm.ConfigValue = NewItem()
		}
		bucket = pm.ConfigValue
		metadataType = "configvalue"
	case *meta.Label:
		if pm.Label == nil {
			pm.Label = NewItem()
		}
		bucket = pm.Label
		metadataType = "label"
	case *meta.FeatureFlag:
		if pm.FeatureFlag == nil {
			pm.FeatureFlag = NewItem()
		}
		bucket = pm.FeatureFlag
		metadataType = "featureflag"
	case *adapt.CollectionMetadata:
		if pm.Collection == nil {
			pm.Collection = NewItem()
		}
		bucket = pm.Collection
		metadataType = "collection"
	case *adapt.LoadOp:
		if pm.Wire == nil {
			pm.Wire = NewItem()
		}
		bucket = pm.Wire
		metadataType = "wire"
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

	parsedbytes, err := item.GetBytes()
	if err != nil {
		return err
	}

	return bucket.AddItem(item.GetKey(), parsedbytes)

}
