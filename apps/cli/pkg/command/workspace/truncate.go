package workspace

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/ws"
)

func Truncate() error {

	_, err := auth.Login()
	if err != nil {
		return err
	}

	app, err := config.GetApp()
	if err != nil {
		return err
	}

	workspace, err := ws.GetWorkspace()
	if err != nil {
		return err
	}

	if workspace == "" {
		return errors.New("No active workspace is set. Use \"uesio work\" to set one.")
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	url := fmt.Sprintf("workspace/%s/%s/data/truncate", app, workspace)

	resp, err := call.Request("POST", url, nil, sessid)
	if err != nil {
		return err
	}

	fmt.Println("Truncate Success")

	defer resp.Body.Close()

	return nil
}
