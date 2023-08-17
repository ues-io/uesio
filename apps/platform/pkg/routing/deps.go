package routing

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/translate"

	yptr "github.com/zachelrath/yaml-jsonpointer"
)

var DEFAULT_BUILDER_PACK_NAMESPACE = "uesio/builder"
var DEFAULT_BUILDER_PACK_NAME = "main"

var DEFAULT_BUILDER_COMPONENT = "uesio/builder.mainwrapper"

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
	if variantDep.Extends != "" && key != variantDep.GetExtendsKey() {
		qualifiedKey, err := getFullyQualifiedVariantKey(variantDep.Extends, variantDep.Component)
		if err != nil {
			return err
		}
		err = addVariantDep(deps, qualifiedKey, session)
		if err != nil {
			return err
		}
	}

	for _, key := range variantDep.Variants {
		variantDep, err := loadVariant(key, session)
		if err != nil {
			return err
		}
		deps.ComponentVariant.AddItem(variantDep)
	}

	deps.ComponentVariant.AddItem(variantDep)
	return nil

}

func addComponentPackToDeps(deps *PreloadMetadata, packNamespace, packName string, session *sess.Session) {
	pack := meta.NewBaseComponentPack(packNamespace, packName)
	existingItem, alreadyRequested := deps.ComponentPack.AddItemIfNotExists(pack)
	// If the pack has not been requested yet and/or we don't have its UpdatedAt field present,
	// we need to load it so that we have that metadata available.
	if alreadyRequested {
		if existingPack, ok := existingItem.(*meta.ComponentPack); ok {
			pack = existingPack
		}
	}
	if pack.UpdatedAt == 0 {
		err := bundle.Load(pack, session, nil)
		if err != nil || pack.UpdatedAt == 0 {
			pack.UpdatedAt = time.Now().Unix()
		}
	}
	// If the pack wasn't requested before, we need to go ahead and request it
	if !alreadyRequested {
		deps.ComponentPack.AddItem(pack)
	}
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

	addComponentPackToDeps(deps, namespace, utility.Pack, session)

	return nil

}

