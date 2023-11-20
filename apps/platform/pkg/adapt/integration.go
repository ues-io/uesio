package adapt

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewIntegrationConnection(
	integration *meta.Integration,
	integrationType *meta.IntegrationType,
	session *sess.Session,
	credentials *Credentials,
	platformConnection Connection,
) *IntegrationConnection {
	return &IntegrationConnection{
		session:         session,
		integration:     integration,
		integrationType: integrationType,
		credentials:     credentials,
		platformConn:    platformConnection,
	}
}

type IntegrationConnection struct {
	session         *sess.Session
	integration     *meta.Integration
	integrationType *meta.IntegrationType
	credentials     *Credentials
	platformConn    Connection
}

func (ic *IntegrationConnection) GetSession() *sess.Session {
	return ic.session
}

func (ic *IntegrationConnection) GetCredentials() *Credentials {
	return ic.credentials
}

func (ic *IntegrationConnection) GetIntegration() *meta.Integration {
	return ic.integration
}

func (ic *IntegrationConnection) GetIntegrationType() *meta.IntegrationType {
	return ic.integrationType
}

func (ic *IntegrationConnection) GetPlatformConnection() Connection {
	return ic.platformConn
}
