package routing

import (
	"encoding/json"
	"errors"

	"github.com/francoispqt/gojay"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
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

type PreloadMetadata struct {
	Themes           *MetadataMergeData `json:"theme,omitempty"`
	ViewDef          *MetadataMergeData `json:"viewdef,omitempty"`
	ComponentPack    *MetadataMergeData `json:"componentpack,omitempty"`
	ComponentVariant *MetadataMergeData `json:"componentvariant,omitempty"`
	ConfigValue      *MetadataMergeData `json:"configvalue,omitempty"`
	Label            *MetadataMergeData `json:"label,omitempty"`
}

func (pm *PreloadMetadata) GetThemes() *MetadataMergeData {
	if pm == nil {
		return nil
	}
	return pm.Themes
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

func (pm *PreloadMetadata) AddTheme(id string, theme *meta.Theme) error {
	if pm.Themes == nil {
		pm.Themes = NewItem()
	}
	/*
		bytes, err := yaml.Marshal(&theme)
		if err != nil {
			return err
		}
	*/

	parsedbytes, err := gojay.MarshalJSONObject(theme)
	if err != nil {
		return err
	}
	//return pm.Themes.AddItem(id, string(bytes), nil)
	return pm.Themes.AddItem(id, parsedbytes)
}

func (pm *PreloadMetadata) AddComponentPack(id string, componentPack *meta.ComponentPack) error {
	if pm.ComponentPack == nil {
		pm.ComponentPack = NewItem()
	}
	parsedbytes, err := gojay.MarshalJSONObject(componentPack)
	if err != nil {
		return err
	}
	return pm.ComponentPack.AddItem(id, parsedbytes)
}

func (pm *PreloadMetadata) AddViewDef(id string, view *meta.View) error {
	if pm.ViewDef == nil {
		pm.ViewDef = NewItem()
	}

	/*
		bytes, err := yaml.Marshal(&view.Definition)
		if err != nil {
			return err
		}
	*/

	parsedbytes, err := gojay.MarshalJSONObject(view)
	if err != nil {
		return err
	}

	//return pm.ViewDef.AddItem(id, string(bytes), parsedbytes)
	return pm.ViewDef.AddItem(id, parsedbytes)

}

func (pm *PreloadMetadata) AddComponentVariant(id string, variant *meta.ComponentVariant) error {
	if pm.ComponentVariant == nil {
		pm.ComponentVariant = NewItem()
	}

	/*
		bytes, err := yaml.Marshal(&variant)
		if err != nil {
			return err
		}
	*/

	parsedbytes, err := gojay.MarshalJSONObject(variant)
	if err != nil {
		return err
	}

	//return pm.ComponentVariant.AddItem(id, string(bytes), parsedbytes)
	return pm.ComponentVariant.AddItem(id, parsedbytes)
}

func (pm *PreloadMetadata) AddConfigValue(id string, configvalue *meta.ConfigValue) error {
	if pm.ConfigValue == nil {
		pm.ConfigValue = NewItem()
	}
	parsedbytes, err := gojay.MarshalJSONObject(configvalue)
	if err != nil {
		return err
	}
	return pm.ConfigValue.AddItem(id, parsedbytes)
}

func (pm *PreloadMetadata) AddLabel(id string, label *meta.Label) error {
	if pm.Label == nil {
		pm.Label = NewItem()
	}
	parsedbytes, err := gojay.MarshalJSONObject(label)
	if err != nil {
		return err
	}
	return pm.Label.AddItem(id, parsedbytes)
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

	return deps.AddComponentVariant(key, variantDep)

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
			err := deps.AddComponentPack(pack.GetKey(), pack)
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
					err = deps.AddConfigValue(key, configvalue)
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

	err = deps.AddViewDef(key, view)
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

	labels, err := translate.GetTranslatedLabels(session)
	if err != nil {
		return errors.New("Failed to get translated labels: " + err.Error())
	}

	for key, value := range labels {
		label, err := meta.NewLabel(key)
		if err != nil {
			return err
		}
		label.Value = value
		err = deps.AddLabel(key, label)
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

func GetBuilderDependencies(session *sess.Session) (*PreloadMetadata, error) {

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

	deps := &PreloadMetadata{}

	for namespace, packs := range packsByNamespace {
		for _, pack := range packs {
			err := deps.AddComponentPack(pack.GetKey(), pack)
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
		err := deps.AddComponentVariant(variants[i].GetKey(), variants[i])
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
		err = deps.AddLabel(key, label)
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

	err = deps.AddTheme("uesio/studio.default", theme)
	if err != nil {
		return nil, err
	}

	//TO-DO Fix this

	// ffr, _ := getFeatureFlags(session, "")
	// for i := range ffr {
	// 	featureFlag := ffr[i]
	// 	deps.FeatureFlags[featureFlag.Name] = &featureFlag
	// }

	return deps, nil
}

func GetMetadataDeps(route *meta.Route, session *sess.Session) (*PreloadMetadata, error) {

	deps := &PreloadMetadata{}

	theme, err := meta.NewTheme(route.ThemeRef)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(theme, session)
	if err != nil {
		return nil, err
	}

	err = deps.AddTheme(route.ThemeRef, theme)
	if err != nil {
		return nil, err
	}

	err = processView(route.ViewRef, deps, session)
	if err != nil {
		return nil, err
	}

	return deps, nil
}
