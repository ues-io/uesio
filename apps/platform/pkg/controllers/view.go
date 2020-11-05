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
	"gopkg.in/yaml.v3"
)

// ViewResponse struct
type ViewResponse struct {
	Name         string
	Namespace    string
	Definition   *yaml.Node                    `yaml:"definition"`
	Dependencies map[string]DependencyResponse `yaml:"dependencies"`
}

// ViewSaveResponse struct
type ViewSaveResponse struct {
	Success bool
}

// SaveViewRequest type
type SaveViewRequest map[string]string

// DependencyResponse struct
type DependencyResponse map[string]interface{}

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
			Name:         viewName,
			Workspace:    existingView.Workspace,
			Definition:   defNode,
			Dependencies: existingView.Dependencies,
			ID:           existingView.ID,
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
			// TODO: This is special. NOTHING SPECIAL!
			logger.LogErrorWithTrace(r, err)
			RedirectToLogin(w, r)
			return
		}

		route := &metadata.Route{
			ViewRef: view.GetKey(),
			Params:  map[string]string{},
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
		// TODO: This is special. NOTHING SPECIAL!
		logger.LogErrorWithTrace(r, err)
		RedirectToLogin(w, r)
		return
	}

	route := &metadata.Route{
		ViewRef: view.GetKey(),
		Params:  map[string]string{},
	}

	ExecuteIndexTemplate(w, route, true, session)
}

// ViewAPI is good
func ViewAPI(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)

	viewNamespace := vars["namespace"]
	viewName := vars["name"]

	session := middlewares.GetSession(r)
	site := session.GetSite()

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

	// Process Dependencies and add values
	var dependenciesMap map[string]metadata.Dependency
	err = view.Dependencies.Decode(&dependenciesMap)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	dependenciesResponse := map[string]DependencyResponse{}

	// Process Configuration Value Dependencies
	configValuesKey := "configvalues"
	cvd, ok := dependenciesMap[configValuesKey]
	if ok {
		configDependencies := map[string]interface{}{}

		for key := range cvd {
			configValue, err := metadata.GetConfigValue(key, site)
			if err != nil {
				logger.LogErrorWithTrace(r, err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			configDependencies[key] = configValue
		}
		dependenciesResponse[configValuesKey] = configDependencies
	}

	// Process ComponentPack Dependencies
	componentPacksKey := "componentpacks"
	csd, ok := dependenciesMap[componentPacksKey]
	if ok {
		cpDependencies := map[string]interface{}{}

		for key := range csd {
			cpDependencies[key] = true
		}
		dependenciesResponse[componentPacksKey] = cpDependencies
	}

	respondYAML(w, r, &ViewResponse{
		Name:         view.Name,
		Namespace:    view.Namespace,
		Definition:   &view.Definition,
		Dependencies: dependenciesResponse,
	})
}
