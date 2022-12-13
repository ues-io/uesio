package routing

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/translate"
	"gopkg.in/yaml.v3"
)

func loadViewDef(key string, session *sess.Session) (*meta.View, error) {

	subViewDep, err := meta.NewView(key)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(subViewDep, nil, session) //TO-DO
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

	err = bundle.Load(variantDep, nil, session) //TO-DO
	if err != nil {
		return nil, errors.New("Failed to load variant: " + key + " : " + err.Error())
	}
	return variantDep, nil
}

func getFullyQualifiedVariantKey(fullName string, componentKey string) (string, error) {
	keyArray := strings.Split(fullName, ":")
	if len(keyArray) == 2 {
		return fullName, nil
	}
	if len(keyArray) == 1 && componentKey != "" {
		return fmt.Sprintf("%s:%s", componentKey, fullName), nil
	}
	return "", errors.New("Invalid Variant Key: " + fullName)
}

func addVariantDep(deps *PreloadMetadata, key string, session *sess.Session) error {
	variantDep, err := loadVariant(key, session)
	if err != nil {
		return err
	}
	if variantDep.Extends != "" {
		qualifiedKey, err := getFullyQualifiedVariantKey(variantDep.Extends, variantDep.Component)
		if err != nil {
			return err
		}
		err = addVariantDep(deps, qualifiedKey, session)
		if err != nil {
			return err
		}
	}

	return deps.AddItem(variantDep, false)

}

func getDepsForUtilityComponent(key string, deps *PreloadMetadata, packs map[string]meta.ComponentPackCollection, session *sess.Session) error {

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
		_, ok := pack.Components.UtilityComponents[componentName]
		if ok {
			err := deps.AddItem(pack, false)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func getDepsForComponent(key string, deps *PreloadMetadata, packs map[string]meta.ComponentPackCollection, session *sess.Session) error {

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
					err := addVariantDep(deps, key, session)
					if err != nil {
						return err
					}
				}

				for _, key := range componentInfo.Utilities {
					err = getDepsForUtilityComponent(key, deps, packs, session)
					if err != nil {
						return err
					}
				}

			}
		}
	}
	return nil
}

func processView(key string, viewInstanceID string, deps *PreloadMetadata, params map[string]string, packs map[string]meta.ComponentPackCollection, session *sess.Session) error {

	view, err := loadViewDef(key, session)
	if err != nil {
		return err
	}

	err = deps.AddItem(view, false)
	if err != nil {
		return err
	}

	depMap, err := GetViewDependencies(view)
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
		err := getDepsForComponent(key, deps, packs, session)
		if err != nil {
			return err
		}
	}

	mergeFuncs := datasource.GetMergeFuncs(session, params)

	for viewKey, viewCompDef := range depMap.Views {

		if key == viewKey {
			continue
		}

		subParams := map[string]string{}

		viewID := meta.GetNodeValueAsString(viewCompDef, "id")

		// Process the params
		for i, prop := range viewCompDef.Content {

			if prop.Kind == yaml.ScalarNode && prop.Value == "params" {

				if len(viewCompDef.Content) > i {
					valueNode := viewCompDef.Content[i+1]
					paramsNodes, err := meta.GetMapNodes(valueNode)
					if err != nil {
						return err
					}
					for _, param := range paramsNodes {
						template, err := templating.NewWithFuncs(param.Node.Value, templating.ForceErrorFunc, mergeFuncs)
						if err != nil {
							return err
						}

						mergedValue, err := templating.Execute(template, nil)
						if err != nil {
							// If we fail here just bail on making params.
							// We'll process the view client side.
							subParams = nil
							break
						}
						subParams[param.Key] = mergedValue
					}
				}
			}
		}

		err = processView(viewKey, viewID, deps, subParams, packs, session)
		if err != nil {
			return err
		}
	}

	if viewInstanceID != "" {
		ops := []*adapt.LoadOp{}

		for _, pair := range depMap.Wires {

			viewOnly := meta.GetNodeValueAsBool(pair.Node, "viewOnly", false)
			if viewOnly {
				continue
			}

			loadOp := &adapt.LoadOp{
				WireName:  pair.Key,
				View:      view.GetKey() + "(" + viewInstanceID + ")",
				Query:     true,
				Params:    params,
				Preloaded: true,
			}
			err := pair.Node.Decode(loadOp)
			if err != nil {
				return err
			}
			ops = append(ops, loadOp)
		}

		metadata, err := datasource.Load(ops, session, nil)
		if err != nil {
			return err
		}

		for _, collection := range metadata.Collections {
			err = deps.AddItem(collection, false)
			if err != nil {
				return err
			}
		}

		for _, op := range ops {
			err = deps.AddItem(op, false)
			if err != nil {
				return err
			}
		}
	}

	return nil

}

