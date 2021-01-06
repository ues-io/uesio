package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
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
	ComponentPacks map[string]bool   `yaml:"componentpacks,omitempty"`
	ConfigValues   map[string]string `yaml:"configvalues,omitempty"`
}

// ViewSaveResponse struct
type ViewSaveResponse struct {
	Success bool
}

// SaveViewRequest type
type SaveViewRequest map[string]string

// SaveViews is way good - so good
func SaveViews(w http.ResponseWriter, r *http.Request) {

	session := middlewares.GetSession(r)

	decoder := json.NewDecoder(r.Body)
	var saveViewRequest SaveViewRequest
	err := decoder.Decode(&saveViewRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	views := metadata.ViewCollection{}

	for viewKey, viewDef := range saveViewRequest {
		viewNamespace, viewName, err := metadata.ParseKey(viewKey)
		if err != nil {
			logger.LogErrorWithTrace(r, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var defNode yaml.Node
		err = yaml.Unmarshal([]byte(viewDef), &defNode)
		if err != nil {
			logger.LogErrorWithTrace(r, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		existingView := metadata.View{
			Name:      viewName,
			Namespace: viewNamespace,
		}
		// Get the View ID
		err = bundles.Load(&existingView, session)
		if err != nil {
			logger.LogErrorWithTrace(r, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		views = append(views, metadata.View{
			Name:       viewName,
			Workspace:  existingView.Workspace,
			Definition: defNode,
			ID:         existingView.ID,
		})

	}

	_, err = datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &views,
		},
	}, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &ViewSaveResponse{
		Success: true,
	})
}

// ViewPreview is also good
func ViewPreview(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		viewNamespace := vars["namespace"]
		viewName := vars["name"]

		session := middlewares.GetSession(r)

		view := metadata.View{
			Name:      viewName,
			Namespace: viewNamespace,
		}

		// Make sure this is a legit view that we have access to
		err := bundles.Load(&view, session)
		if err != nil {
			HandleMissingRoute(w, r, session, "", err)
			return
		}

		route := &metadata.Route{
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

	session := middlewares.GetSession(r)

	view := metadata.View{
		Name:      viewName,
		Namespace: viewNamespace,
	}

	// Make sure this is a legit view that we have access to
	err := bundles.Load(&view, session)
	if err != nil {
		HandleMissingRoute(w, r, session, "", err)
		return
	}

	route := &metadata.Route{
		ViewRef:  view.GetKey(),
		Params:   map[string]string{},
		ThemeRef: "uesio.default",
	}

	ExecuteIndexTemplate(w, route, true, session)
}
func getBuilderDependencies(session *sess.Session) (*ViewDependencies, error) {
	// Here do something different if we are in the page builder
	bundle := session.GetSite().GetAppBundle()
	namespaces := make([]string, len(bundle.Dependencies))
	i := 0
	for dependencyName := range bundle.Dependencies {
		namespaces[i] = dependencyName
		i++
	}

	cPackDeps := map[string]bool{}
	configDependencies := map[string]string{}

	for _, namespace := range namespaces {
		//namespace, name, err := metadata.ParseKey(key)
		var packs metadata.ComponentPackCollection
		err := bundles.LoadAll(&packs, namespace, nil, session)
		if err != nil {
			return nil, err
		}
		for _, pack := range packs {
			for _, componentInfo := range pack.Components {
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
		ComponentPacks: cPackDeps,
		ConfigValues:   configDependencies,
	}

	return &dependenciesResponse, nil
}

func getConfigValueDependencyFromComponent(key string, session *sess.Session) (string, error) {
	site := session.GetSite()
	configValue, err := metadata.NewConfigValue(key)
	if err != nil {
		return "", err
	}
	err = bundles.Load(configValue, session)
	if err != nil {
		return "", err
	}
	value, err := metadata.GetConfigValue(key, site)
	if err != nil {
		return "", err
	}
	return value, nil
}

func getViewDependencies(view *metadata.View, session *sess.Session) (*ViewDependencies, error) {
	workspace := session.GetWorkspaceID()
	if workspace != "" {
		return getBuilderDependencies(session)
	}

	// Process Configuration Value Dependencies
	componentsUsed, err := view.GetComponents()
	if err != nil {
		return nil, err
	}

	packs := map[string]metadata.ComponentPackCollection{}

	cPackDeps := map[string]bool{}
	configDependencies := map[string]string{}

	for key := range componentsUsed {
		namespace, name, err := metadata.ParseKey(key)
		if err != nil {
			return nil, err
		}

		packsForNamespace, ok := packs[namespace]
		if !ok {
			var packs metadata.ComponentPackCollection
			err = bundles.LoadAll(&packs, namespace, nil, session)
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
		ComponentPacks: cPackDeps,
		ConfigValues:   configDependencies,
	}

	return &dependenciesResponse, nil
}

// ViewAPI is good
func ViewAPI(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)

	viewNamespace := vars["namespace"]
	viewName := vars["name"]

	session := middlewares.GetSession(r)

	view := metadata.View{
		Name:      viewName,
		Namespace: viewNamespace,
	}

	err := bundles.Load(&view, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.NotFound(w, r)
		return
	}

	dependencies, err := getViewDependencies(&view, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	respondYAML(w, r, &ViewResponse{
		Name:         view.Name,
		Namespace:    view.Namespace,
		Definition:   &view.Definition,
		Dependencies: dependencies,
	})
}
