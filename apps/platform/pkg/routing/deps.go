package routing

import (
	"errors"
	"fmt"
	"strings"

	"github.com/francoispqt/gojay"
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

var DEFAULT_BUILDER_PACK_NAMESPACE = "uesio/builder"
var DEFAULT_BUILDER_PACK_NAME = "main"

var DEFAULT_BUILDER_COMPONENT = "uesio/builder.mainwrapper"
var DEFAULT_BUILDER_SLOT = "uesio/builder.slotbuilder"

func getBuilderComponentID(view string) string {
	return fmt.Sprintf("%s($root):%s", view, DEFAULT_BUILDER_COMPONENT)
}

func loadViewDef(key string, session *sess.Session) (*meta.View, error) {

	subViewDep, err := meta.NewView(key)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(subViewDep, session, nil)
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

	err = bundle.Load(variantDep, session, nil)
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

	return deps.ComponentVariant.AddItemDep(variantDep)

}

func getDepsForUtilityComponent(key string, deps *PreloadMetadata, session *sess.Session) error {

	namespace, name, err := meta.ParseKey(key)
	if err != nil {
		return err
	}

	utility := meta.NewBaseUtility(namespace, name)

	err = bundle.Load(utility, session, nil)
	if err != nil {
		return err
	}

	if utility.Pack == "" {
		return nil
	}

	pack := meta.NewBaseComponentPack(namespace, utility.Pack)

	return deps.ComponentPack.AddItemDep(pack)

}

func getDepsForComponent(component *meta.Component, deps *PreloadMetadata, session *sess.Session) error {

	if component.Pack == "" {
		return nil
	}
	pack := meta.NewBaseComponentPack(component.Namespace, component.Pack)

	err := deps.ComponentPack.AddItemDep(pack)
	if err != nil {
		return err
	}

	for _, key := range component.ConfigValues {

		value, err := configstore.GetValueFromKey(key, session)
		if err != nil {
			return err
		}
		configvalue, err := meta.NewConfigValue(key)
		if err != nil {
			return err
		}
		configvalue.Value = value
		err = deps.ConfigValue.AddItemDep(configvalue)
		if err != nil {
			return err
		}

	}

	for _, key := range component.Variants {
		err := addVariantDep(deps, key, session)
		if err != nil {
			return err
		}
	}

	for _, key := range component.Utilities {
		err = getDepsForUtilityComponent(key, deps, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func processView(key string, viewInstanceID string, deps *PreloadMetadata, params map[string]string, session *sess.Session) error {

	view, err := loadViewDef(key, session)
	if err != nil {
		return err
	}

	err = deps.ViewDef.AddItemDep(view)
	if err != nil {
		return err
	}

	depMap, err := GetViewDependencies(view, session)
	if err != nil {
		return err
	}

	for key := range depMap.Variants {
		err := addVariantDep(deps, key, session)
		if err != nil {
			return err
		}
	}

	for _, component := range depMap.Components {
		err := getDepsForComponent(component, deps, session)
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

		err = processView(viewKey, viewID, deps, subParams, session)
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
			err = deps.Collection.AddItemDep(collection)
			if err != nil {
				return err
			}
		}

		for _, op := range ops {
			err = deps.Wire.AddItemDep(op)
			if err != nil {
				return err
			}
		}
	}

	return nil

}

func GetBuilderDependencies(viewNamespace, viewName string, deps *PreloadMetadata, session *sess.Session) error {

	view, err := loadViewDef(viewNamespace+"."+viewName, session)
	if err != nil {
		return err
	}

	err = deps.ViewDef.AddItemDep(view)
	if err != nil {
		return err
	}

	viewYamlBytes, err := yaml.Marshal(view.Definition)
	if err != nil {
		return err
	}

	bytes, err := gojay.MarshalJSONObject(&MetadataTextItem{
		Content:      string(viewYamlBytes),
		Key:          view.GetKey(),
		MetadataType: "viewdef",
	})
	if err != nil {
		return err
	}
	deps.MetadataText.AddItem("viewdef:"+view.GetKey(), bytes)

	var variants meta.ComponentVariantCollection
	err = bundle.LoadAllFromAny(&variants, nil, session, nil)
	if err != nil {
		return errors.New("Failed to load variants: " + err.Error())
	}

	var components meta.ComponentCollection
	err = bundle.LoadAllFromAny(&components, nil, session, nil)
	if err != nil {
		return errors.New("Failed to load components: " + err.Error())
	}

	labels, err := translate.GetTranslatedLabels(session)
	if err != nil {
		return errors.New("Failed to get translated labels: " + err.Error())
	}

	componentDefs := map[string]string{}

	for _, component := range components {

		err := getDepsForComponent(component, deps, session)
		if err != nil {
			return err
		}

		componentYamlBytes, err := yaml.Marshal(component)
		if err != nil {
			return err
		}

		componentDefs[component.GetKey()] = string(componentYamlBytes)
	}

	builderComponentID := getBuilderComponentID(viewNamespace + "." + viewName)

	deps.Component.AddItem(fmt.Sprintf("%s:componentdefs", builderComponentID), componentDefs)

	for i := range variants {
		err := deps.ComponentVariant.AddItemDep(variants[i])
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
		err = deps.Label.AddItemDep(label)
		if err != nil {
			return err
		}
	}

	// Load in the studio theme.
	theme, err := meta.NewTheme("uesio/studio.default")
	if err != nil {
		return err
	}

	err = bundle.Load(theme, session.RemoveWorkspaceContext(), nil)
	if err != nil {
		return err
	}

	err = deps.Theme.AddItemDep(theme)
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

	deps.Component.AddItem(fmt.Sprintf("%s:namespaces", builderComponentID), appData)
	deps.Component.AddItem(fmt.Sprintf("%s:buildmode", builderComponentID), true)

	return nil
}

func GetMetadataDeps(route *meta.Route, session *sess.Session) (*PreloadMetadata, error) {

	deps := NewPreloadMetadata()

	theme, err := meta.NewTheme(route.ThemeRef)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(theme, session, nil)
	if err != nil {
		return nil, err
	}

	err = deps.Theme.AddItemDep(theme)
	if err != nil {
		return nil, err
	}

	err = processView(route.ViewRef, "$root", deps, route.Params, session)
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
		err = deps.Label.AddItemDep(label)
		if err != nil {
			return nil, err
		}
	}

	for _, flag := range *featureflags {
		err = deps.FeatureFlag.AddItemDep(flag)
		if err != nil {
			return nil, err
		}
	}

	workspace := session.GetWorkspace()

	// If we're in workspace mode, make sure we have the builder pack so we can include the
	// buildwrapper
	if workspace != nil {
		builderComponentID := getBuilderComponentID(route.ViewRef)
		deps.Component.AddItem(fmt.Sprintf("%s:buildmode", builderComponentID), false)
		deps.ComponentPack.AddItemDep(meta.NewBaseComponentPack(DEFAULT_BUILDER_PACK_NAMESPACE, DEFAULT_BUILDER_PACK_NAME))
	}

	return deps, nil
}

func getComponentAreaDeps(node *yaml.Node, depMap *ViewDepMap, session *sess.Session) error {
	if node == nil || node.Kind != yaml.SequenceNode {
		return nil
	}

	for i := range node.Content {
		comp := node.Content[i]
		if isComponentLike(comp) {
			compName := comp.Content[0].Value

			_, err := depMap.AddComponent(compName, session)
			if err != nil {
				return err
			}

			for i, prop := range comp.Content[1].Content {
				if prop.Kind == yaml.ScalarNode && prop.Value == "uesio.variant" {
					if len(comp.Content[1].Content) > i {
						valueNode := comp.Content[1].Content[i+1]
						if valueNode.Kind == yaml.ScalarNode && valueNode.Value != "" {
							qualifiedKey, err := getFullyQualifiedVariantKey(valueNode.Value, compName)
							if err != nil {
								// TODO: We should probably return an error here at some point
								return err
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
									err := getComponentAreaDeps(columnNode.Content[k+1], depMap, session)
									if err != nil {
										return err
									}
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
								err := getComponentAreaDeps(listNode.Content[k+1], depMap, session)
								if err != nil {
									return err
								}
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
									err := getComponentAreaDeps(tab.Content[l+1], depMap, session)
									if err != nil {
										return err
									}
								}
							}

						}
					}
				}
				err := getComponentAreaDeps(prop, depMap, session)
				if err != nil {
					return err
				}
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
					err := getComponentAreaDeps(prop, depMap, session)
					if err != nil {
						return err
					}
				}
			}
		}
	}
	return nil
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
	Components map[string]*meta.Component
	Variants   map[string]bool
	Views      map[string]*yaml.Node
	Wires      []meta.NodePair
}

