package datasource

import (
	"encoding/json"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func GetIntegrationConnection(integrationID string, session *sess.Session, connection adapt.Connection) (*adapt.IntegrationConnection, error) {
	integration, err := meta.NewIntegration(integrationID)
	if err != nil {
		return nil, err
	}
	// First load the integration
	if err = bundle.Load(integration, session, connection); err != nil {
		return nil, exceptions.NewNotFoundException("could not find Integration: " + integrationID)
	}
	// Then load the integration type
	integrationTypeName := integration.GetType()
	integrationType, err := meta.NewIntegrationType(integrationTypeName)
	if err != nil {
		return nil, err
	}
	if err = bundle.Load(integrationType, session, connection); err != nil {
		return nil, fmt.Errorf("could not find Integration Type: %s", integrationTypeName)
	}

	// Enter into a version context to load credentials in the integration's namespace
	versionSession, err := EnterVersionContext(integration.Namespace, session, connection)
	if err != nil {
		return nil, err
	}
	// Credentials are optional, depending on the Integration, there may not be any
	var credentials *adapt.Credentials
	if integration.Credentials != "" {
		credentials, err = GetCredentials(integration.Credentials, versionSession)
		if err != nil {
			return nil, fmt.Errorf("could not retrieve Credentials with name %s for Integration %s", integration.Credentials, integrationID)
		}
	}

	return adapt.NewIntegrationConnection(integration, integrationType, session, credentials, connection), nil
}

// HydrateOptions takes loads arbitrary map[string]interface{} data into a struct.
// It's not the prettiest or most performant approach, but it's simple.
func HydrateOptions(optionsInput interface{}, optionsOutput interface{}) error {
	jsonBody, err := json.Marshal(optionsInput)
	if err != nil {
		return err
	}
	return json.Unmarshal(jsonBody, &optionsOutput)

}
