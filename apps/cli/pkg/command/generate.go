package command

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/context"
	"github.com/thecloudmasters/cli/pkg/param"
	"github.com/thecloudmasters/cli/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Generate(key string) error {

	fmt.Println("Running generator: " + key)

	namespace, name, err := meta.ParseKeyWithDefault(key, "uesio/core")
	if err != nil {
		return err
	}

	_, err = auth.Login()
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

	appContext := context.NewWorkspaceContext(app, workspace)

	version, err := config.GetVersion(namespace)
	if err != nil {
		return err
	}

	sessionId, err := config.GetSessionID()
	if err != nil {
		return err
	}

	paramsURL := fmt.Sprintf("version/%s/%s/bots/params/generator/%s/%s", namespace, version, namespace, name)

	botParams := &meta.BotParamsResponse{}
	err = call.GetJSON(paramsURL, sessionId, botParams)
	if err != nil {
		return err
	}

	answers, err := param.AskMany(botParams, app, version, sessionId)
	if err != nil {
		return err
	}

	generateURL := fmt.Sprintf("version/%s/%s/metadata/generate/%s/%s", namespace, version, namespace, name)

	payloadBytes := &bytes.Buffer{}

	err = json.NewEncoder(payloadBytes).Encode(&answers)
	if err != nil {
		return err
	}
	resp, err := call.Request("POST", generateURL, payloadBytes, sessionId, appContext)
	if err != nil {
		return err
	}

	err = zip.Unzip(resp.Body, "bundle")
	if err != nil {
		return err
	}

	fmt.Println("Generator completed successfully.")

	return nil
}
