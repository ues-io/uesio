package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
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

	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

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
		err = datasource.LoadWorkspaceMetadataItem(&existingView, site, sess)
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
	}, site, sess)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	saveResponse := &ViewSaveResponse{
		Success: true,
	}

	err = json.NewEncoder(w).Encode(saveResponse)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// ViewPreview is also good
func ViewPreview(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		viewNamespace := vars["namespace"]
		viewName := vars["name"]

		s := middlewares.GetSession(r)
		sess := s.GetBrowserSession()
		site := s.GetSite()

		view := metadata.View{
			Name:      viewName,
			Namespace: viewNamespace,
		}

		// Make sure this is a legit view that we have access to
		err := datasource.LoadMetadataItem(&view, site, sess)
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

		ExecuteIndexTemplate(w, route, buildMode, site, sess)
	}
}

// ViewEdit is also good
func ViewEdit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	viewNamespace := vars["namespace"]
	viewName := vars["name"]

	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

	view := metadata.View{
		Name:      viewName,
		Namespace: viewNamespace,
	}

	// Make sure this is a legit view that we have access to
	err := datasource.LoadMetadataItem(&view, site, sess)
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

	ExecuteIndexTemplate(w, route, true, site, sess)
}

// ViewAPI is good
func ViewAPI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/yaml")

	vars := mux.Vars(r)

	viewNamespace := vars["namespace"]
	viewName := vars["name"]

	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

	view := metadata.View{
		Name:      viewName,
		Namespace: viewNamespace,
	}

	err := datasource.LoadMetadataItem(&view, site, sess)
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

	viewResponse := &ViewResponse{
		Name:         view.Name,
		Namespace:    view.Namespace,
		Definition:   &view.Definition,
		Dependencies: dependenciesResponse,
	}

	err = yaml.NewEncoder(w).Encode(viewResponse)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
