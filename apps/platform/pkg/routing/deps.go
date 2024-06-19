package routing

import (
	"bytes"
	"errors"
	"fmt"
	"strings"
	"time"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/translate"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

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

	err = bundle.Load(subViewDep, nil, session, nil)
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

	err = bundle.Load(variantDep, nil, session, nil)
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

func addComponentPackToDeps(deps *preload.PreloadMetadata, packNamespace, packName string, session *sess.Session) {
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
		if err := bundle.Load(pack, nil, session, nil); err != nil || pack.UpdatedAt == 0 {
			pack.UpdatedAt = time.Now().Unix()
		}
	}
	// If the pack wasn't requested before, we need to go ahead and request it
	if !alreadyRequested {
		deps.ComponentPack.AddItem(pack)
	}
}

func getDepsForUtilityComponent(key string, deps *preload.PreloadMetadata, session *sess.Session) error {

	namespace, name, err := meta.ParseKey(key)
	if err != nil {
		return err
	}

	utility := meta.NewBaseUtility(namespace, name)

	if err = bundle.Load(utility, nil, session, nil); err != nil {
		return err
	}

	if utility.Pack == "" {
		return nil
	}

	addComponentPackToDeps(deps, namespace, utility.Pack, session)

	for _, key := range utility.Utilities {
		if utilityErr := getDepsForUtilityComponent(key, deps, session); utilityErr != nil {
			return utilityErr
		}
	}

	return nil

}

func getDepsForComponent(component *meta.Component, deps *preload.PreloadMetadata, session *sess.Session) error {

	if component.Pack != "" {
		addComponentPackToDeps(deps, component.Namespace, component.Pack, session)
	}

	// Add all Components to the Component Type dependency map
	// so that we can send down their runtime definition metadata into the View HTML.
	deps.ComponentType.AddItemIfNotExists((*meta.RuntimeComponentMetadata)(component))

	for _, key := range component.Utilities {
		if utilityErr := getDepsForUtilityComponent(key, deps, session); utilityErr != nil {
			return utilityErr
		}
	}
	return nil
}

