package custom

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CustomIntegration struct {
}

func (ci *CustomIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (integ.IntegrationConnection, error) {
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
	return nil, errors.New("no actions implemented")
}
