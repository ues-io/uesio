package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

//ThemeResponse struct
type ThemeResponse struct {
	ID         string                `json:"id"`
	Name       string                `json:"name"`
	Namespace  string                `json:"namespace"`
	Definition *meta.ThemeDefinition `json:"definition"`
	Workspace  string                `json:"workspace"`
}

//ThemeAPI function
func ThemeAPI(w http.ResponseWriter, r *http.Request) {

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

	respondJSON(w, r, &ThemeResponse{
		ID:         theme.ID,
		Name:       theme.Name,
		Namespace:  theme.Namespace,
		Definition: &theme.Definition,
		Workspace:  theme.Workspace,
	})
}
