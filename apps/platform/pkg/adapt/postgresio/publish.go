package postgresio

import "fmt"

// Publish sends a message on a given channel
func (c *Connection) Publish(channelName, payload string) error {
	c.mux.Lock()
	defer c.mux.Unlock()
	db := c.GetClient()
	if _, err := db.Exec(c.ctx, "select pg_notify($1, $2)", channelName, payload); err != nil {
		return fmt.Errorf("unable to publish message: %w", err)
	}
	return nil
}
