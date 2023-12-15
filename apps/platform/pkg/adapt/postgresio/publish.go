package postgresio

import (
	"errors"
)

// Publish sends a message on a given channel
func (c *Connection) Publish(channelName, payload string) error {
	db := c.GetClient()
	if _, err := db.Exec(c.ctx, "select pg_notify($1, $2)", channelName, payload); err != nil {
		return errors.New("unable to publish message: " + err.Error())
	}
	return nil
}