func getDepsForComponent(component *meta.Component, deps *PreloadMetadata, session *sess.Session) error {

	if component.Pack == "" {
		return nil
	}

	addComponentPackToDeps(deps, component.Namespace, component.Pack, session)

	// need an admin session for retrieving config values
	// in order to prevent users from having to have read on the uesio/core.configvalue table
	adminSession := datasource.GetSiteAdminSession(session)

	for _, key := range component.ConfigValues {

		value, err := configstore.GetValueFromKey(key, adminSession)
		if err != nil {
			return err
		}
		configvalue, err := meta.NewConfigValue(key)
		if err != nil {
			return err
		}
		configvalue.Value = value
		deps.ConfigValue.AddItem(configvalue)
	}

	for _, key := range component.Variants {
		err := addVariantDep(deps, key, session)
		if err != nil {
			return err
		}
	}

	for _, key := range component.Utilities {
		err := getDepsForUtilityComponent(key, deps, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func getSubParams(viewDef *yaml.Node, parentParamValues map[string]string, session *sess.Session) (map[string]string, error) {

	subParams := map[string]string{}
	// Process the params
	for i, prop := range viewDef.Content {

		if prop.Kind == yaml.ScalarNode && prop.Value == "params" {

			if len(viewDef.Content) > i {
				valueNode := viewDef.Content[i+1]
				paramsNodes, err := meta.GetMapNodes(valueNode)
				if err != nil {
					return nil, err
				}
				for _, param := range paramsNodes {
					template, err := templating.NewWithFuncs(param.Node.Value, templating.ForceErrorFunc, merge.ServerMergeFuncs)
					if err != nil {
						return nil, err
					}

					mergedValue, err := templating.Execute(template, merge.ServerMergeData{
						Session:     session,
						ParamValues: parentParamValues,
					})
					if err != nil {
						return nil, err
					}
					subParams[param.Key] = mergedValue
				}
			}
		}
	}
	return subParams, nil
}

func processView(key string, viewInstanceID string, deps *PreloadMetadata, params map[string]string, session *sess.Session) error {

	view, err := loadViewDef(key, session)
	if err != nil {
		return err
	}

	deps.ViewDef.AddItem(view)

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

	for viewKey, viewCompDef := range depMap.Views {

		if key == viewKey {
			continue
		}

		viewID := meta.GetNodeValueAsString(viewCompDef, "uesio.id")
		// Backwards compatibility until we can get Morandi/TimeTracker migrated to using "uesio.id" consistently
		if viewID == "" {
			viewID = meta.GetNodeValueAsString(viewCompDef, "id")
		}

		subParams, err := getSubParams(viewCompDef, params, session)
		if err != nil {
			// If we get an error processing a subview, don't panic,
			// just set the viewID to blank so that we don't server-side
			// process its wires.
			viewID = ""
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
			// If this collection is already in the metadata, we need to merge the new and existing
			// to create a union of all metadata requested by any wires
			if existingItem, alreadyExists := deps.Collection.AddItemIfNotExists(collection); alreadyExists {
				// Cast to CollectionMetadata so that we can use nicer methods
				existingCollection := existingItem.(*adapt.CollectionMetadata)
				// Merge the inbound collection with the existing collection
				existingCollection.Merge(collection)
			}
		}

		for _, op := range ops {
			deps.Wire.AddItem(op)
		}
	}

	return nil

}

func GetBuilderDependencies(viewNamespace, viewName string, deps *PreloadMetadata, session *sess.Session) error {

	view, err := loadViewDef(viewNamespace+"."+viewName, session)
	if err != nil {
		return err
	}

	deps.ViewDef.AddItem(view)

	var viewBytes bytes.Buffer
	encoder := yaml.NewEncoder(&viewBytes)
	encoder.SetIndent(2)
	err = encoder.Encode(view.Definition)
	if err != nil {
		return err
	}

	builderComponentID := getBuilderComponentID(viewNamespace + "." + viewName)

	deps.Component.AddItem(NewComponentMergeData(fmt.Sprintf("%s:metadata:viewdef:%s", builderComponentID, view.GetKey()), viewBytes.String()))

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

	componentDefs := map[string]json.RawMessage{}

	for _, component := range components {

		err := getDepsForComponent(component, deps, session)
		if err != nil {
			return err
		}

		componentYamlBytes, err := component.GetBytes()
		if err != nil {
			return err
		}

		componentDefs[component.GetKey()] = componentYamlBytes
	}

	deps.Component.AddItem(NewComponentMergeData(fmt.Sprintf("%s:componentdefs", builderComponentID), componentDefs))

	for i := range variants {
		deps.ComponentVariant.AddItem(variants[i])
	}

	for key, value := range labels {

		label, err := meta.NewLabel(key)
		if err != nil {
			return err
		}
		label.Value = value
		deps.Label.AddItem(label)
	}

	// need an admin session for retrieving feature flags
	// in order to prevent users from having to have read on the uesio/core.featureflagassignment table
	adminSession := sess.GetAnonSession(session.GetSite())

	featureFlags, err := featureflagstore.GetFeatureFlags(adminSession, session.GetUserID())
	if err != nil {
		return errors.New("Failed to get feature flags: " + err.Error())
	}

	for _, flag := range *featureFlags {
		deps.FeatureFlag.AddItem(flag)
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

	deps.Theme.AddItem(theme)

	// Get the metadata list
	namespaces := session.GetContextNamespaces()
	appNames := []string{}
	appNames = append(appNames, namespaces...)

	appData, err := datasource.GetAppData(appNames)
	if err != nil {
		return err
	}

	deps.Component.AddItem(NewComponentMergeData(fmt.Sprintf("%s:namespaces", builderComponentID), appData))
	deps.Component.AddItem(NewComponentMergeData(fmt.Sprintf("%s:buildmode", builderComponentID), true))

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

	deps.Theme.AddItem(theme)

	err = processView(route.ViewRef, "$root", deps, route.Params, session)
	if err != nil {
		return nil, err
	}

	labels, err := translate.GetTranslatedLabels(session)
	if err != nil {
		return nil, errors.New("Failed to get translated labels: " + err.Error())
	}

	// need an admin session for retrieving feature flags
	// in order to prevent users from having to have read on the uesio/core.featureflagassignment table
	adminSession := datasource.GetSiteAdminSession(session)

	featureFlags, err := featureflagstore.GetFeatureFlags(adminSession, session.GetUserID())
	if err != nil {
		return nil, errors.New("Failed to get feature flags: " + err.Error())
	}

	for key, value := range labels {
		label, err := meta.NewLabel(key)
		if err != nil {
			return nil, err
		}
		label.Value = value
		deps.Label.AddItem(label)
	}

	for _, flag := range *featureFlags {
		deps.FeatureFlag.AddItem(flag)
	}

	workspace := session.GetWorkspace()

	if workspace != nil {
		// In workspace mode, make sure we have the builder pack so that we can include the buildwrapper
		builderComponentID := getBuilderComponentID(route.ViewRef)
		// If there is already an entry for build mode, don't override it, as it may be set to true
		deps.Component.AddItemIfNotExists(NewComponentMergeData(fmt.Sprintf("%s:buildmode", builderComponentID), false))
		addComponentPackToDeps(deps, DEFAULT_BUILDER_PACK_NAMESPACE, DEFAULT_BUILDER_PACK_NAME, session)
		// Also load in the modstamps for all static files in the workspace
		// so that we never have stale URLs in the view builder / preview
		err = addStaticFileModstampsForWorkspaceToDeps(deps, workspace, session)
		if err != nil {
			return nil, err
		}
	}

	return deps, nil
}

func addStaticFileModstampsForWorkspaceToDeps(deps *PreloadMetadata, workspace *meta.Workspace, session *sess.Session) error {
	// Query for all static files in the workspace
	var files meta.FileCollection
	err := bundle.LoadAllFromNamespaces([]string{workspace.App.FullName}, &files, nil, session, nil)
	if err != nil {
		return errors.New("failed to load static files: " + err.Error())
	}
	err = files.Loop(func(item meta.Item, index string) error {
		file, ok := item.(*meta.File)
		if !ok {
			return errors.New("item is not a valid File")
		}
		deps.StaticFile.AddItem(file)
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func addComponentVariantDep(depMap *ViewDepMap, variantName string, compName string) error {
	qualifiedKey, err := getFullyQualifiedVariantKey(variantName, compName)
	if err != nil {
		// TODO: We should probably return an error here at some point
		return err
	}
	depMap.Variants[qualifiedKey] = true
	return nil
}

func getComponentAreaDeps(node *yaml.Node, depMap *ViewDepMap, session *sess.Session) error {
	if node == nil || node.Kind != yaml.SequenceNode {
		return nil
	}

	for i := range node.Content {
		comp := node.Content[i]
		if isComponentLike(comp) {
			compName := comp.Content[0].Value

			compDef, err := depMap.AddComponent(compName, session)
			if err != nil {
				return err
			}

			// Load a pre-parsed slot traversal map
			slotPaths := compDef.GetSlotPaths()

			foundComponentVariant := false

			for i, prop := range comp.Content[1].Content {
				if prop.Kind == yaml.ScalarNode && prop.Value == "uesio.variant" {
					if len(comp.Content[1].Content) > i {
						valueNode := comp.Content[1].Content[i+1]
						if valueNode.Kind == yaml.ScalarNode && valueNode.Value != "" {
							if err = addComponentVariantDep(depMap, valueNode.Value, compName); err == nil {
								foundComponentVariant = true
							}
						}
					}
				} else {
					err := getComponentAreaDeps(prop, depMap, session)
					if err != nil {
						return err
					}
				}
			}
			// If we did not find a specific component variant,
			// see if this component type has a default variant,
			// and if so, request it, and populate it in the View YAML
			// so that we know what variant to use client-side
			if !foundComponentVariant {
				defaultVariant := compDef.GetDefaultVariant()
				if defaultVariant != "" {
					if err := addComponentVariantDep(depMap, defaultVariant, compName); err == nil {
						comp.Content[1].Content = append(comp.Content[1].Content,
							&yaml.Node{
								Kind:  yaml.ScalarNode,
								Value: "uesio.variant",
							},
							&yaml.Node{
								Kind:  yaml.ScalarNode,
								Value: defaultVariant,
							},
						)
					}
				}
			}

			if len(slotPaths) > 0 {
				for _, path := range slotPaths {
					matchingNodes, err := yptr.FindAll(comp.Content[1], path)
					if err != nil {
						continue
					}
					for _, n := range matchingNodes {
						err := getComponentAreaDeps(n, depMap, session)
						if err != nil {
							return err
						}
					}
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
