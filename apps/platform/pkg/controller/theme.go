package controller

import (
	"gopkg.in/yaml.v3"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

//ThemeResponse struct
type ThemeResponse struct {
	Name       string     `yaml:"name"`
	Namespace  string     `yaml:"namespace"`
	Definition *yaml.Node `yaml:"definition"`
}

//Theme function
func Theme(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)

	themeNamespace := vars["namespace"]
	themeName := vars["name"]

	session := middleware.GetSession(r)

	theme := meta.Theme{
		Name:      themeName,
		Namespace: themeNamespace,
	}

	err := bundle.Load(&theme, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.NotFound(w, r)
		return
	}

	respondYAML(w, r, &ThemeResponse{
		Name:       theme.Name,
		Namespace:  theme.Namespace,
		Definition: &theme.Definition,
	})
}
