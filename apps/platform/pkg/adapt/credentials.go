package adapt

import (
	"crypto/md5"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Credentials struct
type Credentials map[string]string

// GetHash function
func (c *Credentials) GetHash() string {
	keys := []string{}
	for k, v := range *c {
		keys = append(keys, k+":"+v)
	}
	data := []byte(strings.Join(keys, ":"))
	sum := md5.Sum(data)
	return string(sum[:])
}

var tenantIDKey = "uesio.tenantid"

func (c *Credentials) SetTenantID(session *sess.Session) {
	(*c)[tenantIDKey] = session.GetTenantID()
}

func (c *Credentials) GetTenantID() string {
	return (*c)[tenantIDKey]
}

// GetCredentials function
func GetCredentials(key string, session *sess.Session) (*Credentials, error) {
	credmap := Credentials{}

	// Always add the tenant id to credentials
	credmap.SetTenantID(session)

	mergedKey, err := configstore.Merge(key, session)
	if err != nil {
		return nil, err
	}

	credential, err := meta.NewCredential(mergedKey)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(credential, session)
	if err != nil {
		return nil, err
	}

	for key, entry := range credential.Entries {
		var value string
		if entry.Type == "secret" {
			value, err = secretstore.GetSecretFromKey(entry.Value, session)
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
