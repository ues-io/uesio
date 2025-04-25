package systemdialect

import (
	"crypto/rand"
	"errors"
	"log"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"golang.org/x/crypto/bcrypt"
)

const (
	letterBytes   = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" // 52 possibilities
	letterIdxBits = 6                                                      // 6 bits to represent 64 possibilities / indexes
	letterIdxMask = 1<<letterIdxBits - 1                                   // All 1-bits, as many as letterIdxBits
)

func SecureRandomAlphaString(length int) string {

	result := make([]byte, length)
	bufferSize := int(float64(length) * 1.3)
	for i, j, randomBytes := 0, 0, []byte{}; i < length; j++ {
		if j%bufferSize == 0 {
			randomBytes = SecureRandomBytes(bufferSize)
		}
		if idx := int(randomBytes[j%length] & letterIdxMask); idx < len(letterBytes) {
			result[i] = letterBytes[idx]
			i++
		}
	}

	return string(result)
}

// SecureRandomBytes returns the requested number of bytes using crypto/rand
func SecureRandomBytes(length int) []byte {
	var randomBytes = make([]byte, length)
	_, err := rand.Read(randomBytes)
	if err != nil {
		log.Fatal("Unable to generate random bytes")
	}
	return randomBytes
}

func runCreateApiKeyListenerBot(params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	// Currently this only works in a siteadmin context
	if session.GetSiteAdmin() == nil {
		return nil, errors.New("Creating api keys currently only works in a site admin context")
	}

	keyParam, ok := params["name"]
	if !ok {
		return nil, errors.New("You must provide a key name")
	}

	keyName, ok := keyParam.(string)
	if !ok {
		return nil, errors.New("key name must be a string")
	}

	userIDParam, ok := params["userid"]
	if !ok {
		return nil, errors.New("You must provide a user id")
	}

	userID, ok := userIDParam.(string)
	if !ok {
		return nil, errors.New("user id must be a string")
	}

	// Generate a new api key
	prefix := "ues_"
	id := SecureRandomAlphaString(8)
	key := SecureRandomAlphaString(32)

	hash, err := bcrypt.GenerateFromPassword([]byte(key), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	err = auth.CreateLoginMethod(&meta.LoginMethod{
		User: &meta.User{
			BuiltIn: meta.BuiltIn{
				ID: userID,
			},
		},
		FederationID: id,
		Hash:         string(hash),
		AuthSource:   "uesio/core.apikey",
		APIKeyName:   keyName,
	}, connection, session)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"key": prefix + id + key,
	}, nil

}
