package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// ViewResponse struct
type ViewResponse struct {
	Name         string
	Namespace    string
	Definition   *yaml.Node        `yaml:"definition"`
	Dependencies *ViewDependencies `yaml:"dependencies"`
}

type ViewDependencies struct {
	ComponentPacks    map[string]bool                   `yaml:"componentpacks,omitempty"`
	ConfigValues      map[string]string                 `yaml:"configvalues,omitempty"`
	ComponentVariants map[string]*meta.ComponentVariant `yaml:"componentvariants,omitempty"`
	FeatureFlags      map[string]*FeatureFlagResponse   `yaml:"featureflags,omitempty"`
}

// ViewPreview is also good
func ViewPreview(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		viewNamespace := vars["namespace"]
		viewName := vars["name"]

		session := middleware.GetSession(r)

		view := meta.View{
			Name:      viewName,
			Namespace: viewNamespace,
		}

		// Make sure this is a legit view that we have access to
		err := bundle.Load(&view, session)
		if err != nil {
			HandleMissingRoute(w, r, session, "", err)
			return
		}

		route := &meta.Route{
			ViewRef:  view.GetKey(),
			Params:   map[string]string{},
			ThemeRef: session.GetDefaultTheme(),
		}

		ExecuteIndexTemplate(w, route, buildMode, session)
	}
}

// ViewEdit is also good
func ViewEdit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	viewNamespace := vars["namespace"]
	viewName := vars["name"]

	session := middleware.GetSession(r)

	view := meta.View{
		Name:      viewName,
		Namespace: viewNamespace,
	}

	// Make sure this is a legit view that we have access to
	err := bundle.Load(&view, session)
	if err != nil {
		HandleMissingRoute(w, r, session, "", err)
		return
	}

	route := &meta.Route{
		ViewRef:  view.GetKey(),
		Params:   map[string]string{},
		ThemeRef: session.GetDefaultTheme(),
	}

	ExecuteIndexTemplate(w, route, true, session)
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

func getBuilderDependencies(session *sess.Session) (*ViewDependencies, error) {

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

	deps := ViewDependencies{
		ComponentPacks:    map[string]bool{},
		ComponentVariants: map[string]*meta.ComponentVariant{},
		ConfigValues:      map[string]string{},
		FeatureFlags:      map[string]*FeatureFlagResponse{},
	}

	for _, packs := range packsByNamespace {
		for _, pack := range packs {
			deps.ComponentPacks[pack.GetKey()] = true
			for key := range pack.Components.ViewComponents {
				err := getDepsForComponent(key, &deps, packsByNamespace, session)
				if err != nil {
					return nil, err
				}
			}
		}

	}
	for i := range variants {
		variant := variants[i]
		deps.ComponentVariants[variant.GetKey()] = &variant
	}

	ffr, _ := getFeatureFlags(session)
	for i := range ffr {
		featureFlag := ffr[i]
		deps.FeatureFlags[featureFlag.Name] = &featureFlag
	}

	return &deps, nil
}

func loadVariant(key string, session *sess.Session) (*meta.ComponentVariant, error) {
	namespace, name, component, err := getVariantParts(key)
	if err != nil {
		return nil, errors.New("Invalid variant key: " + key)
	}
	variantDep := meta.ComponentVariant{
		Namespace: namespace,
		Name:      name,
		Component: component,
	}
	err = bundle.Load(&variantDep, session)
	if err != nil {
		return nil, errors.New("Failed to load variant: " + key + err.Error())
	}
	return &variantDep, nil
}

func getVariantParts(key string) (string, string, string, error) {
	partsOfKey := strings.Split(key, ".")
	if len(partsOfKey) != 4 {
		return "", "", "", errors.New("Invalid variant key: " + key)
	}
	return partsOfKey[2], partsOfKey[3], partsOfKey[0] + "." + partsOfKey[1], nil
}

func getDepsForComponent(key string, deps *ViewDependencies, packs map[string]meta.ComponentPackCollection, session *sess.Session) error {
	namespace, _, err := meta.ParseKey(key)
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
		componentInfo, ok := pack.Components.ViewComponents[key]
		if ok {

			deps.ComponentPacks[pack.GetKey()] = true
			if componentInfo != nil {
				for _, key := range componentInfo.ConfigValues {
					_, ok := deps.ConfigValues[key]
					if !ok {
						value, err := configstore.GetValueFromKey(key, session)
						if err != nil {
							return err
						}
						deps.ConfigValues[key] = value
					}
				}

				for _, key := range componentInfo.Variants {
					variantDep, err := loadVariant(key, session)
					if err != nil {
						return err
					}
					deps.ComponentVariants[key] = variantDep
				}

				for _, key := range componentInfo.Utilities {
					err = getDepsForComponent(key, deps, packs, session)
					if err != nil {
						return err
					}
				}
			}
		}
	}
	return nil
}

func getViewDependencies(view *meta.View, session *sess.Session) (*ViewDependencies, error) {
	workspace := session.GetWorkspaceID()
	if workspace != "" {
		return getBuilderDependencies(session)
	}

	// Process Configuration Value Dependencies
	componentsUsed, variantsUsed, err := view.GetComponentsAndVariants()
	if err != nil {
		return nil, err
	}

	deps := ViewDependencies{
		ComponentPacks:    map[string]bool{},
		ComponentVariants: map[string]*meta.ComponentVariant{},
		ConfigValues:      map[string]string{},
		FeatureFlags:      map[string]*FeatureFlagResponse{},
	}

	packs := map[string]meta.ComponentPackCollection{}

	for key := range variantsUsed {
		variantDep, err := loadVariant(key, session)
		if err != nil {
			return nil, err
		}
		deps.ComponentVariants[key] = variantDep
	}

	for key := range componentsUsed {
		err := getDepsForComponent(key, &deps, packs, session)
		if err != nil {
			return nil, err
		}
	}

	ffr, _ := getFeatureFlags(session)
	for i := range ffr {
		featureFlag := ffr[i]
		deps.FeatureFlags[featureFlag.Name] = &featureFlag
	}

	return &deps, nil
}

// View is good
func View(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)

	viewNamespace := vars["namespace"]
	viewName := vars["name"]

	session := middleware.GetSession(r)

	view := meta.View{
		Name:      viewName,
		Namespace: viewNamespace,
	}

	err := bundle.Load(&view, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.NotFound(w, r)
		return
	}

	dependencies, err := getViewDependencies(&view, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondYAML(w, r, &ViewResponse{
		Name:         view.Name,
		Namespace:    view.Namespace,
		Definition:   &view.Definition,
		Dependencies: dependencies,
	})
}
