package routing

import (
	"encoding/json"
	"errors"

	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/translate"
)

type MetadataState struct {
	Key     string          `json:"key"`
	Content string          `json:"content"`
	Parsed  json.RawMessage `json:"parsed"`
}

type MetadataMergeData struct {
	IDs      []string                 `json:"ids"`
	Entities map[string]MetadataState `json:"entities"`
}

func (mmd *MetadataMergeData) AddItem(id, content string) {
	_, ok := mmd.Entities[id]
	if !ok {
		mmd.IDs = append(mmd.IDs, id)
		mmd.Entities[id] = MetadataState{
			Key:     id,
			Content: content,
		}
	}
}

func convert(i interface{}) interface{} {
	switch x := i.(type) {
	case map[interface{}]interface{}:
		m2 := map[string]interface{}{}
		for k, v := range x {
			m2[k.(string)] = convert(v)
		}
		return m2
	case []interface{}:
		for i, v := range x {
			x[i] = convert(v)
		}
	}
	return i
}

func (mmd *MetadataMergeData) AddView(id string, view meta.View) error {
	_, ok := mmd.Entities[id]
	if !ok {

		bytes, err := yaml.Marshal(&view.Definition)
		if err != nil {
			return err
		}

		var body interface{}
		err = view.Definition.Decode(&body)
		if err != nil {
			return err
		}
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}

		mmd.IDs = append(mmd.IDs, id)
		mmd.Entities[id] = MetadataState{
			Key:     id,
			Parsed:  b,
			Content: string(bytes),
		}
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

func (pm *PreloadMetadata) AddTheme(id, content string) {
	if pm.Themes == nil {
		pm.Themes = &MetadataMergeData{
			IDs:      []string{},
			Entities: map[string]MetadataState{},
		}
	}
	pm.Themes.AddItem(id, content)
}

func (pm *PreloadMetadata) AddComponentPack(id, content string) {
	if pm.ComponentPack == nil {
		pm.ComponentPack = &MetadataMergeData{
			IDs:      []string{},
			Entities: map[string]MetadataState{},
		}
	}
	pm.ComponentPack.AddItem(id, content)
}

func (pm *PreloadMetadata) AddViewDef(id string, view meta.View) error {
	if pm.ViewDef == nil {
		pm.ViewDef = &MetadataMergeData{
			IDs:      []string{},
			Entities: map[string]MetadataState{},
		}
	}

	return pm.ViewDef.AddView(id, view)
}

func (pm *PreloadMetadata) AddComponentVariant(id, content string) {
	if pm.ComponentVariant == nil {
		pm.ComponentVariant = &MetadataMergeData{
			IDs:      []string{},
			Entities: map[string]MetadataState{},
		}
	}
	pm.ComponentVariant.AddItem(id, content)
}

func (pm *PreloadMetadata) AddConfigValue(id, content string) {
	if pm.ConfigValue == nil {
		pm.ConfigValue = &MetadataMergeData{
			IDs:      []string{},
			Entities: map[string]MetadataState{},
		}
	}
	pm.ConfigValue.AddItem(id, content)
}

func (pm *PreloadMetadata) AddLabel(id, content string) {
	if pm.Label == nil {
		pm.Label = &MetadataMergeData{
			IDs:      []string{},
			Entities: map[string]MetadataState{},
		}
	}
	pm.Label.AddItem(id, content)
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

	bytes, err := yaml.Marshal(&variantDep)
	if err != nil {
		return err
	}

	deps.AddComponentVariant(key, string(bytes))

	return nil
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
			deps.AddComponentPack(pack.GetKey(), "")
			if componentInfo != nil {
				for _, key := range componentInfo.ConfigValues {
					// _, ok := deps.ConfigValues[key]
					// if !ok {
					value, err := configstore.GetValueFromKey(key, session)
					if err != nil {
						return err
					}
					deps.AddConfigValue(key, value)
					//}
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

	err = deps.AddViewDef(key, *view)
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
		deps.AddLabel(key, value)
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
			deps.AddComponentPack(pack.GetKey(), "")
			for key := range pack.Components.ViewComponents {
				err := getDepsForComponent(namespace+"."+key, deps, session)
				if err != nil {
					return nil, err
				}
			}
		}

	}
	for i := range variants {
		variant := variants[i]
		bytes, err := yaml.Marshal(&variant)
		if err != nil {
			return nil, err
		}

		deps.AddComponentVariant(variant.GetKey(), string(bytes))

	}

	for key, value := range labels {
		deps.AddLabel(key, value)
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

	deps.AddTheme(route.ThemeRef, string(bytes))

	err = processView(route.ViewRef, deps, session)
	if err != nil {
		return nil, err
	}

	return deps, nil
}
