from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import sys
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models import User, PaymentTransaction, SubscriptionPlan, ReferralConversion, ReferralReward, ReferralWallet
from ..schemas.payments import PaymentCreate, PaymentResponse, WebhookEvent, PaymentVerificationResponse, TransactionRecord, TransactionUpdate
import uuid
import httpx
from ..config import settings

router = APIRouter()

@router.post("/initiate", response_model=PaymentResponse)
async def initiate_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Logic to initialize payment with provider
    try:
        transaction_id = uuid.uuid4()
        payment_url = None
        reference = f"ref-{transaction_id}"
        
        if payment_data.provider == "polar":
            # Polar expects a checkout session creation
            # If subscription_plan_id is provided, get the price ID from the DB
            price_id = None
            print(f"🔍 Polar Init - Subscription Plan ID: {payment_data.subscription_plan_id}", file=sys.stderr, flush=True)
            
            if payment_data.subscription_plan_id:
                try:
                    plan_uuid = uuid.UUID(payment_data.subscription_plan_id)
                    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_uuid).first()
                    if plan:
                        price_id = plan.polar_product_price_id
                        print(f"✅ Found plan: {plan.name}, Price ID: {price_id}", file=sys.stderr, flush=True)
                    else:
                        print(f"❌ No plan found for UUID: {plan_uuid}", file=sys.stderr, flush=True)
                except ValueError as e:
                    print(f"⚠️ Invalid UUID format: {payment_data.subscription_plan_id}, trying string match: {e}", file=sys.stderr, flush=True)
                    # Not a valid UUID, maybe it's a string ID
                    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payment_data.subscription_plan_id).first()
                    if plan:
                        price_id = plan.polar_product_price_id
                        print(f"✅ Found plan by string: {plan.name}, Price ID: {price_id}", file=sys.stderr, flush=True)
            
            # Fallback to metadata for credit purchases
            if not price_id and payment_data.metadata:
                print(f"🔍 Checking metadata for price_id: {payment_data.metadata}", file=sys.stderr, flush=True)
                # Check multiple possible keys for price ID
                price_id = (
                    payment_data.metadata.get("polarPriceId") or 
                    payment_data.metadata.get("priceId") or
                    payment_data.metadata.get("product_price_id")
                )
                if price_id:
                    print(f"✅ Found price_id in metadata: {price_id}", file=sys.stderr, flush=True)
            
            if not price_id:
                error_msg = f"Missing Polar Price ID. Plan ID: {payment_data.subscription_plan_id}, Metadata: {payment_data.metadata}"
                print(f"❌ {error_msg}", file=sys.stderr, flush=True)
                raise HTTPException(status_code=400, detail=error_msg)

            async with httpx.AsyncClient(follow_redirects=True) as client:
                headers = {
                    "Authorization": f"Bearer {settings.polar_secret_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "product_price_id": price_id,
                    "success_url": payment_data.redirect_url or f"https://getostrichai.com/payment-success?reference={transaction_id}&provider=polar",
                    "customer_email": payment_data.email,
                    "metadata": {
                        "transaction_id": str(transaction_id),
                        "user_id": str(current_user.id),
                        **(payment_data.metadata or {})
                    }
                }
                
                # Polar API expects prices or product_price_id
                print(f"🚀 Polar Checkout Payload:", file=sys.stderr, flush=True)
                print(f"   Price ID: {price_id}", file=sys.stderr, flush=True)
                print(f"   Email: {payment_data.email}", file=sys.stderr, flush=True)
                print(f"   Success URL: {payload['success_url']}", file=sys.stderr, flush=True)
                
                resp = await client.post("https://api.polar.sh/v1/checkouts/", json=payload, headers=headers)
                
                if resp.status_code not in [200, 201]:
                    error_msg = resp.text
                    print(f"❌ Polar API Error ({resp.status_code}): {error_msg}", file=sys.stderr, flush=True)
                    # If it's a 422 or similar, the body might contain useful JSON
                    try:
                        error_json = resp.json()
                        error_detail = error_json.get("detail", error_msg)
                        if isinstance(error_detail, list):
                            # Validation error format
                            error_detail = "; ".join([f"{err.get('loc', [])} - {err.get('msg', '')}" for err in error_detail])
                        print(f"📋 Parsed Error Detail: {error_detail}", file=sys.stderr, flush=True)
                    except Exception as parse_err:
                        print(f"⚠️ Could not parse error JSON: {parse_err}", file=sys.stderr, flush=True)
                        error_detail = error_msg
                    raise HTTPException(status_code=resp.status_code, detail=f"Polar API error: {error_detail}")
                
                polar_data = resp.json()
                payment_url = polar_data.get("url")
                reference = polar_data.get("id") # Use checkout ID as reference
                print(f"✅ Polar Checkout Created! URL: {payment_url}, Ref: {reference}", file=sys.stderr, flush=True)

        elif payment_data.provider == "paystack":
            async with httpx.AsyncClient(follow_redirects=True) as client:
                headers = {
                    "Authorization": f"Bearer {settings.paystack_secret_key}",
                    "Content-Type": "application/json"
                }
                # Paystack amount is in kobo (cents)
                payload = {
                    "email": payment_data.email,
                    "amount": payment_data.amount_cents,
                    "callback_url": payment_data.redirect_url,
                    "metadata": {
                        "transaction_id": str(transaction_id),
                        "user_id": str(current_user.id),
                        **(payment_data.metadata or {})
                    }
                }
                
                resp = await client.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers)
                if resp.status_code != 200:
                    print(f"❌ Paystack error: {resp.text}")
                    raise HTTPException(status_code=resp.status_code, detail=f"Paystack API error: {resp.text}")
                
                paystack_data = resp.json()
                if not paystack_data.get("status"):
                    raise HTTPException(status_code=400, detail=paystack_data.get("message"))
                
                payment_url = paystack_data.get("data", {}).get("authorization_url")
                reference = paystack_data.get("data", {}).get("reference")

        elif payment_data.provider == "flutterwave":
            # Flutterwave initiation is usually handled by the frontend SDK,
            # but we can provide a mock response if needed, although the frontend 
            # uses the SDK to get the reference/flw_ref after payment.
            # For consistent flow, we return a mock URL if frontend asks.
            payment_url = f"https://flutterwave.com/pay/mock-{transaction_id}"
        
        else:
            # Fallback mock for other providers
            payment_url = f"https://example.com/pay/mock-{transaction_id}"

        return PaymentResponse(
            id=str(transaction_id),
            amount_cents=payment_data.amount_cents,
            currency=payment_data.currency,
            provider=payment_data.provider,
            status="pending",
            reference=reference,
            payment_url=payment_url,
            created_at=datetime.utcnow()
        )
    except HTTPException as e:
        # Re-raise HTTP exceptions so their status code is preserved
        raise e
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print(f"❌ Error in initiate_payment: {e}\n{traceback_str}")
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@router.get("/history", response_model=List[PaymentResponse])
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        transactions = db.query(PaymentTransaction).filter(PaymentTransaction.user_id == current_user.id).all()
        
        # Manually map database fields to schema fields
        return [
            PaymentResponse(
                id=str(t.id),
                amount_cents=t.amount_cents,
                currency=t.currency,
                provider=t.payment_provider,
                status=t.status,
                reference=t.provider_reference,
                created_at=t.created_at
            ) for t in transactions
        ]
    except Exception as e:
        print(f"❌ Error in get_payment_history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment history: {str(e)}")