func getPacksByNamespace(session *sess.Session) (map[string]meta.ComponentPackCollection, error) {
	// Get all avaliable namespaces
	packs := map[string]meta.ComponentPackCollection{}
	namespaces := session.GetContextNamespaces()
	for _, namespace := range namespaces {
		group := &meta.ComponentPackCollection{}
		err := bundle.LoadAll(group, namespace, nil, session)
		if err != nil {
			return nil, err
		}
		packs[namespace] = *group
	}
	return packs, nil
}

func GetBuilderDependencies(viewNamespace, viewName string, deps *PreloadMetadata, session *sess.Session) error {

	view, err := loadViewDef(viewNamespace+"."+viewName, session)
	if err != nil {
		return err
	}

	err = deps.AddItem(view, true)
	if err != nil {
		return err
	}

	packsByNamespace, err := getPacksByNamespace(session)
	if err != nil {
		return errors.New("Failed to load packs: " + err.Error())
	}
	var variants meta.ComponentVariantCollection
	err = bundle.LoadAllFromAny(&variants, nil, session)
	if err != nil {
		return errors.New("Failed to load variants: " + err.Error())
	}

	labels, err := translate.GetTranslatedLabels(session)
	if err != nil {
		return errors.New("Failed to get translated labels: " + err.Error())
	}

	for namespace, packs := range packsByNamespace {
		for _, pack := range packs {
			err := deps.AddItem(pack, false)
			if err != nil {
				return err
			}
			for key := range pack.Components.ViewComponents {
				err := getDepsForComponent(namespace+"."+key, deps, packsByNamespace, session)
				if err != nil {
					return err
				}
			}
		}

	}
	for i := range variants {
		err := deps.AddItem(variants[i], false)
		if err != nil {
			return err
		}
	}

	for key, value := range labels {

		label, err := meta.NewLabel(key)
		if err != nil {
			return err
		}
		label.Value = value
		err = deps.AddItem(label, false)
		if err != nil {
			return err
		}
	}

	// Load in the studio theme.
	theme, err := meta.NewTheme("uesio/studio.default")
	if err != nil {
		return err
	}

	err = bundle.Load(theme, nil, session.RemoveWorkspaceContext()) //TO-DO
	if err != nil {
		return err
	}

	err = deps.AddItem(theme, false)
	if err != nil {
		return err
	}

	// Get the metadata list
	namespaces := session.GetContextNamespaces()
	appNames := []string{}
	for _, ns := range namespaces {
		appNames = append(appNames, ns)
	}

	appData, err := datasource.GetAppData(appNames)
	if err != nil {
		return err
	}

	deps.Namespaces = appData

	return nil
}

