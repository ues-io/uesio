package postgresio

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func (c *Connection) GetAutonumber(collectionMetadata *adapt.CollectionMetadata, session *sess.Session) (int, error) {

	client := c.GetClient()

	collectionName := collectionMetadata.GetFullName()
	tenantID := session.GetTenantID()

	query := "SELECT COALESCE(MAX(autonumber),0) FROM public.data WHERE tenant = $1 AND collection = $2"

	var count int
	err := client.QueryRow(context.Background(), query, tenantID, collectionName).Scan(&count)
	if err != nil {
		return 0, errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + query)
	}

	return count, nil
}
