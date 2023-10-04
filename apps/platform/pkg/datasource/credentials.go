package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetCredentials(key string, session *sess.Session) (*adapt.Credentials, error) {
	credmap := adapt.Credentials{}

	if key == "" {
		return &credmap, nil
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

	for key, entry := range credential.Entries {
		var value string
		if entry.Type == "secret" {
			value, err = GetSecretFromKey(entry.Value, session)
			if err != nil {
				return nil, err
			}
		} else if entry.Type == "configvalue" {
			value, err = configstore.GetValueFromKey(entry.Value, session)
			if err != nil {
				return nil, err
			}
		} else if entry.Type == "merge" {
			value, err = configstore.Merge(entry.Value, session)
			if err != nil {
				return nil, err
			}
		}
		credmap[key] = value
	}

	return &credmap, nil
}
