package routing

import (
	"bytes"
	"errors"
	"fmt"
	"strings"

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

	"maps"

	yptr "github.com/zachelrath/yaml-jsonpointer"
)

var DEFAULT_BUILDER_PACK_NAMESPACE = "uesio/builder"
var DEFAULT_BUILDER_PACK_NAME = "main"

var DEFAULT_BUILDER_COMPONENT = "uesio/builder.mainwrapper"
var BUILD_BAR_COMPONENT = "uesio/builder.buildbar"

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
		return nil, fmt.Errorf("unable to load SubView '%s': %w", key, err)
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
		return nil, fmt.Errorf("unable to load variant '%s': %w", key, err)
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

func addComponentPackToDeps(deps *preload.PreloadMetadata, packNamespace, packName string, session *sess.Session) error {
	pack := meta.NewBaseComponentPack(packNamespace, packName)
	existingItem, alreadyRequested := deps.ComponentPack.AddItemIfNotExists(pack)
	// If the pack has not been requested yet we need to load it so that we have that metadata available.
	if alreadyRequested {
		// TODO: This check likely isn't necessary but maintaining from prior code
		// that would perform it and then load the pack if the item wasn't a component
		// pack.  The item should NEVER not be a component pack here.  This can
		// likely be removed in future assuming no issues arise.
		if existingPack, ok := existingItem.(*meta.ComponentPack); !ok {
			return fmt.Errorf("unexpected item found for component pack: '%s.%s'", packNamespace, packName)
		} else {
			pack = existingPack
		}
	} else {
		if err := bundle.Load(pack, nil, session, nil); err != nil {
			return err
		}
		// TODO: This check can be eventually removed.  It's intended to cover legacy code that
		// would allow UpdatedAt to be zero since previously some bundlestores did not provide a
		// value and when detected, we would set UpdatedAt to current time.  Bundlestores are now
		// required to provide a non-zero UpdatedAt since it is needed for caching purposes to ensure
		// we don't have multiple copies of the same bundle in the cache and to be able to detect
		// changes to a bundle.  This check can be removed at some point once we confirm the change
		// in logic does not introduce any issues (which is shouldn't).
		if pack.UpdatedAt == 0 {
			return fmt.Errorf("bundlestore did not provide a value for UpdatedAt for component pack: '%s.%s'", packNamespace, packName)
		}
	}
	if session.GetWorkspace() == nil {
		pack.SiteOnly = true
	}
	// If the pack wasn't requested before, we need to go ahead and request it
	if !alreadyRequested {
		deps.ComponentPack.AddItem(pack)
	}

	return nil
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

func getDepsForComponent(component *meta.Component, deps *preload.PreloadMetadata, subViews map[string]*yaml.Node, session *sess.Session) error {

	versionSession, err := datasource.EnterVersionContext(component.Namespace, session, nil)
	if err != nil {
		return err
	}

	if component.Pack != "" {
		addComponentPackToDeps(deps, component.Namespace, component.Pack, versionSession)
	}

	// Add all Components to the Component Type dependency map
	// so that we can send down their runtime definition metadata into the View HTML.
	deps.ComponentType.AddItemIfNotExists((*meta.RuntimeComponentMetadata)(component))

	for _, key := range component.Utilities {
		err := getDepsForUtilityComponent(key, deps, versionSession)
		if err != nil {
			return err
		}
	}

	for _, key := range component.SubComponents {
		_, err := addComponentType(key, deps, subViews, versionSession)
		if err != nil {
			return err
		}
	}

	// If this is a declarative component, we need to process dependencies of the component's definition
	if component.Type == meta.DeclarativeComponent {
		err := getComponentAreaDeps((*yaml.Node)(component.Definition), deps, subViews, versionSession)
		if err != nil {
			return err
		}
	}
	// Process any variants now
	for _, variantKey := range component.Variants {
		err := addComponentVariantDep(variantKey, component.GetKey(), deps, subViews, versionSession)
		if err != nil {
			return err
		}
	}

	return nil
}

func getSubParams(viewDef *yaml.Node, parentParamValues map[string]interface{}, wireData map[string]meta.Group, session *sess.Session) (map[string]interface{}, *yaml.Node, error) {

	subParams := map[string]interface{}{}
	var slotMapNode *yaml.Node
	// Process the params
	for i, prop := range viewDef.Content {
		if prop.Kind == yaml.ScalarNode && prop.Value == "slots" {
			slotMapNode = viewDef.Content[i+1]
		}

		if prop.Kind == yaml.ScalarNode && prop.Value == "params" {

			if len(viewDef.Content) > i {
				valueNode := viewDef.Content[i+1]
				paramsNodes, err := meta.GetMapNodes(valueNode)
				if err != nil {
					return nil, nil, err
				}
				for _, param := range paramsNodes {
					template, err := templating.NewWithFuncs(param.Node.Value, merge.RecordMergeFunc, merge.ServerMergeFuncs)
					if err != nil {
						return nil, nil, err
					}

					mergedValue, err := templating.Execute(template, merge.ServerMergeData{
						Session:     session,
						ParamValues: parentParamValues,
						WireData:    wireData,
					})
					if err != nil {
						return nil, nil, err
					}

					subParams[param.Key] = mergedValue
				}
			}
		}
	}
	return subParams, slotMapNode, nil
}

func processViewWires(view *meta.View, viewInstanceID string, deps *preload.PreloadMetadata, params map[string]interface{}, session *sess.Session) (map[string]meta.Group, error) {
	wires, err := meta.GetMapNode((*yaml.Node)(view.Definition), "wires")
	if err != nil {
		wires = nil
	}

	wireData := map[string]meta.Group{}

	// If we already removed our collection or wire dependency bucket,
	// that means we don't care about wire data and don't want to
	// process it here.
	if deps.Collection == nil || deps.Wire == nil {
		return wireData, nil
	}

	if viewInstanceID != "" && wires != nil && wires.Kind == yaml.MappingNode {
		var ops []*wire.LoadOp

		wirePairs, err := meta.GetMapNodes(wires)
		if err != nil {
			return nil, err
		}

		for _, pair := range wirePairs {
			loadOp := &wire.LoadOp{
				WireName:  pair.Key,
				View:      view.GetKey() + "(" + viewInstanceID + ")",
				Query:     true,
				Params:    params,
				Preloaded: true,
			}
			if err := pair.Node.Decode(loadOp); err != nil {
				return nil, err
			}
			ops = append(ops, loadOp)
		}

		metadata, err := datasource.Load(ops, session, nil)
		if err != nil {
			return nil, err
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
			wireData[op.WireName] = op.Collection
		}
	}
	return wireData, nil
}

func processViewComponents(view *meta.View, deps *preload.PreloadMetadata, slotMapNode *yaml.Node, session *sess.Session) (map[string]*yaml.Node, error) {
	components, err := meta.GetMapNode((*yaml.Node)(view.Definition), "components")
	if err != nil {
		return nil, err
	}
	panels, err := meta.GetMapNode((*yaml.Node)(view.Definition), "panels")
	if err != nil {
		panels = nil
	}

	slots, err := meta.GetMapNode((*yaml.Node)(view.Definition), "slots")
	if err != nil {
		slots = nil
	}

	subViews := map[string]*yaml.Node{}

	err = getComponentAreaDeps(components, deps, subViews, session)
	if err != nil {
		return nil, err
	}

	// We need to process slot definitions here in the same
	// way we do them for declarative components.
	err = getSlotDeps(meta.ParseSlotDef(slots), slotMapNode, deps, subViews, session)
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
					if err = getComponentDeps(compName, panel, deps, subViews, session); err != nil {
						return nil, err
					}
				}
			}
		}
	}

	return subViews, nil
}

