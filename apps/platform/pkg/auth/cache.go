package auth

import (
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func setUserCache(userUniqueKey, siteid string, user *meta.User) error {
	return cache.Set(cache.GetUserKey(userUniqueKey, siteid), user)
}

func getUserCache(userUniqueKey, siteid string) (*meta.User, bool) {
	user := &meta.User{}
	err := cache.Get(cache.GetUserKey(userUniqueKey, siteid), user)
	if err != nil {
		return nil, false
	}
	return user, true
}

func setHostCache(domainType, domainValue string, site *meta.Site) error {
	return cache.Set(cache.GetHostKey(domainType, domainValue), site)
}

func getHostCache(domainType, domainValue string) (*meta.Site, bool) {
	site := &meta.Site{}
	err := cache.Get(cache.GetHostKey(domainType, domainValue), site)
	if err != nil {
		return nil, false
	}
	return site, true
}
