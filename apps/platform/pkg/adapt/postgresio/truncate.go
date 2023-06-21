package postgresio

import (
	"context"
	"fmt"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5"
	"github.com/thecloudmasters/uesio/pkg/logger"
)

const TRUNCATE_QUERY = "DELETE FROM public.data WHERE tenant = $1"

func (c *Connection) TruncateTenantData(tenantID string) error {
	logger.Log("Truncating all data from tenant: "+tenantID, logger.INFO)

	db := c.GetClient()
	batch := &pgx.Batch{}

	batch.Queue(TRUNCATE_QUERY, tenantID)

	results := db.SendBatch(context.Background(), batch)
	execCount := batch.Len()
	for i := 0; i < execCount; i++ {
		_, err := results.Exec()
		if err != nil {
			results.Close()
			return fmt.Errorf("Error truncating data from tenant '%s': %s", tenantID, err.Error())
		}
	}
	results.Close()

	return nil

}
