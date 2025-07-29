package controller

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

type ViewResponse struct {
	Name       string
	Namespace  string
	Definition *yaml.Node `yaml:"definition"`
}

func ViewPreview(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		viewNamespace := vars["namespace"]
		viewName := vars["name"]

		session := middleware.GetSession(r)

		view := meta.NewBaseView(viewNamespace, viewName)

		// Make sure this is a legit view that we have access to
		err := bundle.Load(session.Context(), view, nil, session, nil)
		if err != nil {
			HandleErrorRoute(w, r, session, "", "", err, false)
			return
		}

		params := map[string]any{}

		for key, value := range r.URL.Query() {
			params[key] = strings.Join(value, ",")
		}

		route := &meta.Route{
			ViewRef: view.GetKey(),
			Params:  params,
			Title:   "Preview: " + view.Name,
		}

		depsCache, err := routing.GetMetadataDeps(route, session)
		if err != nil {
			HandleErrorRoute(w, r, session, "", "", err, false)
			return
		}

		if buildMode {
			err = routing.GetBuilderDependencies(viewNamespace, viewName, depsCache, session)
			if err != nil {
				HandleErrorRoute(w, r, session, "", "", err, false)
				return
			}
			route.Title = "Edit: " + view.Name
		}

		ExecuteIndexTemplate(w, route, depsCache, buildMode, session)
	}
}
