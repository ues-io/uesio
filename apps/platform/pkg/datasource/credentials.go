package datasource

import (
	"context"
	"log/slog"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/credentials"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetCredentials(ctx context.Context, key string, session *sess.Session) (*wire.Credentials, error) {
	credentialsMap := wire.Credentials{}

	if key == "" {
		return &credentialsMap, nil
	}

	mergedKey, err := configstore.Merge(ctx, key, session)
	if err != nil {
		return nil, err
	}

	credential, err := meta.NewCredential(mergedKey)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(ctx, credential, nil, session, nil)
	if err != nil {
		return nil, err
	}

	// Inject type-specific entries
	if container := credential.GetTypeSpecificCredentialContainer(); container != nil && !container.IsNil() {
		if err = addCredentialEntries(ctx, credentialsMap, credentials.GetEntriesMap(container), session); err != nil {
			return nil, err
		}
	}
	// Inject additional / custom credentials
	if len(credential.Entries) > 0 {
		if err = addCredentialEntries(ctx, credentialsMap, credential.Entries, session); err != nil {
			return nil, err
		}
	}

	return &credentialsMap, nil
}

func getEntryValue(ctx context.Context, entry *credentials.CredentialEntry, session *sess.Session) (string, error) {
	switch entry.Type {
	case "secret":
		return secretstore.GetSecret(ctx, entry.Value, session)
	case "configvalue":
		return configstore.GetValue(ctx, entry.Value, session)
	case "merge":
		return configstore.Merge(ctx, entry.Value, session)
	}
	return entry.Value, nil
}

func addCredentialEntries(ctx context.Context, credentialsMap wire.Credentials, entriesSpec credentials.CredentialEntriesMap, session *sess.Session) error {
	for entryName, entry := range entriesSpec {
		if value, err := getEntryValue(ctx, entry, session); err != nil {
			// If the error is that the value was not found, just don't add an entry to the map,
			// but record a warning log
			if exceptions.IsNotFoundException(err) {
				slog.WarnContext(ctx, "credential entry not found: "+entry.Name)
				continue
			} else {
				return err
			}
		} else {
			credentialsMap[entryName] = value
		}
	}
	return nil
}
