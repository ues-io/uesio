package datasource

import (
	"encoding/json"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetIntegration(integrationID string, session *sess.Session) (adapt.IntegrationConnection, error) {
	integration, err := meta.NewIntegration(integrationID)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(integration, session, nil)
	if err != nil {
		return nil, fmt.Errorf("could not find Integration with name: %s", integrationID)
	}

	integrationType, err := adapt.GetIntegrationType(integration.Type)
	if err != nil {
		return nil, fmt.Errorf("invalid Integration type %s for Integration %s", integration.Type, integrationID)
	}

	// Enter into a version context to load credentials in the integration's namespace
	versionSession, err := EnterVersionContext(integration.Namespace, session, nil)
	if err != nil {
		return nil, err
	}
	// Credentials are optional, depending on the Integration, there may not be any
	var credentials *adapt.Credentials
	if integration.Credentials != "" {
		credentials, err = creds.GetCredentials(integration.Credentials, versionSession)
		if err != nil {
			return nil, fmt.Errorf("could not find Credentials with name %s for Integration %s", integration.Credentials, integrationID)
		}
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
