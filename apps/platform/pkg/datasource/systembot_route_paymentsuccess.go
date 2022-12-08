package datasource

import (
	"time"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runPaymentSuccessRouteBot(route *meta.Route, uesioSession *sess.Session) error {

	anonSession := sess.GetStudioAnonSession()
	stripeKey, err := secretstore.GetSecretFromKey("uesio/studio.stripe_key", anonSession)
	if err != nil {
		return err
	}
	stripe.Key = stripeKey
	checkoutSessionID := route.Params["session_id"]

	checkoutSession, err := session.Get(checkoutSessionID, nil)
	if err != nil {
		return err
	}

	payment := &meta.Payment{
		User:            &meta.User{ID: checkoutSession.ClientReferenceID},
		Date:            time.Now().Format("2006-01-02"),
		Total:           float64(checkoutSession.AmountTotal) / 100,
		CheckoutSession: checkoutSessionID,
	}

	err = PlatformSaveOne(payment, nil, nil, uesioSession)
	if err != nil {
		return err
	}

	return nil
}
