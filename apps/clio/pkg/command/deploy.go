package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/config/ws"
	"github.com/thecloudmasters/clio/pkg/zip"
)

func Deploy() error {

	fmt.Println("Running Deploy Command")

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

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	payload := zip.ZipDir("bundle")

	url := fmt.Sprintf("workspace/%s/%s/metadata/deploy", app, workspace)

	resp, err := call.Request("POST", url, payload, sessid)
	if err != nil {
		return err
	}

	fmt.Println("Deploy Success")

	defer resp.Body.Close()

	return nil
}
