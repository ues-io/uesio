package adapt

import (
	"crypto/md5"
	"sort"
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
	keys := make([]string, len(*c))
	i := 0
	for k, v := range *c {
		keys[i] = k + ":" + v
		i++
	}
	sort.Strings(keys)
	data := []byte(strings.Join(keys, ":"))
	sum := md5.Sum(data)
	return string(sum[:])
}

var tenantIDKey = "uesio.tenantid"
var siteTenantIDKey = "uesio.sitetenantid"

func (c *Credentials) SetTenantID(session *sess.Session) {
	(*c)[tenantIDKey] = session.GetTenantID()
}

func (c *Credentials) GetTenantID() string {
	return (*c)[tenantIDKey]
}

func (c *Credentials) GetTenantIDForCollection(collectionKey string) string {
	// If we're loading uesio/uesio.user from a workspace, always use the site
	// tenant id, not the workspace tenant id. Since workspaces don't have users.
	if collectionKey == "uesio/uesio.user" {
		return c.GetSiteTenantID()
	}
	return c.GetTenantID()
}

func (c *Credentials) SetSiteTenantID(session *sess.Session) {
	(*c)[siteTenantIDKey] = session.GetSiteTenantID()
}

func (c *Credentials) GetSiteTenantID() string {
	return (*c)[siteTenantIDKey]
}

// GetCredentials function
func GetCredentials(key string, session *sess.Session) (*Credentials, error) {
	credmap := Credentials{}

	// Always add the tenant id to credentials
	credmap.SetTenantID(session)
	credmap.SetSiteTenantID(session)

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
