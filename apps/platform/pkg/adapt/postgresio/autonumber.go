package postgresio

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const maxAutoNumber = "SELECT COALESCE(MAX(autonumber),0) FROM public.data WHERE tenant = $1 AND collection = $2"

// GetAutonumber returns the current max autonumber for a given tenant collection.
func (c *Connection) GetAutonumber(cm *adapt.CollectionMetadata, session *sess.Session) (int, error) {
	var count int
	if err := c.GetClient().QueryRow(context.Background(), maxAutoNumber, session.GetTenantID(), cm.GetFullName()).Scan(&count); err != nil {
		return 0, errors.New("Failed to load rows in PostgreSQL:" + err.Error())
	}
	return count, nil
}
