package auth

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func SetUserCache(userid, siteid string, user *meta.User) error {
	return cache.SetHash(cache.GetUserKey(userid, siteid), map[string]string{
		"firstname": user.FirstName,
		"lastname":  user.LastName,
		"profile":   user.Profile,
		"picture":   user.GetPictureID(),
		"language":  user.Language,
		"username":  user.Username,
	})
}

func GetUserCache(userid, siteid string) (*meta.User, bool) {

	result, err := cache.GetHash(cache.GetUserKey(userid, siteid))
	if err != nil || result == nil {
		return nil, false
	}

	return &meta.User{
		ID:        userid,
		FirstName: result["firstname"],
		LastName:  result["lastname"],
		Profile:   result["profile"],
		Username:  result["username"],
		Picture: (func(picture string) *meta.UserFileMetadata {
			if picture == "" {
				return nil
			}
			return &meta.UserFileMetadata{
				ID: picture,
			}
		})(result["picture"]),
		Language: result["language"],
	}, true
}

func setHostCache(domainType, domainValue string, site *meta.Site) error {

	return cache.SetHash(cache.GetHostKey(domainType, domainValue), map[string]string{
		"sitename": site.Name,
		"siteid":   site.ID,
		"siteapp":  site.GetAppID(),
		"major":    strconv.Itoa(site.Bundle.Major),
		"minor":    strconv.Itoa(site.Bundle.Minor),
		"patch":    strconv.Itoa(site.Bundle.Patch),
	})
}

func getHostCache(domainType, domainValue string) (*meta.Site, bool) {

	result, err := cache.GetHash(cache.GetHostKey(domainType, domainValue))
	if err != nil || result == nil {
		return nil, false
	}

	major, _ := strconv.Atoi(result["major"])
	minor, _ := strconv.Atoi(result["minor"])
	patch, _ := strconv.Atoi(result["patch"])

	return &meta.Site{
		ID:   result["siteid"],
		Name: result["sitename"],
		App: &meta.App{
			ID: result["siteapp"],
		},
		Bundle: &meta.Bundle{
			App: &meta.App{
				ID: result["siteapp"],
			},
			Major: major,
			Minor: minor,
			Patch: patch,
		},
	}, true
}
