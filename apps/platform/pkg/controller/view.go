package controller

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/humandad/yaml"
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

		depsCache, err := routing.GetMetadataDeps(route, session)
		if err != nil {
			HandleMissingRoute(w, r, session, "", err)
			return
		}

		if buildMode {

			pack := &meta.ComponentPack{
				Name:      "main",
				Namespace: "uesio/io",
			}

			err = bundle.Load(pack, session)
			if err != nil {
				HandleMissingRoute(w, r, session, "", err)
				return
			}

			err := depsCache.AddItem(pack, false)
			if err != nil {
				HandleMissingRoute(w, r, session, "", err)
				return
			}

		}

		ExecuteIndexTemplate(w, route, depsCache, buildMode, session)
	}
}