func getSubParams(viewDef *yaml.Node, parentParamValues map[string]interface{}, session *sess.Session) (map[string]interface{}, error) {

	subParams := map[string]interface{}{}
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

func processView(key string, viewInstanceID string, deps *preload.PreloadMetadata, params map[string]interface{}, session *sess.Session) error {

	view, err := loadViewDef(key, session)
	if err != nil {
		return err
	}

	deps.ViewDef.AddItem(view)

	depMap, err := GetViewDependencies(view, session)
	if err != nil {
		return err
	}

	for _, component := range depMap.Components {
		if compDepsErr := getDepsForComponent(component, deps, session); compDepsErr != nil {
			return compDepsErr
		}
	}

	for _, variant := range depMap.Variants {
		deps.ComponentVariant.AddItemIfNotExists(variant)
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

		err = processView(meta.GetFullyQualifiedKey(viewKey, view.Namespace), viewID, deps, subParams, session)
		if err != nil {
			return err
		}
	}

	if viewInstanceID != "" {
		var ops []*wire.LoadOp

		for _, pair := range depMap.Wires {
			loadOp := &wire.LoadOp{
				WireName:  pair.Key,
				View:      view.GetKey() + "(" + viewInstanceID + ")",
				Query:     true,
				Params:    params,
				Preloaded: true,
			}
			if err := pair.Node.Decode(loadOp); err != nil {
				return err
			}
			ops = append(ops, loadOp)
		}

		metadata, err := datasource.Load(ops, session, nil)
		if err != nil {
			return err
		}

		metadata.LoopSelectLists(func(key string, selectList *wire.SelectListMetadata) {
			// If this collection is already in the metadata, we need to merge the new and existing
			// to create a union of all metadata requested by any wires
			deps.SelectList.AddItemIfNotExists(selectList)
		})

		for _, collection := range metadata.Collections {
			// If this collection is already in the metadata, we need to merge the new and existing
			// to create a union of all metadata requested by any wires
			if existingItem, alreadyExists := deps.Collection.AddItemIfNotExists(collection); alreadyExists {
				// Cast to CollectionMetadata so that we can use nicer methods
				existingCollection := existingItem.(*wire.CollectionMetadata)
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

func InBuildMode(fullViewId string, deps *preload.MetadataMergeData) bool {
	if deps == nil {
		return false
	}
	builderComponentID := getBuilderComponentID(fullViewId)
	buildModeKey := GetBuildModeKey(builderComponentID)
	return deps.Has(buildModeKey)
}

func GetBuilderDependencies(viewNamespace, viewName string, deps *preload.PreloadMetadata, session *sess.Session) error {

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

	deps.Component.AddItem(preload.NewComponentMergeData(fmt.Sprintf("%s:metadata:viewdef:%s", builderComponentID, view.GetKey()), viewBytes.String()))

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

	for _, component := range components {
		if err = getDepsForComponent(component, deps, session); err != nil {
			return err
		}
		deps.ComponentType.AddItem(component)
	}

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
	adminSession := sess.GetAnonSessionFrom(session)

	featureFlags, err := featureflagstore.GetFeatureFlags(adminSession, session.GetContextUser().ID)
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

	err = bundle.Load(theme, nil, session.RemoveWorkspaceContext(), nil)
	if err != nil {
		return err
	}

	deps.Theme.AddItem(theme)

	// Get the metadata list
	appNames := session.GetContextNamespaces()
	appData, err := datasource.GetAppData(session.Context(), appNames)
	if err != nil {
		return err
	}

	deps.Component.AddItem(preload.NewComponentMergeData(fmt.Sprintf("%s:namespaces", builderComponentID), appData))
	deps.Component.AddItem(preload.NewComponentMergeData(GetBuildModeKey(builderComponentID), true))
	deps.Component.AddItem(preload.NewComponentMergeData(GetIndexPanelKey(builderComponentID), true))

	return nil
}

func GetBuildModeKey(builderComponentID string) string {
	return fmt.Sprintf("%s:buildmode", builderComponentID)
}

func GetIndexPanelKey(builderComponentID string) string {
	return fmt.Sprintf("%s:indexpanel", builderComponentID)
}

func GetMetadataDeps(route *meta.Route, session *sess.Session) (*preload.PreloadMetadata, error) {

	deps := preload.NewPreloadMetadata()

	if route.ThemeRef == "" {
		route.ThemeRef = session.GetDefaultTheme()
	}

	theme, err := meta.NewTheme(route.ThemeRef)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(theme, nil, session, nil)
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

	featureFlags, err := featureflagstore.GetFeatureFlags(session, session.GetContextUser().ID)
	if err != nil {
		return nil, errors.New("Failed to get feature flags: " + err.Error())
	}

	configValues, err := configstore.GetConfigValues(session, nil)
	if err != nil {
		return nil, errors.New("Failed to get config values: " + err.Error())
	}

	// Add in route assignments
	var routeAssignments meta.RouteAssignmentCollection
	err = bundle.LoadAllFromAny(&routeAssignments, nil, session, nil)
	if err != nil {
		return nil, errors.New("Failed to load route assignments: " + err.Error())
	}

	routes := []meta.BundleableItem{}
	routeMap := map[string]meta.BundleableItem{}
	collections := []meta.BundleableItem{}
	collectionMap := map[string]meta.BundleableItem{}

	for _, assignment := range routeAssignments {
		route, err := meta.NewRoute(assignment.RouteRef)
		if err != nil {
			return nil, err
		}
		routes = append(routes, route)
		routeMap[assignment.RouteRef] = route

		collection, err := meta.NewCollection(assignment.Collection)
		if err != nil {
			return nil, err
		}
		collections = append(collections, collection)
		collectionMap[assignment.Collection] = collection
	}

	err = bundle.LoadMany(routes, &bundlestore.GetManyItemsOptions{
		AllowMissingItems: true,
	}, session, nil)
	if err != nil {
		return nil, errors.New("Failed to load routes for route assignments: " + err.Error())
	}

	err = bundle.LoadMany(collections, &bundlestore.GetManyItemsOptions{
		AllowMissingItems: true,
	}, session, nil)
	if err != nil {
		return nil, errors.New("Failed to load collections for route assignments: " + err.Error())
	}

	for _, assignment := range routeAssignments {
		routeItem, ok := routeMap[assignment.RouteRef]
		if !ok {
			continue
		}
		route, ok := routeItem.(*meta.Route)
		if !ok {
			continue
		}
		collectionItem, ok := collectionMap[assignment.Collection]
		if !ok {
			continue
		}
		collection, ok := collectionItem.(*meta.Collection)
		if !ok {
			continue
		}
		if route.Path != "" && collection.Label != "" {
			assignment.Path = route.Path
			assignment.CollectionLabel = collection.Label
			assignment.CollectionPluralLabel = collection.PluralLabel
			deps.RouteAssignment.AddItem(assignment)
		}
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

	for _, configValue := range *configValues {
		deps.ConfigValue.AddItem(configValue)
	}

	workspace := session.GetWorkspace()

	if workspace != nil {
		// In workspace mode, make sure we have the builder pack so that we can include the buildwrapper
		builderComponentID := getBuilderComponentID(route.ViewRef)
		// If there is already an entry for build mode, don't override it, as it may be set to true
		deps.Component.AddItemIfNotExists(preload.NewComponentMergeData(GetBuildModeKey(builderComponentID), false))
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

func addStaticFileModstampsForWorkspaceToDeps(deps *preload.PreloadMetadata, workspace *meta.Workspace, session *sess.Session) error {
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

func addComponentVariantDep(depMap *ViewDepMap, variantName string, compName string, session *sess.Session) error {
	qualifiedKey, err := getFullyQualifiedVariantKey(variantName, compName)
	if err != nil {
		// TODO: We should probably return an error here at some point
		return err
	}
	// Only load if we don't have it already
	if _, isPresent := depMap.Variants[qualifiedKey]; isPresent {
		return nil
	}
	// Otherwise load the variant
	variant, loadErr := loadVariant(qualifiedKey, session)
	if loadErr != nil {
		return loadErr
	}
	// Mark that we have loaded this variant, so that we won't try to double-load it as part of dep processing
	depMap.Variants[qualifiedKey] = variant
	// Process the parent variant, if we haven't done that yet.
	if variant.Extends != "" && qualifiedKey != variant.GetExtendsKey() {
		extendsKey, extendsErr := getFullyQualifiedVariantKey(variant.Extends, variant.Component)
		if extendsErr != nil {
			return extendsErr
		}
		extendsErr = addComponentVariantDep(depMap, extendsKey, compName, session)
		if extendsErr != nil {
			return extendsErr
		}
	}

	// Process dependency variants
	for _, key := range variant.Variants {
		// Parse the dependency name to get the dependent component type
		parts := strings.Split(key, ":")
		if len(parts) != 2 {
			return fmt.Errorf("invalid dependent variant '%s' specified for parent component %s", key, compName)
		}
		depCompName := parts[0]
		depVariantKey := parts[1]
		depErr := addComponentVariantDep(depMap, depVariantKey, depCompName, session)
		if depErr != nil {
			return err
		}
	}
	// Finally, process the definition itself as a "component" area
	if variant.Definition != nil && variant.Definition.Content != nil && len(variant.Definition.Content) > 0 {
		if compDefErr := getComponentDeps(compName, (*yaml.Node)(variant.Definition), depMap, session); compDefErr != nil {
			return compDefErr
		}
	}

	return nil
}

func getComponentAreaDeps(node *yaml.Node, depMap *ViewDepMap, session *sess.Session) error {

	node = meta.UnwrapDocumentNode(node)
	if node == nil || node.Kind != yaml.SequenceNode {
		return nil
	}

	for i := range node.Content {
		comp := node.Content[i]
		if isComponentLike(comp) {
			compName := comp.Content[0].Value
			if err := getComponentDeps(compName, comp.Content[1], depMap, session); err != nil {
				return err
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

func getComponentDeps(compName string, compDefinitionMap *yaml.Node, depMap *ViewDepMap, session *sess.Session) error {

	compDef, err := depMap.AddComponent(compName, session)
	if err != nil {
		return err
	}

	slotDefinitions := compDef.GetSlotDefinitions()
	variantPropertyNames := compDef.GetVariantPropertyNames()

	foundComponentVariant := false

	// Clone the variantPropertyNames map
	// (we'll remove records from this map as we find values for them)
	variantPropsWithNoValue := make(map[string]*meta.PropertyDefinition, len(variantPropertyNames))
	for k, v := range variantPropertyNames {
		variantPropsWithNoValue[k] = v
	}

	for i, prop := range compDefinitionMap.Content {
		propDef := variantPropertyNames[prop.Value]
		if prop.Kind == yaml.ScalarNode && (prop.Value == "uesio.variant" || propDef != nil) {
			if len(compDefinitionMap.Content) > i {
				valueNode := compDefinitionMap.Content[i+1]
				if valueNode.Kind == yaml.ScalarNode && valueNode.Value != "" {
					// We found a value, so remove the prop from the
					// variantPropsWithNoValue map
					delete(variantPropsWithNoValue, prop.Value)
					useComponentName := compName
					useVariantName := valueNode.Value
					if prop.Value != "uesio.variant" {
						// Check if the value contains a fully-qualified variant name, e.g. "uesio/io.grid:uesio/io.two_columns",
						// vs "uesio/io.two_columns"
						variantNameParts := strings.Split(useVariantName, ":")
						if len(variantNameParts) > 1 {
							useComponentName = variantNameParts[0]
							useVariantName = variantNameParts[1]
						} else {
							useComponentName = propDef.Metadata.Grouping
							useVariantName = variantNameParts[0]
						}
					}
					if err = addComponentVariantDep(depMap, useVariantName, useComponentName, session); err == nil {
						foundComponentVariant = true
					}
				}
			}
		} else {
			if err = getComponentAreaDeps(prop, depMap, session); err != nil {
				return err
			}
		}
	}

	// Load in default variants for props that had no value specified
	for _, propDef := range variantPropsWithNoValue {
		if propDef.DefaultValue != "" {
			if err := addComponentVariantDep(depMap, propDef.DefaultValue, propDef.Metadata.Grouping, session); err != nil {
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
			if err := addComponentVariantDep(depMap, defaultVariant, compName, session); err == nil {
				compDefinitionMap.Content = append(compDefinitionMap.Content,
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

	if len(slotDefinitions) > 0 {
		for _, slotDef := range slotDefinitions {
			path := slotDef.GetFullPath()
			matchingNodes, err := yptr.FindAll(compDefinitionMap, path)
			if err != nil {
				continue
			}
			for _, n := range matchingNodes {
				err := getComponentAreaDeps(n, depMap, session)
				if err != nil {
					return err
				}
			}
			// If there were no matching nodes, and our slot has a default content,
			// also parse through the default content
			if len(matchingNodes) == 0 && slotDef.DefaultContent != nil {
				err := getComponentAreaDeps((*yaml.Node)(slotDef.DefaultContent), depMap, session)
				if err != nil {
					return err
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
	Variants   map[string]*meta.ComponentVariant
	Views      map[string]*yaml.Node
	Wires      []meta.NodePair
}

func (vdm *ViewDepMap) AddComponent(key string, session *sess.Session) (*meta.Component, error) {
	component, ok := vdm.Components[key]
	if ok {
		return component, nil
	}
	// Load the Component meta info from bundle store
	component, err := meta.NewComponent(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(component, nil, session, nil)
	if err != nil {
		return nil, err
	}
	vdm.Components[key] = component
	// If this is a declarative component, we need to process dependencies of the component's definition
	if component.Type == meta.DeclarativeComponent {
		if err = getComponentAreaDeps((*yaml.Node)(component.Definition), vdm, session); err != nil {
			return nil, err
		}
	}
	// Process any variants now
	if len(component.Variants) > 0 {
		for _, variantKey := range component.Variants {
			if variantErr := addComponentVariantDep(vdm, variantKey, key, session); variantErr != nil {
				return nil, variantErr
			}
		}

	}
	return component, nil
}

func NewViewDefMap() *ViewDepMap {
	return &ViewDepMap{
		Components: map[string]*meta.Component{},
		Variants:   map[string]*meta.ComponentVariant{},
		Views:      map[string]*yaml.Node{},
		Wires:      []meta.NodePair{},
	}
}

func GetViewDependencies(v *meta.View, session *sess.Session) (*ViewDepMap, error) {

	components, err := meta.GetMapNode((*yaml.Node)(v.Definition), "components")
	if err != nil {
		return nil, err
	}
	panels, err := meta.GetMapNode((*yaml.Node)(v.Definition), "panels")
	if err != nil {
		panels = nil
	}

	wires, err := meta.GetMapNode((*yaml.Node)(v.Definition), "wires")
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
					compName := panelType.Value
					if err = getComponentDeps(compName, panel, depMap, session); err != nil {
						return nil, err
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
