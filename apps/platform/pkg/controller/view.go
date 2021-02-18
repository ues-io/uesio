package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
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
			ThemeRef: "uesio.default",
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
		ThemeRef: "uesio.default",
	}

	ExecuteIndexTemplate(w, route, true, session)
}
func getBuilderDependencies(session *sess.Session) (*ViewDependencies, error) {
	cPackDeps := map[string]bool{}
	configDependencies := map[string]string{}
	variantDependencies := map[string]*meta.ComponentVariant{}

	var packs meta.ComponentPackCollection
	var variants meta.ComponentVariantCollection
	err := bundle.LoadAllFromAny(&packs, nil, session)
	if err != nil {
		return nil, errors.New("Failed to load packs: " + err.Error())
	}
	err = bundle.LoadAllFromAny(&variants, nil, session)
	if err != nil {
		return nil, errors.New("Failed to load variants: " + err.Error())
	}
	for _, pack := range packs {
		cPackDeps[pack.GetKey()] = true
		for _, componentInfo := range pack.Components {
			if componentInfo != nil {
				for _, key := range componentInfo.ConfigValues {
					_, ok := configDependencies[key]
					if !ok {
						value, err := getConfigValueDependencyFromComponent(key, session)
						if err != nil {
							return nil, err
						}
						configDependencies[key] = value
					}
				}
			}
		}
	}
	for i, _ := range variants {
		variant := variants[i]
		variantDependencies[variant.GetKey()] = &variant
	}

	dependenciesResponse := ViewDependencies{
		ComponentPacks:    cPackDeps,
		ConfigValues:      configDependencies,
		ComponentVariants: variantDependencies,
	}

	return &dependenciesResponse, nil
}

func getConfigValueDependencyFromComponent(key string, session *sess.Session) (string, error) {
	value, err := configstore.GetValueFromKey(key, session)
	if err != nil {
		return "", err
	}
	return value, nil
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

	packs := map[string]meta.ComponentPackCollection{}
	variants := map[string]*meta.ComponentVariant{}

	cPackDeps := map[string]bool{}
	configDependencies := map[string]string{}

	for key := range variantsUsed {
		partsOfKey := strings.Split(key, ".")
		if len(partsOfKey) != 4 {
			return nil, errors.New("Invalid variant key: " + key)
		}
		variantDep := meta.ComponentVariant{
			Namespace: partsOfKey[2],
			Name:      partsOfKey[3],
			Component: partsOfKey[0] + "." + partsOfKey[1],
		}
		err = bundle.Load(&variantDep, session)
		if err != nil {
			return nil, errors.New("Failed to load variant: " + key + err.Error())
		}
		variants[key] = &variantDep
	}

	for key := range componentsUsed {
		namespace, name, err := meta.ParseKey(key)
		if err != nil {
			return nil, err
		}

		packsForNamespace, ok := packs[namespace]
		if !ok {
			var packs meta.ComponentPackCollection
			err = bundle.LoadAll(&packs, namespace, nil, session)
			if err != nil {
				return nil, err
			}
			packsForNamespace = packs
		}

		for _, pack := range packsForNamespace {
			componentInfo, ok := pack.Components[name]
			if ok {
				cPackDeps[pack.GetKey()] = true
				if componentInfo != nil {
					for _, key := range componentInfo.ConfigValues {
						_, ok := configDependencies[key]
						if !ok {
							value, err := getConfigValueDependencyFromComponent(key, session)
							if err != nil {
								return nil, err
							}
							configDependencies[key] = value
						}
					}
				}
			}
		}
	}

	dependenciesResponse := ViewDependencies{
		ComponentPacks:    cPackDeps,
		ComponentVariants: variants,
		ConfigValues:      configDependencies,
	}

	return &dependenciesResponse, nil
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