func processSubViews(view *meta.View, deps *preload.PreloadMetadata, wireData map[string]meta.Group, subViews map[string]*yaml.Node, params map[string]interface{}, session *sess.Session) error {
	for viewKey, viewCompDef := range subViews {

		if view.GetKey() == viewKey {
			continue
		}

		viewID := meta.GetNodeValueAsString(viewCompDef, "uesio.id")

		if params == nil {
			viewID = ""
		}

		subParams, slotMapNode, err := getSubParams(viewCompDef, params, wireData, session)
		if err != nil {
			// If we get an error processing a subview, don't panic,
			// just set the viewID to blank so that we don't server-side
			// process its wires.
			viewID = ""
		}

		err = processView(meta.GetFullyQualifiedKey(viewKey, view.Namespace), viewID, deps, subParams, slotMapNode, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func processView(key string, viewInstanceID string, deps *preload.PreloadMetadata, params map[string]interface{}, slotMapNode *yaml.Node, session *sess.Session) error {

	view, err := loadViewDef(key, session)
	if err != nil {
		return err
	}

	deps.ViewDef.AddItem(view)

	wireData, err := processViewWires(view, viewInstanceID, deps, params, session)
	if err != nil {
		return err
	}

	subViews, err := processViewComponents(view, deps, slotMapNode, session)
	if err != nil {
		return err
	}

	return processSubViews(view, deps, wireData, subViews, params, session)

}

func InBuildMode(fullViewId string, deps *preload.MetadataMergeData) bool {
	if deps == nil {
		return false
	}
	builderComponentID := getBuilderComponentID(fullViewId)
	buildModeKey := GetBuildModeKey(builderComponentID)
	return deps.Has(buildModeKey)
}

func GetWorkspaceModeDeps(deps *preload.PreloadMetadata, session *sess.Session, builderComponentID string) error {
	// Load in the builder theme.
	theme, err := meta.NewTheme("uesio/builder.default")
	if err != nil {
		return err
	}

	baseStudioSession := session.RemoveWorkspaceContext()

	err = bundle.Load(theme, nil, baseStudioSession, nil)
	if err != nil {
		return err
	}

	deps.Theme.AddItem(theme)

	// Add in any builder-specfic feature flags.
	chatPanelFlag, err := featureflagstore.GetFeatureFlag("uesio/studio.chat_panel", baseStudioSession, baseStudioSession.GetContextUser().ID)
	if err != nil {
		return err
	}
	deps.FeatureFlag.AddItem(chatPanelFlag)

	// Get the metadata list
	appNames := session.GetContextNamespaces()
	appData, err := datasource.GetAppData(session.Context(), appNames, nil)
	if err != nil {
		return err
	}

	deps.Component.AddItem(preload.NewComponentMergeData(fmt.Sprintf("%s:namespaces", builderComponentID), appData))

	return nil
}

func GetViewDependencies(viewNamespace, viewName string, deps *preload.PreloadMetadata, session *sess.Session) error {
	viewKey := viewNamespace + "." + viewName
	view, err := loadViewDef(viewKey, session)
	if err != nil {
		return err
	}

	deps.ViewDef.AddItem(view)

	return processView(viewKey, "", deps, nil, nil, session)

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

	for _, component := range components {
		if err = getDepsForComponent(component, deps, map[string]*yaml.Node{}, session); err != nil {
			return err
		}
		deps.ComponentType.AddItem(component)
	}

	for i := range variants {
		deps.ComponentVariant.AddItem(variants[i])
	}

	deps.Component.AddItem(preload.NewComponentMergeData(GetBuildModeKey(builderComponentID), true))
	deps.Component.AddItem(preload.NewComponentMergeData(GetIndexPanelKey(builderComponentID), true))

	addComponentType(DEFAULT_BUILDER_COMPONENT, deps, map[string]*yaml.Node{}, sess.GetStudioAnonSession(session.Context()))

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

	err = processView(route.ViewRef, "$root", deps, route.Params, nil, session)
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

	// Add in fonts
	var fonts meta.FontCollection
	err = bundle.LoadAllFromAny(&fonts, nil, session, nil)
	if err != nil {
		return nil, errors.New("Failed to load fonts: " + err.Error())
	}

	for _, font := range fonts {
		deps.Font.AddItem(font)
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
			if assignment.Type == "list" {
				assignment.Label = collection.PluralLabel
			} else {
				assignment.Label = collection.Label
			}
			assignment.Icon = collection.Icon
			deps.RouteAssignment.AddItem(assignment)
		}
	}

	// Add route Assignemnts for login, signup, and home routes
	signupRoute, err := GetSignupRoute(session)
	if err != nil {
		return nil, err
	}
	if signupRoute != nil {
		deps.RouteAssignment.AddItem(&meta.RouteAssignment{
			Type: "signup",
			BundleableBase: meta.BundleableBase{
				Label:     "Sign Up",
				Name:      signupRoute.Name,
				Namespace: signupRoute.Namespace,
			},
			Icon: "badge",
			Path: signupRoute.Path,
		})
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

		err = GetWorkspaceModeDeps(deps, session, builderComponentID)
		if err != nil {
			return nil, err
		}
		// If there is already an entry for build mode, don't override it, as it may be set to true
		deps.Component.AddItemIfNotExists(preload.NewComponentMergeData(GetBuildModeKey(builderComponentID), false))
		addComponentPackToDeps(deps, DEFAULT_BUILDER_PACK_NAMESPACE, DEFAULT_BUILDER_PACK_NAME, sess.GetStudioAnonSession(session.Context()))
		// Also load in the modstamps for all static files in the workspace
		// so that we never have stale URLs in the view builder / preview
		err = addStaticFileModstampsForWorkspaceToDeps(deps, workspace, session)
		if err != nil {
			return nil, err
		}

		addComponentType(BUILD_BAR_COMPONENT, deps, map[string]*yaml.Node{}, sess.GetStudioAnonSession(session.Context()))
	}

	return deps, nil
}

func addStaticFileModstampsForWorkspaceToDeps(deps *preload.PreloadMetadata, workspace *meta.Workspace, session *sess.Session) error {
	// Query for all static files in the workspace
	var files meta.FileCollection
	err := bundle.LoadAllFromNamespaces([]string{workspace.GetAppFullName()}, &files, nil, session, nil)
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

func addComponentVariantDep(variantName string, compName string, deps *preload.PreloadMetadata, subViews map[string]*yaml.Node, session *sess.Session) error {
	qualifiedKey, err := getFullyQualifiedVariantKey(variantName, compName)
	if err != nil {
		// TODO: We should probably return an error here at some point
		return err
	}
	// Only load if we don't have it already
	if isPresent := deps.ComponentVariant.Has(qualifiedKey); isPresent {
		return nil
	}
	// Otherwise load the variant
	variant, loadErr := loadVariant(qualifiedKey, session)
	if loadErr != nil {
		return loadErr
	}
	// Mark that we have loaded this variant, so that we won't try to double-load it as part of dep processing
	deps.ComponentVariant.AddItem(variant)
	// Process the parent variant, if we haven't done that yet.
	if variant.Extends != "" && qualifiedKey != variant.GetExtendsKey() {
		extendsKey, extendsErr := getFullyQualifiedVariantKey(variant.Extends, variant.Component)
		if extendsErr != nil {
			return extendsErr
		}
		extendsErr = addComponentVariantDep(extendsKey, compName, deps, subViews, session)
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
		depErr := addComponentVariantDep(depVariantKey, depCompName, deps, subViews, session)
		if depErr != nil {
			return err
		}
	}
	// Finally, process the definition itself as a "component" area
	if variant.Definition != nil && variant.Definition.Content != nil && len(variant.Definition.Content) > 0 {
		if compDefErr := getComponentDeps(compName, (*yaml.Node)(variant.Definition), deps, subViews, session); compDefErr != nil {
			return compDefErr
		}
	}

	return nil
}

func getComponentAreaDeps(node *yaml.Node, deps *preload.PreloadMetadata, subViews map[string]*yaml.Node, session *sess.Session) error {

	node = meta.UnwrapDocumentNode(node)
	if node == nil || node.Kind != yaml.SequenceNode {
		return nil
	}

	for i := range node.Content {
		comp := node.Content[i]
		if isComponentLike(comp) {
			compName := comp.Content[0].Value
			if err := getComponentDeps(compName, comp.Content[1], deps, subViews, session); err != nil {
				return err
			}
			if compName == "uesio/core.view" {
				for i, prop := range comp.Content[1].Content {
					if prop.Kind == yaml.ScalarNode && prop.Value == "view" {
						if len(comp.Content[1].Content) > i {
							valueNode := comp.Content[1].Content[i+1]
							if valueNode.Kind == yaml.ScalarNode && valueNode.Value != "" {
								subViews[valueNode.Value] = comp.Content[1]
							}
						}
					}
				}
			}
		}
	}
	return nil
}

func getSlotDeps(slotDefinitions []*meta.SlotDefinition, compDefinitionMap *yaml.Node, deps *preload.PreloadMetadata, subViews map[string]*yaml.Node, session *sess.Session) error {
	if len(slotDefinitions) > 0 {
		for _, slotDef := range slotDefinitions {
			if compDefinitionMap != nil {

			}
			var matchingNodes []*yaml.Node
			var err error
			path := slotDef.GetFullPath()
			if compDefinitionMap != nil {
				matchingNodes, err = yptr.FindAll(compDefinitionMap, path)
				if err != nil {
					continue
				}
				for _, n := range matchingNodes {
					err := getComponentAreaDeps(n, deps, subViews, session)
					if err != nil {
						return err
					}
				}
			}

			// If there were no matching nodes, and our slot has a default content,
			// also parse through the default content
			if len(matchingNodes) == 0 && slotDef.DefaultContent != nil {
				err := getComponentAreaDeps((*yaml.Node)(slotDef.DefaultContent), deps, subViews, session)
				if err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func getComponentDeps(compName string, compDefinitionMap *yaml.Node, deps *preload.PreloadMetadata, subViews map[string]*yaml.Node, session *sess.Session) error {

	compDef, err := addComponentType(compName, deps, subViews, session)
	if err != nil {
		return err
	}

	variantPropertyNames := compDef.GetVariantPropertyNames()

	foundComponentVariant := false

	// Clone the variantPropertyNames map
	// (we'll remove records from this map as we find values for them)
	var variantPropsWithNoValue map[string]*meta.PropertyDefinition
	if len(variantPropertyNames) > 0 {
		variantPropsWithNoValue = make(map[string]*meta.PropertyDefinition, len(variantPropertyNames))
		maps.Copy(variantPropsWithNoValue, variantPropertyNames)
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
					} else {
						if useVariantName != "" {
							foundComponentVariant = true
						}
					}
					err = addComponentVariantDep(useVariantName, useComponentName, deps, subViews, session)
					if err != nil {
						// Do nothing
					}
				}
			}
		}
	}

	// Load in default variants for props that had no value specified
	for _, propDef := range variantPropsWithNoValue {
		if propDef.DefaultValue != "" {
			if err := addComponentVariantDep(propDef.DefaultValue, propDef.Metadata.Grouping, deps, subViews, session); err != nil {
				return err
			}
		}
	}

	if !foundComponentVariant {
		defaultVariant := compDef.GetDefaultVariant()
		if defaultVariant != "" {
			err := addComponentVariantDep(defaultVariant, compName, deps, subViews, session)
			if err != nil {
				// Do nothing
			}
		}
	}

	return getSlotDeps(compDef.GetSlotDefinitions(), compDefinitionMap, deps, subViews, session)

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

func addComponentType(key string, deps *preload.PreloadMetadata, subViews map[string]*yaml.Node, session *sess.Session) (*meta.Component, error) {

	dep, ok := deps.ComponentType.Get(key)
	if ok {
		switch c := dep.(type) {
		case *meta.Component:
			return c, nil
		case *meta.RuntimeComponentMetadata:
			return (*meta.Component)(c), nil
		default:
			return nil, errors.New("Bad type for component metadata")
		}
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

	err = getDepsForComponent(component, deps, subViews, session)
	if err != nil {
		return nil, err
	}

	return component, nil
}
