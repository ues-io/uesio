package integ

import (
	"encoding/json"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type IntegrationType interface {
	GetIntegrationConnection(*meta.Integration, *sess.Session, *adapt.Credentials) (IntegrationConnection, error)
}

type IntegrationConnection interface {
	RunAction(actionName string, requestOptions interface{}) error
}

var integrationTypeMap = map[string]IntegrationType{}

func GetIntegrationType(integrationTypeName string) (IntegrationType, error) {
	integrationType, ok := integrationTypeMap[integrationTypeName]
	if !ok {
		return nil, errors.New("Invalid integration type name: " + integrationTypeName)
	}
	return integrationType, nil
}

func RegisterConfigStore(name string, integrationType IntegrationType) {
	integrationTypeMap[name] = integrationType
}

func GetIntegration(integrationID string, session *sess.Session) (IntegrationConnection, error) {
	integration, err := meta.NewIntegration(integrationID)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(integration, session, nil)
	if err != nil {
		return nil, err
	}

	integrationType, err := GetIntegrationType(integration.Type)
	if err != nil {
		return nil, err
	}
	credentials, err := creds.GetCredentials(integration.Credentials, session)
	if err != nil {
		return nil, err
	}

	return integrationType.GetIntegrationConnection(integration, session, credentials)
}

func HydrateOptions(optionsInput interface{}, optionsOutput interface{}) error {

	// This isn't the prettiest thing in the world, but it works for getting
	// Arbitrary map[string]interface{} data into a struct.
	jsonbody, err := json.Marshal(optionsInput)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonbody, &optionsOutput)

}
