package routing

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/translate"
)

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

	depMap, err := view.GetDependencies()
	if err != nil {
		return err
	}

	for key := range depMap.Variants {
		err := addVariantDep(deps, key, session)
		if err != nil {
			return err
		}
	}

	for key := range depMap.Components {
		err := getDepsForComponent(key, deps, session)
		if err != nil {
			return err
		}
	}

	for key := range depMap.Views {
		err := processView(key, deps, session)
		if err != nil {
			return err
		}
	}

	/*
		// Not using this for now, but it's a placeholder
		// for when we want to process wires on the server
		// for even more performance gainz.
		for key := range depMap.Wires {
			fmt.Println("Found a wire: " + key)
		}
	*/

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

func GetAppData(namespaces []string, session *sess.Session) (map[string]MetadataResponse, error) {
	apps := meta.AppCollection{}

	// Load in App Settings
	err := datasource.PlatformLoad(&apps, &datasource.PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    adapt.UNIQUE_KEY_FIELD,
				Operator: "IN",
				Value:    namespaces,
			},
		},
		Fields: []adapt.LoadRequestField{
			{
				ID: "uesio/studio.color",
			},
			{
				ID: "uesio/studio.icon",
			},
		},
		SkipRecordSecurity: true,
	}, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	appData := map[string]MetadataResponse{}

	for index := range apps {
		app := apps[index]
		appData[app.UniqueKey] = MetadataResponse{
			Color: app.Color,
			Icon:  app.Icon,
		}
	}

	return appData, nil
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

	// Get the metadata list
	namespaces := session.GetContextNamespaces()
	appNames := []string{}
	for ns := range namespaces {
		appNames = append(appNames, ns)
	}

	appData, err := GetAppData(appNames, session)
	if err != nil {
		return nil, err
	}

	deps.Namespaces = appData

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
