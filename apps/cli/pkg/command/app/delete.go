package app

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/wire"
)

func Delete(appFullName string) error {

	_, err := auth.Login()
	if err != nil {
		return err
	}

	sessionId, err := config.GetSessionID()
	if err != nil {
		return err
	}

	if appFullName == "" {
		app, err := askUserToSelectApp(sessionId)
		if err != nil {
			return err
		}
		appFullName = app.FullName
	}
	// Delete the app
	err = wire.DeleteApp(appFullName)
	if err != nil {
		return fmt.Errorf("unable to delete app %s: %w", appFullName, err)
	}

	fmt.Printf("Successfully deleted app %s\n", appFullName)

	return nil
}
