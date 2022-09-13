package usage

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/gomodule/redigo/redis"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func getUser(userid string) (*meta.User, error) {

	if userid == "GUEST" {
		return &meta.User{
			FirstName: "Guest",
			LastName:  "User",
			UniqueKey: "guest",
			Username:  "guest",
		}, nil
	}

	session, err := auth.GetStudioAdminSession()
	if err != nil {
		return nil, err
	}

	user, err := auth.GetUserByID(userid, session, nil)
	if err != nil {
		return nil, err
	}
	return user, nil

}

func RunJob() error {

	logger.Log("Job Running", logger.INFO)

	conn := cache.GetRedisConn()
	defer conn.Close()

	keys, err := redis.Strings(conn.Do("SMEMBERS", "USAGE_KEYS"))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	if len(keys) == 0 {
		return nil
	}

	keyArgsSize := redis.Args{}
	keyArgs := redis.Args{}
	for i := 0; i < len(keys); i++ {
		key := keys[i]
		keyArgs = append(keyArgs, key)
		keyArgsSize = append(keyArgsSize, key+":size")
	}

	values, err := redis.Strings(conn.Do("MGET", keyArgs...))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	valuesSize, err := redis.Strings(conn.Do("MGET", keyArgsSize...))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	if len(values) != len(valuesSize) {
		return fmt.Errorf("Error Getting Usage Event: Different Sizes ")
	}

	changes := adapt.Collection{}
	for i, key := range keys {

		keyParts := strings.Split(key, ":")
		if len(keyParts) != 9 {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
		}

		user, err := getUser(keyParts[4])
		if err != nil {
			return err
		}

		usageItem := adapt.Item{}
		usageItem.SetField("uesio/core.user", user)
		usageItem.SetField("uesio/core.tenanttype", keyParts[1])
		usageItem.SetField("uesio/core.tenantid", keyParts[2]+":"+keyParts[3])
		usageItem.SetField("uesio/core.day", keyParts[5])
		usageItem.SetField("uesio/core.actiontype", keyParts[6])
		usageItem.SetField("uesio/core.metadatatype", keyParts[7])
		usageItem.SetField("uesio/core.metadataname", keyParts[8])
		total, _ := strconv.ParseFloat(values[i], 64)
		usageItem.SetField("uesio/core.total", total)
		size, _ := strconv.ParseFloat(valuesSize[i], 64)
		usageItem.SetField("uesio/core.size", size)
		changes = append(changes, &usageItem)
	}

	if len(changes) > 0 {
		requests := []datasource.SaveRequest{
			{
				Collection: "uesio/core.usage",
				Wire:       "CoolWireName",
				Changes:    &changes,
				Options:    &adapt.SaveOptions{Upsert: true},
			},
		}

		session, err := auth.GetStudioAdminSession()
		if err != nil {
			logger.LogError(err)
			return err
		}
		connection, err := datasource.GetPlatformConnection(session)
		if err != nil {
			logger.LogError(err)
			return err
		}

		err = datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))
		if err != nil {
			return errors.New("Failed to update usage events: " + err.Error())
		}

		err = conn.Send("DEL", keyArgs...)
		if err != nil {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
		}

		err = conn.Send("DEL", keyArgsSize...)
		if err != nil {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
		}

		err = conn.Send("DEL", "USAGE_KEYS")
		if err != nil {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
		}

		conn.Flush()
		_, err = conn.Receive()
		if err != nil {
			return fmt.Errorf("Error Setting cache value: " + err.Error())
		}

	}
	return nil
}
