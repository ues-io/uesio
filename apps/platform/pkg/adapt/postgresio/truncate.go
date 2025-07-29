package postgresio

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
)

const (
	TRUNCATE_DATA_QUERY   = "DELETE FROM public.data WHERE tenant = $1"
	TRUNCATE_TOKENS_QUERY = "DELETE FROM public.tokens WHERE tenant = $1"
)

func (c *Connection) TruncateTenantData(ctx context.Context, tenantID string) error {
	slog.Info("Truncating all data from tenant: " + tenantID)

	batch := &pgx.Batch{}

	batch.Queue(TRUNCATE_DATA_QUERY, tenantID)
	batch.Queue(TRUNCATE_TOKENS_QUERY, tenantID)

	err := c.SendBatch(ctx, batch)
	if err != nil {
		msg := fmt.Sprintf("error truncating data from tenant '%s': %s", tenantID, err.Error())
		slog.Error(msg)
		return errors.New(msg)
	}

	return nil

}
