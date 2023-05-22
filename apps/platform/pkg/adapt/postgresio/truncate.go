package postgresio

import (
	"context"
	"fmt"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v4"
)

const TRUNCATE_QUERY = "DELETE FROM public.data WHERE tenant = $1"

func (c *Connection) Truncate(tenantID string) error {
	fmt.Println("Truncate data from tenant: " + tenantID)

	db := c.GetClient()
	batch := &pgx.Batch{}

	batch.Queue(TRUNCATE_QUERY, tenantID)

	results := db.SendBatch(context.Background(), batch)
	execCount := batch.Len()
	for i := 0; i < execCount; i++ {
		_, err := results.Exec()
		if err != nil {
			fmt.Println("Error truncating data from tenant: " + tenantID)
			results.Close()
			return err
		}
	}
	results.Close()

	return nil

}
