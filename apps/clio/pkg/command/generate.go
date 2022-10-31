package command

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/param"
	"github.com/thecloudmasters/clio/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Generate(key string) error {

	fmt.Println("Running Generator Command")

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

	version, err := config.GetVersion(namespace)
	if err != nil {
		return err
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	paramsURL := fmt.Sprintf("version/%s/%s/%s/bots/params/generator/%s", app, namespace, version, name)

	botParams := &meta.BotParamsResponse{}
	err = call.GetJSON(paramsURL, sessid, botParams)
	if err != nil {
		return err
	}

	answers, err := param.AskMany(botParams, app, version, sessid)
	if err != nil {
		return err
	}

	generateURL := fmt.Sprintf("version/%s/%s/%s/metadata/generate/%s", app, namespace, version, name)

	payloadBytes := &bytes.Buffer{}

	err = json.NewEncoder(payloadBytes).Encode(&answers)
	if err != nil {
		return err
	}
	resp, err := call.Request("POST", generateURL, payloadBytes, sessid)
	if err != nil {
		return err
	}

	err = zip.Unzip(resp.Body, "bundle")
	if err != nil {
		return err
	}

	fmt.Println("Generate Success")

	return nil
}
