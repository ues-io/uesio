package datasource

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// GetIntegration loads the requested integration from bundle store
func GetIntegration(ctx context.Context, integrationID string, session *sess.Session, connection wire.Connection) (*meta.Integration, error) {
	integrationInstance, err := meta.NewIntegration(integrationID)
	if err != nil {
		return nil, err
	}
	if err = bundle.Load(ctx, integrationInstance, nil, session, connection); err != nil {
		return nil, fmt.Errorf("unable to load integration '%s': %w", integrationID, err)
	}
	return integrationInstance, nil
}

// GetIntegrationType loads the requested integration type by name from the bundle store
func GetIntegrationType(ctx context.Context, integrationTypeName string, session *sess.Session, connection wire.Connection) (*meta.IntegrationType, error) {
	integrationType, err := meta.NewIntegrationType(integrationTypeName)
	if err != nil {
		return nil, err
	}
	if err = bundle.Load(ctx, integrationType, nil, session, connection); err != nil {
		return nil, fmt.Errorf("unable to load integration type '%s': %w", integrationTypeName, err)
	}
	return integrationType, nil
}

// GetIntegrationAction loads the requested integration action buy name from the bundle store
func GetIntegrationAction(ctx context.Context, integrationType, actionKey string, session *sess.Session, connection wire.Connection) (*meta.IntegrationAction, error) {
	actionKey = strings.ToLower(actionKey)
	action, err := meta.NewIntegrationAction(integrationType, actionKey)
	if err != nil {
		return nil, exceptions.NewNotFoundException("could not find integration action: " + actionKey)
	}
	if err = bundle.Load(ctx, action, nil, session, connection); err != nil {
		return nil, fmt.Errorf("unable to load integration action '%s': %w", actionKey, err)
	}
	return action, nil
}

func GetIntegrationConnection(ctx context.Context, integrationID string, session *sess.Session, connection wire.Connection) (*wire.IntegrationConnection, error) {
	// First load the integration
	integration, err := GetIntegration(ctx, integrationID, session, connection)
	if err != nil {
		return nil, err
	}
	// Then load the integration type
	integrationType, err := GetIntegrationType(ctx, integration.GetType(), session, connection)
	if err != nil {
		return nil, err
	}
	// Enter into a version context to load credentials in the integration's namespace
	versionSession, err := EnterVersionContext(ctx, integration.Namespace, session, connection)
	if err != nil {
		return nil, err
	}
	// Credentials are optional, depending on the Integration, there may not be any
	var credentials *wire.Credentials
	if integration.Credentials != "" {
		credentials, err = GetCredentials(ctx, integration.Credentials, versionSession)
		if err != nil {
			slog.LogAttrs(ctx,
				slog.LevelWarn,
				"Error getting Credentials",
				slog.String("error", err.Error()),
			)
			return nil, fmt.Errorf("could not retrieve Credentials with name %s for Integration %s", integration.Credentials, integrationID)
		}
	}

	return wire.NewIntegrationConnection(integration, integrationType, session, credentials, connection), nil
}

// HydrateOptions takes loads arbitrary map[string]interface{} data into a struct.
// It's not the prettiest or most performant approach, but it's simple.
func HydrateOptions(optionsInput any, optionsOutput any) error {
	jsonBody, err := json.Marshal(optionsInput)
	if err != nil {
		return err
	}
	return json.Unmarshal(jsonBody, &optionsOutput)

}
