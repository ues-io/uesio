package postgresio

import (
	"context"
	"fmt"
)

// Subscribe establishes a subscription on a channel,
// and will invoke a function whenever a message is received on the channel
func (c *Connection) Subscribe(ctx context.Context, channelName string, handler func(ctx context.Context, payload string)) error {
	conn, err := c.GetPGConn(ctx)
	if err != nil {
		return fmt.Errorf("unable to acquire PG connection for subscription: %s", err.Error())
	}
	defer conn.Release()

	_, err = conn.Exec(ctx, "listen "+channelName)
	if err != nil {
		return fmt.Errorf("unable to subscribe to channel %s : %s", channelName, err.Error())
	}

	for {
		notification, waitErr := conn.Conn().WaitForNotification(ctx)
		if waitErr != nil {
			return waitErr
		}
		handler(ctx, notification.Payload)
	}
}
