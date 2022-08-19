package routing

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/translate"
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

type PreloadMetadata struct {
	Theme            *MetadataMergeData `json:"theme,omitempty"`
	ViewDef          *MetadataMergeData `json:"viewdef,omitempty"`
	ComponentPack    *MetadataMergeData `json:"componentpack,omitempty"`
	ComponentVariant *MetadataMergeData `json:"componentvariant,omitempty"`
	ConfigValue      *MetadataMergeData `json:"configvalue,omitempty"`
	Label            *MetadataMergeData `json:"label,omitempty"`
	FeatureFlag      *MetadataMergeData `json:"featureflag,omitempty"`
	MetadataText     *MetadataMergeData `json:"metadatatext,omitempty"`
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

func loadViewDef(key string, session *sess.Session) (*meta.View, error) {

	subViewDep, err := meta.NewView(key)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(subViewDep, session)
	if err != nil {
		return nil, errors.New("Failed to load SubView: " + key + " : " + err.Error())
	}
	return subViewDep, nil
}

func loadVariant(key string, session *sess.Session) (*meta.ComponentVariant, error) {

	variantDep, err := meta.NewComponentVariant(key)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(variantDep, session)
	if err != nil {
		return nil, errors.New("Failed to load variant: " + key + " : " + err.Error())
	}
	return variantDep, nil
}

func addVariantDep(deps *PreloadMetadata, key string, session *sess.Session) error {
	variantDep, err := loadVariant(key, session)
	if err != nil {
		return err
	}
	if variantDep.Extends != "" {
		err = addVariantDep(deps, variantDep.Component+":"+variantDep.Extends, session)
		if err != nil {
			return err
		}
	}

	return deps.AddItem(variantDep, false)

}

func getDepsForComponent(key string, deps *PreloadMetadata, session *sess.Session) error {

	packs := map[string]meta.ComponentPackCollection{}

	namespace, componentName, err := meta.ParseKey(key)
	if err != nil {
		return err
	}

	packsForNamespace, ok := packs[namespace]
	if !ok {
		var nspacks meta.ComponentPackCollection
		err = bundle.LoadAll(&nspacks, namespace, nil, session)
		if err != nil {
			return err
		}
		packsForNamespace = nspacks
	}

	for _, pack := range packsForNamespace {
		componentInfo, ok := pack.Components.ViewComponents[componentName]
		if ok {
			err := deps.AddItem(pack, false)
			if err != nil {
				return err
			}
			if componentInfo != nil {
				for _, key := range componentInfo.ConfigValues {

					value, err := configstore.GetValueFromKey(key, session)
					if err != nil {
						return err
					}
					configvalue, err := meta.NewConfigValue(key)
					if err != nil {
						return err
					}
					configvalue.Value = value
					err = deps.AddItem(configvalue, false)
					if err != nil {
						return err
					}

				}

				for _, key := range componentInfo.Variants {
					addVariantDep(deps, key, session)
				}

				for _, key := range componentInfo.Utilities {
					err = getDepsForComponent(key, deps, session)
					if err != nil {
						return err
					}
				}
			}
		}
	}
	return nil
}

func processView(key string, deps *PreloadMetadata, session *sess.Session) error {

	view, err := loadViewDef(key, session)
	if err != nil {
		return err
	}

	err = deps.AddItem(view, false)
	if err != nil {
		return err
	}

	componentsUsed, variantsUsed, viewsUsed, err := view.GetDependencies()
	if err != nil {
		return err
	}

	for key := range variantsUsed {
		addVariantDep(deps, key, session)
	}

	for key := range componentsUsed {
		err := getDepsForComponent(key, deps, session)
		if err != nil {
			return err
		}
	}

	for key := range viewsUsed {
		processView(key, deps, session)
	}

	return nil

}

func getPacksByNamespace(session *sess.Session) (map[string]meta.ComponentPackCollection, error) {
	// Get all avaliable namespaces
	packs := map[string]meta.ComponentPackCollection{}
	namespaces := session.GetContextNamespaces()
	for namespace := range namespaces {
		groupAbstract, err := meta.GetBundleableGroupFromType("componentpacks")
		if err != nil {
			return nil, err
		}
		group := groupAbstract.(*meta.ComponentPackCollection)
		err = bundle.LoadAll(group, namespace, nil, session)
		if err != nil {
			return nil, err
		}
		packs[namespace] = *group
	}
	return packs, nil
}

func GetBuilderDependencies(viewNamespace, viewName string, session *sess.Session) (*PreloadMetadata, error) {

	deps := NewPreloadMetadata()
	view, err := loadViewDef(viewNamespace+"."+viewName, session)
	if err != nil {
		return nil, err
	}

	err = deps.AddItem(view, true)
	if err != nil {
		return nil, err
	}

	packsByNamespace, err := getPacksByNamespace(session)
	if err != nil {
		return nil, errors.New("Failed to load packs: " + err.Error())
	}
	var variants meta.ComponentVariantCollection
	err = bundle.LoadAllFromAny(&variants, nil, session)
	if err != nil {
		return nil, errors.New("Failed to load variants: " + err.Error())
	}

	// Also load in studio variants
	err = bundle.LoadAllFromAny(&variants, nil, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, errors.New("Failed to load studio variants: " + err.Error())
	}

	labels, err := translate.GetTranslatedLabels(session)
	if err != nil {
		return nil, errors.New("Failed to get translated labels: " + err.Error())
	}

	for namespace, packs := range packsByNamespace {
		for _, pack := range packs {
			err := deps.AddItem(pack, false)
			if err != nil {
				return nil, err
			}
			for key := range pack.Components.ViewComponents {
				err := getDepsForComponent(namespace+"."+key, deps, session)
				if err != nil {
					return nil, err
				}
			}
		}

	}
	for i := range variants {
		err := deps.AddItem(variants[i], false)
		if err != nil {
			return nil, err
		}
	}

	for key, value := range labels {

		label, err := meta.NewLabel(key)
		if err != nil {
			return nil, err
		}
		label.Value = value
		err = deps.AddItem(label, false)
		if err != nil {
			return nil, err
		}
	}

	// Load in the studio theme.
	theme, err := meta.NewTheme("uesio/studio.default")
	if err != nil {
		return nil, err
	}

	err = bundle.Load(theme, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	err = deps.AddItem(theme, false)
	if err != nil {
		return nil, err
	}

	return deps, nil
}

func GetMetadataDeps(route *meta.Route, session *sess.Session) (*PreloadMetadata, error) {

	deps := NewPreloadMetadata()

	theme, err := meta.NewTheme(route.ThemeRef)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(theme, session)
	if err != nil {
		return nil, err
	}

	err = deps.AddItem(theme, false)
	if err != nil {
		return nil, err
	}

	err = processView(route.ViewRef, deps, session)
	if err != nil {
		return nil, err
	}

	labels, err := translate.GetTranslatedLabels(session)
	if err != nil {
		return nil, errors.New("Failed to get translated labels: " + err.Error())
	}

	featureflags, err := featureflagstore.GetFeatureFlags(session, session.GetUserID())
	if err != nil {
		return nil, errors.New("Failed to get feature flags: " + err.Error())
	}

	for key, value := range labels {
		label, err := meta.NewLabel(key)
		if err != nil {
			return nil, err
		}
		label.Value = value
		err = deps.AddItem(label, false)
		if err != nil {
			return nil, err
		}
	}

	for _, flag := range *featureflags {
		err = deps.AddItem(flag, false)
		if err != nil {
			return nil, err
		}
	}

	return deps, nil
}
