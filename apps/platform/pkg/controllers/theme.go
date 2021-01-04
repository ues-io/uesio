package controllers

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

//ThemeResponse struct
type ThemeResponse struct {
	ID         string                    `json:"id"`
	Name       string                    `json:"name"`
	Namespace  string                    `json:"namespace"`
	Definition *metadata.ThemeDefinition `json:"definition"`
	Workspace  string                    `json:"workspace"`
}

//ThemeAPI function
func ThemeAPI(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)

	themeNamespace := vars["namespace"]
	themeName := vars["name"]

	session := middlewares.GetSession(r)

	theme := metadata.Theme{
		Name:      themeName,
		Namespace: themeNamespace,
	}

	err := bundles.Load(&theme, session)
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
