package controller

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// ViewResponse struct
type ViewResponse struct {
	Name       string
	Namespace  string
	Definition *yaml.Node `yaml:"definition"`
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

		params := map[string]string{}

		for key, value := range r.URL.Query() {
			params[key] = strings.Join(value, ",")
		}

		route := &meta.Route{
			ViewRef:  view.GetKey(),
			Params:   params,
			ThemeRef: session.GetDefaultTheme(),
		}

		ExecuteIndexTemplate(w, route, nil, buildMode, session)
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

	ExecuteIndexTemplate(w, route, nil, true, session)
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

	respondYAML(w, r, &ViewResponse{
		Name:       view.Name,
		Namespace:  view.Namespace,
		Definition: &view.Definition,
	})
}
