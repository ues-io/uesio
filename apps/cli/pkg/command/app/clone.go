package app

import (
	"errors"
	"fmt"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"sort"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/command/workspace"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/goutils"
	"github.com/thecloudmasters/cli/pkg/wire"
)

// Queries for all apps accessible to the user, prompts the user to select one,
// and then returns the app object
func askUserToSelectApp(sessid string) (*wire.App, error) {

	appsResult, err := wire.GetApps()
	if err != nil {
		return nil, err
	}

	if len(appsResult) == 0 {
		return nil, errors.New("no apps found")
	}

	appNames := goutils.MapKeys(appsResult)
	sort.Strings(appNames)

	if len(appsResult) == 1 {
		// There's only one, so just pick it
		return appsResult[appNames[0]], nil
	}

	var answer string
	err = survey.AskOne(&survey.Select{
		Message: "Select an app to clone",
		Options: appNames,
	}, &answer)
	if err != nil {
		return nil, err
	}

	return appsResult[answer], nil
}

func AppClone() error {

	// TODO: Only log this in verbose mode, and use a logging api
	fmt.Println("Running app:clone command")

	user, err := auth.Login()
	if err != nil {
		return err
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	app, err := askUserToSelectApp(sessid)
	if err != nil {
		return err
	}

	config.SetConfigValue("app", app.ID)

	// Prompt user to select a workspace (TODO: or bundle version) to clone from
	// if there are no workspaces, create one first
	workspaceName, err := ws.SetWorkspacePrompt(user.Username, app.ID)

	if err != nil {
		return err
	}

	err = workspace.RetrieveBundleForAppWorkspace(app.FullName, workspaceName)
	if err != nil {
		return err
	}

	fmt.Printf("Successfully cloned app: %s using workspace %s \n", app.FullName, workspaceName)

	return nil
}