func GetMetadataDeps(route *meta.Route, session *sess.Session) (*PreloadMetadata, error) {

	deps := NewPreloadMetadata()

	theme, err := meta.NewTheme(route.ThemeRef)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(theme, nil, session) //TO-DO
	if err != nil {
		return nil, err
	}

	err = deps.AddItem(theme, false)
	if err != nil {
		return nil, err
	}

	packs := map[string]meta.ComponentPackCollection{}

	err = processView(route.ViewRef, "$root", deps, route.Params, packs, session)
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

func getComponentAreaDeps(node *yaml.Node, depMap *ViewDepMap) {
	if node == nil || node.Kind != yaml.SequenceNode {
		return
	}

	for i := range node.Content {
		comp := node.Content[i]
		if isComponentLike(comp) {
			compName := comp.Content[0].Value
			depMap.Components[compName] = true
			for i, prop := range comp.Content[1].Content {
				if prop.Kind == yaml.ScalarNode && prop.Value == "uesio.variant" {
					if len(comp.Content[1].Content) > i {
						valueNode := comp.Content[1].Content[i+1]
						if valueNode.Kind == yaml.ScalarNode && valueNode.Value != "" {
							qualifiedKey, err := getFullyQualifiedVariantKey(valueNode.Value, compName)
							if err != nil {
								// TODO: We should probably return an error here at some point
								return
							}
							depMap.Variants[qualifiedKey] = true
						}
					}
				}
				// A special case that should be removed at some point in
				// favor of defining where slots are in the component definition
				if compName == "uesio/io.table" && prop.Value == "columns" {
					if len(comp.Content[1].Content) > i {
						columnsNode := comp.Content[1].Content[i+1]
						for j := range columnsNode.Content {
							columnNode := columnsNode.Content[j]
							for k, prop := range columnNode.Content {
								if prop.Kind == yaml.ScalarNode && prop.Value == "components" {
									getComponentAreaDeps(columnNode.Content[k+1], depMap)
								}
							}
						}
					}
				}
				// A special case that should be removed at some point in
				// favor of defining where slots are in the component definition
				if compName == "uesio/io.field" && prop.Value == "list" {
					if len(comp.Content[1].Content) > i {
						listNode := comp.Content[1].Content[i+1]
						for k, prop := range listNode.Content {
							if prop.Kind == yaml.ScalarNode && prop.Value == "components" {
								getComponentAreaDeps(listNode.Content[k+1], depMap)
							}
						}
					}
				}
				// A special case that should be removed at some point in
				// favor of defining where slots are in the component definition
				if compName == "uesio/io.tabs" && prop.Value == "tabs" {
					if len(comp.Content[1].Content) > i {
						tabsNode := comp.Content[1].Content[i+1]
						for _, tab := range tabsNode.Content {
							for l, prop := range tab.Content {
								if prop.Kind == yaml.ScalarNode && prop.Value == "components" {
									getComponentAreaDeps(tab.Content[l+1], depMap)
								}
							}

						}
					}
				}
				getComponentAreaDeps(prop, depMap)
			}
			if compName == "uesio/core.view" {
				for i, prop := range comp.Content[1].Content {
					if prop.Kind == yaml.ScalarNode && prop.Value == "view" {
						if len(comp.Content[1].Content) > i {
							valueNode := comp.Content[1].Content[i+1]
							if valueNode.Kind == yaml.ScalarNode && valueNode.Value != "" {
								depMap.Views[valueNode.Value] = comp.Content[1]
							}
						}
					}
					getComponentAreaDeps(prop, depMap)
				}
			}
		}
	}
}

func isComponentLike(node *yaml.Node) bool {
	// It's a mappingNode
	if node.Kind != yaml.MappingNode {
		return false
	}
	if len(node.Content) != 2 {
		return false
	}
	name := node.Content[0].Value
	nameParts := strings.Split(name, ".")
	if len(nameParts) != 2 {
		return false
	}
	if node.Content[1].Kind != yaml.MappingNode && node.Content[1].Tag != "!!null" {
		return false
	}
	return true
}

type ViewDepMap struct {
	Components map[string]bool
	Variants   map[string]bool
	Views      map[string]*yaml.Node
	Wires      []meta.NodePair
}

func NewViewDefMap() *ViewDepMap {
	return &ViewDepMap{
		Components: map[string]bool{},
		Variants:   map[string]bool{},
		Views:      map[string]*yaml.Node{},
		Wires:      []meta.NodePair{},
	}
}

func GetViewDependencies(v *meta.View) (*ViewDepMap, error) {

	components, err := meta.GetMapNode(&v.Definition, "components")
	if err != nil {
		return nil, err
	}
	panels, err := meta.GetMapNode(&v.Definition, "panels")
	if err != nil {
		panels = nil
	}

	wires, err := meta.GetMapNode(&v.Definition, "wires")
	if err != nil {
		wires = nil
	}

	depMap := NewViewDefMap()

	getComponentAreaDeps(components, depMap)

	if panels != nil && panels.Kind == yaml.MappingNode {
		for i := range panels.Content {
			if i%2 != 0 {
				panel := panels.Content[i]
				panelType, err := meta.GetMapNode(panel, "uesio.type")
				if err != nil {
					return nil, err
				}
				if panelType.Kind == yaml.ScalarNode {
					depMap.Components[panelType.Value] = true
				}
				for i := range panel.Content {
					if i%2 != 0 {
						node := panel.Content[i]
						getComponentAreaDeps(node, depMap)
					}
				}
			}
		}
	}

	if wires != nil && wires.Kind == yaml.MappingNode {
		wirePairs, err := meta.GetMapNodes(wires)
		if err != nil {
			return nil, err
		}
		depMap.Wires = wirePairs
	}

	return depMap, nil
}
