package integ

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type IntegrationType interface {
	Exec(options *IntegrationOptions, requestData, responseData interface{}, integration *meta.Integration, session *sess.Session) error
}

type IntegrationOptions struct {
	URL   string
	Verb  string
	Cache bool
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

func Exec(options *IntegrationOptions, requestData, responseData interface{}, integration *meta.Integration, session *sess.Session) error {
	integrationType, err := GetIntegrationType(integration.Type)
	if err != nil {
		return err
	}
	return integrationType.Exec(options, requestData, responseData, integration, session)
}

func ExecByKey(options *IntegrationOptions, requestData, responseData interface{}, key string, session *sess.Session) error {
	integration, err := meta.NewIntegration(key)
	if err != nil {
		return err
	}
	err = bundle.Load(integration, nil, session) //TO-DO
	if err != nil {
		return err
	}
	return Exec(options, requestData, responseData, integration, session)
}
