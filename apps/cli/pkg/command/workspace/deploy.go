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
		return errors.New("no active workspace is set -- use \"uesio work\" to set one")
	}

	token, err := config.GetToken()
	if err != nil {
		return err
	}

	payload := zip.ZipDir("bundle")

	url := fmt.Sprintf("workspace/%s/%s/metadata/deploy", app, workspace)

	resp, err := call.Post(url, payload, token, context.NewWorkspaceContext(app, workspace))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	fmt.Println("Deploy Success")

	return nil
}
