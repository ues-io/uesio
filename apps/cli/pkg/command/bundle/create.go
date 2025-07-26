package bundle

import (
	"fmt"
	"strconv"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/ws"
)

type CallBotResponse struct {
	Params  map[string]interface{} `json:"params"`
	Success bool                   `json:"success"`
	Error   string                 `json:"error,omitempty"`
}

func CreateBundle(releaseType, majorVersion, minorVersion, patchVersion, bundleDescription string) error {

	if _, err := auth.Login(); err != nil {
		return err
	}

	appName, err := config.GetApp()
	if err != nil {
		return err
	}

	token, err := config.GetToken()
	if err != nil {
		return err
	}

	workspaceName, err := ws.GetWorkspace()
	if err != nil {
		return err
	}

	createBundleURL := "site/bots/call/uesio/studio/createbundle"

	botInputs := map[string]interface{}{}
	if err = addVersionNumberToInputsIfInt(majorVersion, "major", botInputs); err != nil {
		return err
	}
	if err = addVersionNumberToInputsIfInt(minorVersion, "minor", botInputs); err != nil {
		return err
	}
	if err = addVersionNumberToInputsIfInt(patchVersion, "patch", botInputs); err != nil {
		return err
	}
	if bundleDescription != "" {
		botInputs["description"] = bundleDescription
	}
	if releaseType != "" {
		botInputs["type"] = releaseType
	}
	if appName != "" {
		botInputs["app"] = appName
	}
	if workspaceName != "" {
		botInputs["workspaceName"] = workspaceName
	}

	botResponse := &CallBotResponse{}

	err = call.PostJSON(createBundleURL, token, botInputs, botResponse, nil)
	if err != nil {
		return err
	}
	if botResponse.Success {
		major := botResponse.Params["major"]
		minor := botResponse.Params["minor"]
		patch := botResponse.Params["patch"]
		fmt.Printf("Successfully created new bundle version: %v.%v.%v\n", major, minor, patch)
	} else {
		return fmt.Errorf("unable to create new bundle version: %s", botResponse.Error)
	}

	return nil
}

func addVersionNumberToInputsIfInt(version, inputName string, botInputs map[string]interface{}) error {
	// Ignore param if not provided
	if version == "" {
		return nil
	}
	versionInt, err := strconv.Atoi(version)
	if err != nil {
		return fmt.Errorf("invalid %s version - must be an integer", inputName)
	}
	botInputs[inputName] = versionInt
	return nil
}
