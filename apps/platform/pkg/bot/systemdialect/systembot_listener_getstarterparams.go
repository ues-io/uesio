package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runGetStarterParamsBot(params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	starterTemplate, ok := params["template"]
	if !ok {
		return nil, errors.New("Invalid starter template")
	}
	starterTemplateString, ok := starterTemplate.(string)
	if !ok {
		return nil, errors.New("Invalid starter template")
	}
	starterTemplateParts := strings.Split(starterTemplateString, ":")
	if len(starterTemplateParts) != 2 {
		return nil, errors.New("Invalid starter template: " + starterTemplateString)
	}
	starterApp := starterTemplateParts[0]

	// We should really not use the studio session to enter the version context here.
	// This requires that studio have the starter template app installed. (This shouldn't be necessary)
	versionSession, err := datasource.EnterVersionContext(starterApp, session, connection)
	if err != nil {
		return nil, err
	}
	generatorBotName := versionSession.GetContextAppBundle().StarterBot

	generatorNamespace, generatorName, err := meta.ParseKey(generatorBotName)
	if err != nil {
		return nil, err
	}

	botParams, err := bot.GetBotParams(generatorNamespace, generatorName, "GENERATOR", versionSession)
	if err != nil {
		return nil, err
	}

	// Figure out the right bot to use.
	return map[string]any{
		"params": botParams,
	}, nil
}