func (vdm *ViewDepMap) AddComponent(key string, session *sess.Session) (*meta.Component, error) {
	component, ok := vdm.Components[key]
	if ok {
		return component, nil
	}
	component, err := meta.NewComponent(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(component, session, nil)
	if err != nil {
		return nil, err
	}
	vdm.Components[key] = component
	return component, nil
}

func NewViewDefMap() *ViewDepMap {
	return &ViewDepMap{
		Components: map[string]*meta.Component{},
		Variants:   map[string]bool{},
		Views:      map[string]*yaml.Node{},
		Wires:      []meta.NodePair{},
	}
}

func GetViewDependencies(v *meta.View, session *sess.Session) (*ViewDepMap, error) {

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

	err = getComponentAreaDeps(components, depMap, session)
	if err != nil {
		return nil, err
	}

	if panels != nil && panels.Kind == yaml.MappingNode {
		for i := range panels.Content {
			if i%2 != 0 {
				panel := panels.Content[i]
				panelType, err := meta.GetMapNode(panel, "uesio.type")
				if err != nil {
					return nil, err
				}
				if panelType.Kind == yaml.ScalarNode {
					_, err = depMap.AddComponent(panelType.Value, session)
					if err != nil {
						return nil, err
					}
				}
				for i := range panel.Content {
					if i%2 != 0 {
						node := panel.Content[i]
						err := getComponentAreaDeps(node, depMap, session)
						if err != nil {
							return nil, err
						}
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
