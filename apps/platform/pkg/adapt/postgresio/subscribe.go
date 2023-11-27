package postgresio

import (
	"context"
	"fmt"
)

// Subscribe establishes a subscription on a channel,
// and will invoke a function whenever a message is received on the channel
func (c *Connection) Subscribe(channelName string, handler func(payload string)) error {
	conn, err := c.GetPGConn(context.Background())
	if err != nil {
		return fmt.Errorf("unable to acquire PG connection for subscription: %s", err.Error())
	}
	defer conn.Release()

	_, err = conn.Exec(context.Background(), "listen "+channelName)
	if err != nil {
		return fmt.Errorf("unable to subscribe to channel %s : %s", channelName, err.Error())
	}

	for {
		notification, waitErr := conn.Conn().WaitForNotification(context.Background())
		if waitErr != nil {
			return waitErr
		}
		handler(notification.Payload)
	}
}
