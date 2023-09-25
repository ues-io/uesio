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

func (c CustomIntegrationConnection) RunAction(actionName string, requestOptions interface{}) (interface{}, error) {
	// Load the integration action bundle with this action name
	action, err := meta.NewIntegrationAction(c.integration.GetKey(), actionName)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(action, c.session, nil)
	if err != nil {
		return nil, fmt.Errorf("could not find integration action with name %s for integration %s", actionName, c.integration.GetKey())
	}
	// Load the bundle's associated bot
	botNamespace, botName, err := meta.ParseKey(action.BotRef)
	if err != nil {
		return nil, fmt.Errorf("invalid bot name for integration action %s", actionName)
	}
	
	// convert requestOptions into a params map
	params := make(map[string]interface{})

	outputs, err := datasource.CallListenerBot(botNamespace, botName, params, nil, c.session)
	if err != nil {
		return nil, err
	}

	return outputs, nil
}