@router.get("/verify/{reference}", response_model=PaymentVerificationResponse)
async def verify_payment(
    reference: str,
    provider: str = "polar", # Default to polar or make required
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    async with httpx.AsyncClient() as client:
        if provider == "flutterwave":
            headers = {
                "Authorization": f"Bearer {settings.flutterwave_secret_key}",
                "Content-Type": "application/json"
            }
            try:
                # Flutterwave verify by reference
                # Note: 'reference' here is tx_ref
                url = f"https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref={reference}"
                response = await client.get(url, headers=headers)
                
                if response.status_code != 200:
                    # Fallback: try querying by transaction ID if reference is numeric
                    if reference.isdigit():
                         url = f"https://api.flutterwave.com/v3/transactions/{reference}/verify"
                         response = await client.get(url, headers=headers)

                data = response.json()
                
                if data.get("status") == "success" and data.get("data", {}).get("status") == "successful":
                    payment_data = data.get("data", {})
                    return PaymentVerificationResponse(
                        status="success",
                        message="Payment verified successfully",
                        data={
                            "id": str(payment_data.get("id")),
                            "reference": payment_data.get("tx_ref"),
                            "status": "successful",
                            "amount": payment_data.get("amount"),
                            "currency": payment_data.get("currency"),
                            "paid_at": payment_data.get("created_at"),
                            "customer": payment_data.get("customer", {})
                        }
                    )
                else:
                    return PaymentVerificationResponse(
                        status="failed",
                        message=data.get("message", "Payment verification failed"),
                        data=data
                    )
            except Exception as e:
                # Log error
                print(f"Flutterwave verification error: {e}")
                raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

        elif provider == "paystack":
            headers = {
                "Authorization": f"Bearer {settings.paystack_secret_key}"
            }
            try:
                url = f"https://api.paystack.co/transaction/verify/{reference}"
                response = await client.get(url, headers=headers)
                data = response.json()
                
                if data.get("status") is True and data.get("data", {}).get("status") == "success":
                    payment_data = data.get("data", {})
                    # Paystack amount is in kobo (cents)
                    amount = payment_data.get("amount") / 100
                    
                    return PaymentVerificationResponse(
                        status="success",
                        message="Payment verified successfully",
                        data={
                            "id": str(payment_data.get("id")),
                            "reference": payment_data.get("reference"),
                            "status": "successful",
                            "amount": amount,
                            "currency": payment_data.get("currency"),
                            "paid_at": payment_data.get("paid_at"),
                            "customer": payment_data.get("customer", {})
                        }
                    )
                else:
                    return PaymentVerificationResponse(
                        status="failed",
                        message=data.get("message", "Payment verification failed"),
                        data=data
                    )
            except Exception as e:
                print(f"Paystack verification error: {e}")
                raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

        elif provider == "polar":
            headers = {
                "Authorization": f"Bearer {settings.polar_secret_key}"
            }
            try:
                # Polar checkout verification
                url = f"https://api.polar.sh/v1/checkouts/{reference}"
                response = await client.get(url, headers=headers)
                
                if response.status_code != 200:
                    print(f"❌ Polar verification error: {response.text}")
                    return PaymentVerificationResponse(
                        status="failed",
                        message=f"Polar API error: {response.status_code}",
                        data={"response": response.text}
                    )

                data = response.json()
                
                # Polar checkout status: open, succeeded, confirmed, expired
                if data.get("status") in ["succeeded", "confirmed"]:
                    return PaymentVerificationResponse(
                        status="success",
                        message="Payment verified successfully",
                        data={
                            "id": data.get("id"),
                            "reference": data.get("id"),
                            "status": "successful",
                            "amount": data.get("amount") / 100 if data.get("amount") else 0,
                            "currency": data.get("currency"),
                            "paid_at": data.get("created_at"), # ISO format
                            "customer": {
                                "email": data.get("customer_email"),
                                "name": data.get("customer_name")
                            }
                        }
                    )
                else:
                    return PaymentVerificationResponse(
                        status="failed",
                        message=f"Polar payment status: {data.get('status')}",
                        data=data
                    )
            except Exception as e:
                print(f"Polar verification error: {e}")
                raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
        
        else:
             raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

@router.post("/transaction/record", response_model=PaymentResponse)
async def record_transaction(
    transaction_data: TransactionRecord,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        transaction = PaymentTransaction(
            user_id=current_user.id,
            subscription_id=uuid.UUID(transaction_data.subscription_id) if transaction_data.subscription_id else None,
            payment_provider=transaction_data.provider,
            provider_reference=transaction_data.reference,
            amount_cents=transaction_data.amount_cents,
            currency=transaction_data.currency,
            status=transaction_data.status,
            payment_method=transaction_data.payment_method,
            provider_response=transaction_data.provider_response
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        # Referral reward processing: first successful payment only
        if transaction.status == "success":
            success_count = db.query(PaymentTransaction).filter(
                PaymentTransaction.user_id == current_user.id,
                PaymentTransaction.status == "success"
            ).count()

            if success_count == 1:
                conversion = db.query(ReferralConversion).filter(
                    ReferralConversion.converted_user_id == current_user.id,
                    ReferralConversion.conversion_type == "signup"
                ).order_by(ReferralConversion.created_at.desc()).first()

                if conversion:
                    expires_at = conversion.expires_at or (conversion.created_at + timedelta(days=30))
                    if expires_at >= datetime.utcnow():
                        existing_reward = db.query(ReferralReward).filter(
                            ReferralReward.referral_conversion_id == conversion.id
                        ).first()

                        if not existing_reward:
                            amount_cents = int(round(transaction.amount_cents * 0.10))
                            if amount_cents > 0:
                                reward = ReferralReward(
                                    referral_conversion_id=conversion.id,
                                    referrer_id=conversion.referrer_id,
                                    referred_user_id=conversion.converted_user_id,
                                    amount_cents=amount_cents,
                                    currency=transaction.currency,
                                    status="credited",
                                    reward_metadata={
                                        "payment_reference": transaction.provider_reference,
                                        "payment_amount_cents": transaction.amount_cents
                                    }
                                )
                                db.add(reward)

                                wallet = db.query(ReferralWallet).filter(
                                    ReferralWallet.user_id == conversion.referrer_id
                                ).first()
                                if not wallet:
                                    wallet = ReferralWallet(
                                        user_id=conversion.referrer_id,
                                        balance_cents=0,
                                        pending_cents=0,
                                        currency=transaction.currency
                                    )
                                    db.add(wallet)

                                wallet.balance_cents += amount_cents
                                conversion.status = "qualified"
                                conversion.qualified_at = datetime.utcnow()
                                db.commit()

        return PaymentResponse(
            id=str(transaction.id),
            amount_cents=transaction.amount_cents,
            currency=transaction.currency,
            provider=transaction.payment_provider,
            status=transaction.status,
            reference=transaction.provider_reference,
            created_at=transaction.created_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to record transaction: {str(e)}")

@router.post("/transaction/update/{reference}")
async def update_transaction_status(
    reference: str,
    update_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.provider_reference == reference
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    # Ensure user owns the transaction unless admin (simplified for now)
    if transaction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this transaction")
    
    transaction.status = update_data.status
    if update_data.verified_at:
        transaction.verified_at = update_data.verified_at
    if update_data.failure_reason:
        transaction.failure_reason = update_data.failure_reason
    if update_data.provider_response:
        # Merge or replace provider response
        if transaction.provider_response:
            resp = dict(transaction.provider_response)
            resp.update(update_data.provider_response)
            transaction.provider_response = resp
        else:
            transaction.provider_response = update_data.provider_response
            
    db.commit()
    return {"status": "success", "message": "Transaction updated"}

@router.post("/webhook")
async def payment_webhook(event: WebhookEvent, request: Request):
    # Verify signature
    # Process event
    return {"status": "received"}