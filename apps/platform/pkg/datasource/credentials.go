package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/credentials"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetCredentials(key string, session *sess.Session) (*wire.Credentials, error) {
	credentialsMap := wire.Credentials{}

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

func getEntryValue(entry *credentials.CredentialEntry, session *sess.Session) (string, error) {
	switch entry.Type {
	case "secret":
		return GetSecretFromKey(entry.Value, session)
	case "configvalue":
		return configstore.GetValueFromKey(entry.Value, session)
	case "merge":
		return configstore.Merge(entry.Value, session)
	}
	return entry.Value, nil
}

func addCredentialEntries(credentialsMap wire.Credentials, entriesSpec credentials.CredentialEntriesMap, session *sess.Session) error {
	for entryName, entry := range entriesSpec {
		if value, err := getEntryValue(entry, session); err != nil {
			return err
		} else {
			credentialsMap[entryName] = value
		}
	}
	return nil
}
