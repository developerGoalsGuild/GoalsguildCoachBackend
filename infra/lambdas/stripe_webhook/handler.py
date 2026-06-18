import os
import json
import hmac
import hashlib
import urllib.request
from _security import require_origin_secret
from _ssm_config import get_config_value

def verify_stripe_signature(payload, sig_header, secret):
    if not sig_header or not secret:
        return False
    
    # Parse Stripe-Signature header
    # Format: t=timestamp,v1=signature
    parts = sig_header.split(',')
    t = None
    v1 = None
    for part in parts:
        if part.startswith('t='):
            t = part[2:]
        elif part.startswith('v1='):
            v1 = part[2:]
            
    if not t or not v1:
        return False
        
    signed_payload = f"{t}.{payload}"
    expected_sig = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_sig, v1)

def handler(event, context):
    allowed, response = require_origin_secret(event)
    if not allowed:
        return response

    sig_header = event.get("headers", {}).get("stripe-signature", "")
    try:
        secret = get_config_value("STRIPE_WEBHOOK_SECRET_PARAM", "STRIPE_WEBHOOK_SECRET")
    except Exception as e:
        print(f"Error loading Stripe webhook secret from SSM: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": "Stripe configuration is missing"})}

    license_api_url = os.environ.get("LICENSE_API_URL")
    provision_secret = os.environ.get("PROVISION_API_SECRET")
    admin_secret = os.environ.get("ADMIN_API_SECRET")
    
    body = event.get("body", "")
    if event.get("isBase64Encoded", False):
        import base64
        body = base64.b64decode(body).decode("utf-8")
        
    if not verify_stripe_signature(body, sig_header, secret):
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid signature"})}
        
    try:
        stripe_event = json.loads(body)
    except json.JSONDecodeError:
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid JSON"})}
        
    event_type = stripe_event.get("type")
    data_object = stripe_event.get("data", {}).get("object", {})
    
    if event_type == "checkout.session.completed" and license_api_url:
        req_body = json.dumps({
            "email": data_object.get("customer_details", {}).get("email"),
            "stripe_session_id": data_object.get("id"),
            "stripe_payment_intent": data_object.get("payment_intent")
        }).encode("utf-8")
        
        req = urllib.request.Request(
            f"{license_api_url}/licenses",
            data=req_body,
            headers={
                "Content-Type": "application/json",
                "x-license-secret": provision_secret
            }
        )
        try:
            urllib.request.urlopen(req)
        except Exception as e:
            print(f"Error provisioning license: {e}")
            
    elif event_type in ["charge.refunded", "charge.dispute.created"] and license_api_url:
        payment_intent = data_object.get("payment_intent")
        if payment_intent:
            # Lookup license by payment intent
            import urllib.parse
            lookup_url = f"{license_api_url}/admin/licenses?payment_intent={urllib.parse.quote(payment_intent)}"
            req = urllib.request.Request(
                lookup_url,
                headers={"x-admin-secret": admin_secret}
            )
            try:
                with urllib.request.urlopen(req) as response:
                    lookup_res = json.loads(response.read().decode("utf-8"))
                    item = lookup_res.get("item", {})
                    pk = item.get("PK", "")
                    if pk.startswith("LICENSE#"):
                        license_key = pk.replace("LICENSE#", "")
                        # Revoke license
                        revoke_body = json.dumps({"license_key": license_key}).encode("utf-8")
                        revoke_req = urllib.request.Request(
                            f"{license_api_url}/admin/revoke",
                            data=revoke_body,
                            headers={
                                "Content-Type": "application/json",
                                "x-admin-secret": admin_secret
                            }
                        )
                        urllib.request.urlopen(revoke_req)
            except Exception as e:
                print(f"Error revoking license: {e}")
                
    return {"statusCode": 200, "body": json.dumps({"ok": True})}
