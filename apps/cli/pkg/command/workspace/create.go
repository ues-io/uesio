package workspace

import (
	"errors"
	"fmt"

	"github.com/AlecAivazis/survey/v2"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/wire"
)

func Create(newWorkspace string) error {

	_, err := auth.Login()
	if err != nil {
		return err
	}

	appObject, err := wire.GetApp()
	if err != nil {
		return err
	}

	if newWorkspace == "" {
		// Prompt user for name
		err = survey.AskOne(&survey.Input{
			Message: "Enter a workspace name (using a-z or 0-9 only)",
		}, &newWorkspace)

		if err != nil {
			return err
		}
	}

	// Invoke workspace creation API to create the workspace
	_, err = wire.CreateNewWorkspace(appObject.ID, newWorkspace)
	if err != nil {
		return fmt.Errorf("unable to create new workspace for app: %w", err)
	}

	// Set the current workspace as the new workspace
	if err = ws.SetWorkspace(newWorkspace); err != nil {
		return errors.New("unable to set current workspace to newly-created workspace")
	}

	fmt.Printf("Successfully created new workspace: %s\n", newWorkspace)

	return nil
}
