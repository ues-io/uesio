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

	_, err := auth.Login()
	if err != nil {
		return err
	}

	appName, err := config.GetApp()
	if err != nil {
		return err
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	workspaceName, err := ws.GetWorkspace()
	if err != nil {
		return err
	}

	createBundleURL := fmt.Sprintf("workspace/%s/%s/bots/call/uesio/studio/createbundle", appName, workspaceName)

	botInputs := map[string]interface{}{}
	err = addVersionNumberToInputsIfInt(majorVersion, "major", botInputs)
	if err != nil {
		return err
	}
	err = addVersionNumberToInputsIfInt(minorVersion, "minor", botInputs)
	if err != nil {
		return err
	}
	err = addVersionNumberToInputsIfInt(patchVersion, "patch", botInputs)
	if err != nil {
		return err
	}
	if bundleDescription != "" {
		botInputs["description"] = bundleDescription
	}
	if releaseType != "" {
		botInputs["type"] = releaseType
	}

	botResponse := &CallBotResponse{}

	err = call.PostJSON(createBundleURL, sessid, botInputs, botResponse)
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
