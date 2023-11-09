package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/credentials"
)

func GetCredentials(key string, session *sess.Session) (*adapt.Credentials, error) {
	credentialsMap := adapt.Credentials{}

	if key == "" {
		return &credentialsMap, nil
	}

	mergedKey, err := configstore.Merge(key, session)
	if err != nil {
		return nil, err
	}

	credential, err := meta.NewCredential(mergedKey)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(credential, session, nil)
	if err != nil {
		return nil, err
	}

	// Inject type-specific entries
	if container := credential.GetTypeSpecificCredentialContainer(); container != nil && !container.IsNil() {
		if err = addCredentialEntries(credentialsMap, credentials.GetEntriesMap(container), session); err != nil {
			return nil, err
		}
	}
	// Inject additional / custom credentials
	if len(credential.Entries) > 0 {
		if err = addCredentialEntries(credentialsMap, credential.Entries, session); err != nil {
			return nil, err
		}
	}

	return &credentialsMap, nil
}

func addCredentialEntries(credentialsMap adapt.Credentials, entriesSpec credentials.CredentialEntriesMap, session *sess.Session) error {
	for entryName, entry := range entriesSpec {
		var value string
		var err error
		if entry.Type == "secret" {
			value, err = GetSecretFromKey(entry.Value, session)
			if err != nil {
				return err
			}
		} else if entry.Type == "configvalue" {
			value, err = configstore.GetValueFromKey(entry.Value, session)
			if err != nil {
				return err
			}
		} else if entry.Type == "merge" {
			value, err = configstore.Merge(entry.Value, session)
			if err != nil {
				return err
			}
		}
		credentialsMap[entryName] = value
	}
	return nil
}
