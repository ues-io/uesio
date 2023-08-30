package postgresio

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const TOKEN_QUERY = "SELECT token FROM public.tokens WHERE recordid = $1 AND tenant = $2"

func (c *Connection) GetRecordAccessTokens(recordID string, session *sess.Session) ([]string, error) {
	rows, err := c.GetClient().Query(context.Background(), TOKEN_QUERY, recordID, session.GetTenantID())
	if err != nil {
		return nil, errors.New("Failed to load tokens:" + err.Error())
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (string, error) {
		var token string
		err := row.Scan(&token)
		return token, err
	})
}
