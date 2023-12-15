package postgresio

import (
	"errors"
	"fmt"
	"log/slog"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5"
)

const (
	TRUNCATE_DATA_QUERY   = "DELETE FROM public.data WHERE tenant = $1"
	TRUNCATE_TOKENS_QUERY = "DELETE FROM public.tokens WHERE tenant = $1"
)

func (c *Connection) TruncateTenantData(tenantID string) error {
	slog.Info("Truncating all data from tenant: " + tenantID)

	db := c.GetClient()
	batch := &pgx.Batch{}

	batch.Queue(TRUNCATE_DATA_QUERY, tenantID)
	batch.Queue(TRUNCATE_TOKENS_QUERY, tenantID)

	results := db.SendBatch(c.ctx, batch)
	execCount := batch.Len()
	for i := 0; i < execCount; i++ {
		_, err := results.Exec()
		if err != nil {
			results.Close()
			msg := fmt.Sprintf("error truncating data from tenant '%s': %s", tenantID, err.Error())
			slog.Error(msg)
			return errors.New(msg)
		}
	}
	results.Close()

	return nil

}
