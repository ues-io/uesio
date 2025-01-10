package workspace

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/context"
	"github.com/thecloudmasters/cli/pkg/zip"
)

func Deploy() error {

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

	payload := zip.ZipDir("bundle")

	url := fmt.Sprintf("workspace/%s/%s/metadata/deploy", app, workspace)

	resp, err := call.Post(url, payload, sessid, context.NewWorkspaceContext(app, workspace))
	if err != nil {
		return err
	}

	fmt.Println("Deploy Success")

	defer resp.Body.Close()

	return nil
}
