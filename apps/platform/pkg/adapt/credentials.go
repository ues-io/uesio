package adapt

import (
	"crypto/md5"
	"sort"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type Credentials map[string]string

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
	(*c)[siteTenantIDKey] = session.GetSiteTenantID()
}

func (c *Credentials) GetTenantID() string {
	return (*c)[tenantIDKey]
}

func (c *Credentials) GetTenantIDForCollection(collectionKey string) string {
	// If we're loading uesio/core.user from a workspace, always use the site
	// tenant id, not the workspace tenant id. Since workspaces don't have users.
	if collectionKey == "uesio/core.user" {
		return c.GetSiteTenantID()
	}
	return c.GetTenantID()
}

func (c *Credentials) GetSiteTenantID() string {
	return (*c)[siteTenantIDKey]
}
