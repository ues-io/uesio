package command

import (
	"errors"
	"fmt"
	"os"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/config/ws"
	"github.com/thecloudmasters/clio/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Retrieve() error {

	fmt.Println("Running Retrieve Command")

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

	for _, metadataType := range meta.GetMetadataTypes() {
		// Go through the deployable folders and delete them.
		err := os.RemoveAll("bundle/" + metadataType)
		if err != nil {
			return errors.New("Error Reading File: " + err.Error())
		}
	}

	// Do a retrieve command and get the data.
	url := fmt.Sprintf("workspace/%s/%s/metadata/retrieve", app, workspace)

	resp, err := call.Request("GET", url, nil, sessid)
	if err != nil {
		return err
	}

	err = zip.Unzip(resp.Body, "bundle")
	if err != nil {
		return err
	}

	fmt.Println("Retrieve Success")

	return nil
}
