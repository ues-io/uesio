package postgresio

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

const maxAutoNumber = "SELECT COALESCE(MAX(autonumber),0) FROM public.data WHERE tenant = $1 AND collection = $2"

// GetAutonumber returns the current max autonumber for a given tenant collection.
func (c *Connection) GetAutonumber(cm *wire.CollectionMetadata, session *sess.Session) (int, error) {
	var count int
	c.mux.Lock()
	defer c.mux.Unlock()
	if err := c.GetClient().QueryRow(c.ctx, maxAutoNumber, session.GetTenantID(), cm.GetFullName()).Scan(&count); err != nil {
		return 0, TranslatePGError(err)
	}
	return count, nil
}
