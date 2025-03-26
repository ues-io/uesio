package workspace

import (
	"errors"
	"fmt"

	"github.com/AlecAivazis/survey/v2"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/wire"
)

func Delete(workspaceName string) error {

	_, err := auth.Login()
	if err != nil {
		return err
	}

	appObject, err := wire.GetApp()
	if err != nil {
		return err
	}

	if workspaceName == "" {
		// Prompt user for name
		if err = survey.AskOne(&survey.Input{
			Message: "Enter the name of the workspace to delete",
		}, &workspaceName); err != nil {
			return err
		}
	}

	// Delete the workspace
	err = wire.DeleteWorkspace(appObject.FullName, workspaceName)
	if err != nil {
		return fmt.Errorf("unable to delete workspace %s: %w", workspaceName, err)
	}
	fmt.Printf("Successfully deleted workspace %s\n", workspaceName)

	if err = ws.ClearWorkspace(); err != nil {
		return errors.New("unable to clear workspace context")
	}

	return nil
}
