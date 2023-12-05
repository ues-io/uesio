package datasource

import (
	"encoding/json"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// GetIntegration loads the requested integration from bundle store
func GetIntegration(integrationID string, session *sess.Session, connection wire.Connection) (*meta.Integration, error) {
	integration, err := meta.NewIntegration(integrationID)
	if err != nil {
		return nil, err
	}
	if err = bundle.Load(integration, session, connection); err != nil {
		return nil, exceptions.NewNotFoundException("could not find Integration: " + integrationID)
	}
	return integration, nil
}

// GetIntegrationType loads the requested integration type by name from the bundle store
func GetIntegrationType(integrationTypeName string, session *sess.Session, connection wire.Connection) (*meta.IntegrationType, error) {
	integrationType, err := meta.NewIntegrationType(integrationTypeName)
	if err != nil {
		return nil, err
	}
	if err = bundle.Load(integrationType, session, connection); err != nil {
		return nil, fmt.Errorf("could not find Integration Type: %s", integrationTypeName)
	}
	return integrationType, nil
}

func GetIntegrationConnection(integrationID string, session *sess.Session, connection wire.Connection) (*wire.IntegrationConnection, error) {
	// First load the integration
	integration, err := GetIntegration(integrationID, session, connection)
	if err != nil {
		return nil, err
	}
	// Then load the integration type
	integrationType, err := GetIntegrationType(integration.GetType(), session, connection)
	if err != nil {
		return nil, err
	}
	// Enter into a version context to load credentials in the integration's namespace
	versionSession, err := EnterVersionContext(integration.Namespace, session, connection)
	if err != nil {
		return nil, err
	}
	// Credentials are optional, depending on the Integration, there may not be any
	var credentials *wire.Credentials
	if integration.Credentials != "" {
		credentials, err = GetCredentials(integration.Credentials, versionSession)
		if err != nil {
			return nil, fmt.Errorf("could not retrieve Credentials with name %s for Integration %s", integration.Credentials, integrationID)
		}
	}

	return wire.NewIntegrationConnection(integration, integrationType, session, credentials, connection), nil
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
