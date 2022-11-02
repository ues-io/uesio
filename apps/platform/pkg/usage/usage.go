package usage

import (
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func RegisterEvent(actiontype, metadatatype, metadataname string, size int64, session *sess.Session) error {

	user := session.GetUserInfo()

	if user.Username == "boot" || user.Username == "system" {
		return nil
	}

	if user.ID == "" {
		return fmt.Errorf("Error Registering Usage Event: Empty User ID ")
	}

	conn := cache.GetRedisConn()
	defer conn.Close()

	currentTime := time.Now()
	key := fmt.Sprintf("event:%s:%s:%s:%s:%s:%s", session.GetSiteTenantID(), user.ID, currentTime.Format("2006-01-02"), actiontype, metadatatype, metadataname)

	conn.Send("SADD", "USAGE_KEYS", key)

	if size != 0 {
		conn.Send("INCRBY", key, size)

	} else {
		conn.Send("INCR", key)
	}

	err := conn.Flush()
	if err != nil {
		return fmt.Errorf("Error Setting cache value: " + err.Error())
	}
	_, err = conn.Receive()
	if err != nil {
		return fmt.Errorf("Error Setting cache value: " + err.Error())
	}

	return nil
}
