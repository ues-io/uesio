package controllers

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"gopkg.in/yaml.v3"
)

//ThemeResponse struct
type ThemeResponse struct {
	ID         string           `json:"id"`
	Name       string           `json:"name"`
	Namespace  string           `json:"namespace"`
	Definition *ThemeDefinition `json:"definition"`
	Workspace  string           `json:"workspace"`
}

//ThemeDefinition struct
type ThemeDefinition struct {
	Error     string `json:"error"`
	Info      string `json:"info"`
	Primary   string `json:"primary"`
	Secondary string `json:"secondary"`
	Success   string `json:"success"`
	Warning   string `json:"warning"`
}

// GetThemeDefinitionData function
func GetThemeDefinitionData(definition *yaml.Node) *ThemeDefinition {

	td := &ThemeDefinition{}
	err := definition.Decode(td)

	if err != nil {
		fmt.Printf("Error parsing YAML file: %s\n", err)
	}

	return td
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
		Definition: GetThemeDefinitionData(&theme.Definition),
		Workspace:  theme.Workspace,
	})
}
