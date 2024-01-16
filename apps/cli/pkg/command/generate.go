package command

import (
	"bytes"
	"encoding/json"
	"errors"
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

	//fmt.Println("Running generator: " + key)

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
	if err = call.GetJSON(paramsURL, sessionId, botParams); err != nil {
		return errors.New("unable to retrieve metadata for generator '" + key + "': " + err.Error())
	}

	answers, err := param.AskMany(botParams, app, version, sessionId)
	if err != nil {
		return err
	}

	generateURL := fmt.Sprintf("version/%s/%s/metadata/generate/%s/%s", namespace, version, namespace, name)

	payloadBytes := &bytes.Buffer{}

	if err = json.NewEncoder(payloadBytes).Encode(&answers); err != nil {
		return err
	}
	if resp, err := call.Request("POST", generateURL, payloadBytes, sessionId, appContext); err != nil {
		return err
	} else {
		if err = zip.Unzip(resp.Body, "bundle"); err != nil {
			return err
		}
	}

	fmt.Println("Generator completed successfully.")

	return nil
}
