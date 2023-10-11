package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type IntegrationType interface {
	GetIntegrationConnection(*meta.Integration, *sess.Session, *Credentials) (IntegrationConnection, error)
}

type IntegrationConnection interface {
	RunAction(actionName string, requestOptions interface{}) (interface{}, error)
	GetCredentials() *Credentials
	GetIntegration() *meta.Integration
}

var integrationTypeMap = map[string]IntegrationType{}

func GetIntegrationType(integrationTypeName string) (IntegrationType, error) {
	integrationType, ok := integrationTypeMap[integrationTypeName]
	if !ok {
		return nil, errors.New("Invalid integration type name: " + integrationTypeName)
	}
	return integrationType, nil
}

func RegisterIntegration(name string, integrationType IntegrationType) {
	integrationTypeMap[name] = integrationType
}
