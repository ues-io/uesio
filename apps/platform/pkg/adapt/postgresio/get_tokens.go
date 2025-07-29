package postgresio

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

const TOKEN_QUERY = "SELECT token FROM public.tokens WHERE recordid = $1 AND tenant = $2"

func (c *Connection) GetRecordAccessTokens(ctx context.Context, recordID string, session *sess.Session) ([]string, error) {
	c.mux.Lock()
	defer c.mux.Unlock()
	rows, err := c.GetClient().Query(ctx, TOKEN_QUERY, recordID, session.GetTenantID())
	if err != nil {
		return nil, fmt.Errorf("failed to load tokens: %w", err)
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (string, error) {
		var token string
		err := row.Scan(&token)
		return token, err
	})
}
