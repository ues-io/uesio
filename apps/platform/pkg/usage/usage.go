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
)

func RunJob() error {

	logger.Log("RunJob", logger.INFO)

	conn := cache.GetRedisConn()
	defer conn.Close()

	keys, err := redis.Strings(conn.Do("SMEMBERS", "USAGE_KEYS"))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	if len(keys) == 0 {
		return nil
	}

	keyArgs := redis.Args{}.AddFlat(keys)

	values, err := redis.Strings(conn.Do("MGET", keyArgs...))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	_, err = conn.Do("DEL", keyArgs...)
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	_, err = conn.Do("DEL", "USAGE_KEYS")
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	changes := adapt.Collection{}
	for i, key := range keys {
		keyParts := strings.Split(key, ":")
		if len(keyParts) != 9 {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
		}
		usageItem := adapt.Item{}
		usageItem.SetField("uesio/core.tenanttype", keyParts[1])
		usageItem.SetField("uesio/core.tenantid", keyParts[2]+":"+keyParts[3])
		usageItem.SetField("uesio/core.user", keyParts[4])
		usageItem.SetField("uesio/core.day", keyParts[5])
		usageItem.SetField("uesio/core.actiontype", keyParts[6])
		usageItem.SetField("uesio/core.metadatatype", keyParts[7])
		usageItem.SetField("uesio/core.metadataname", keyParts[8])
		total, _ := strconv.ParseFloat(values[i], 64)
		usageItem.SetField("uesio/core.total", total)
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
	}

	return nil
}
