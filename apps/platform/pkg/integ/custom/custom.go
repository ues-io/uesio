package custom

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CustomIntegration struct {
}

func (ci *CustomIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (adapt.IntegrationConnection, error) {
	return &CustomIntegrationConnection{
		session:     session,
		integration: integration,
		credentials: credentials,
	}, nil
}

type CustomIntegrationConnection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *adapt.Credentials
}

func (c CustomIntegrationConnection) GetCredentials() *adapt.Credentials {
	return c.credentials
}

func (c CustomIntegrationConnection) GetIntegration() *meta.Integration {
	return c.integration
}

func (c CustomIntegrationConnection) RunAction(actionKey string, requestOptions interface{}) (interface{}, error) {
	// Load the integration action bundle with this action name
	integrationKey := c.integration.GetKey()
	action, err := meta.NewIntegrationAction(integrationKey, actionKey)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(action, c.session, nil)
	if err != nil {
		return nil, fmt.Errorf("could not find integration action with name %s for integration %s", actionKey, integrationKey)
	}
	// Use the action's associated BotRef, if defined, otherwise use the Integration's RunActionBot
	var botNamespace, botName string
	if action.BotRef != "" {
		botNamespace, botName, err = meta.ParseKey(action.BotRef)
		if err != nil {
			return nil, fmt.Errorf("invalid Bot name '%s' for Integration Action: %s", action.BotRef, actionKey)
		}
	} else if c.integration.RunActionBot != "" {
		botNamespace, botName, err = meta.ParseKey(c.integration.RunActionBot)
		if err != nil {
			return nil, fmt.Errorf("invalid Bot name '%s' for Integration: %s", c.integration.RunActionBot, integrationKey)
		}
	}

	// convert requestOptions into a params map
	params, isMap := requestOptions.(map[string]interface{})
	if !isMap {
		return nil, fmt.Errorf("invalid request options provided to integration action with name %s for integration %s - must be a map", actionKey, integrationKey)
	}

	outputs, err := datasource.RunIntegrationActionBot(botNamespace, botName, params, action, c, nil, c.session)
	if err != nil {
		return nil, err
	}

	return outputs, nil
}
