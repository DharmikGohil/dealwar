"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type PaymentControlProps = {
  dealId: string;
  dealStatus: string;
  paid: boolean;
  paymentStatus: string;
  receiptUrl?: string | null;
  returnState?: "return" | "cancelled";
};

type PaymentResponse = {
  status?: string;
  checkoutUrl?: string;
  receiptUrl?: string | null;
  error?: { message?: string };
};

export function PaymentControl({
  dealId,
  dealStatus,
  paid,
  paymentStatus,
  receiptUrl,
  returnState,
}: PaymentControlProps) {
  const router = useRouter();
  const reconciled = useRef(false);
  const refunded = paymentStatus === "REFUNDED";
  const paymentClosed = refunded || ["REJECTED", "CANCELLED", "ENDED"].includes(dealStatus);
  const [busy, setBusy] = useState(returnState === "return" && !paid && !paymentClosed);
  const [message, setMessage] = useState<string | null>(
    returnState === "cancelled" ? "Checkout was cancelled. No completed charge was recorded." : null,
  );

  const paymentAction = useCallback(async (action: "reconcile" | "checkout") => {
    const response = await fetch(`/api/deals/${dealId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json() as PaymentResponse;
    if (!response.ok) throw new Error(payload.error?.message || "Payment request failed.");
    return payload;
  }, [dealId]);

  useEffect(() => {
    if (returnState !== "return" || paid || paymentClosed || reconciled.current) return;
    reconciled.current = true;
    void paymentAction("reconcile")
      .then((result) => {
        if (result.status === "succeeded") {
          setMessage("Payment confirmed. Your entry is now in the review queue.");
        } else if (result.status === "processing" || result.status === "pending") {
          setMessage("Payment is still processing. This page will update when Dodo confirms it.");
        } else {
          setMessage("No completed payment was found. You can safely retry checkout.");
        }
        router.refresh();
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "We could not confirm the payment yet.");
      })
      .finally(() => setBusy(false));
  }, [paid, paymentAction, paymentClosed, returnState, router]);

  async function startCheckout() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await paymentAction("checkout");
      if (result.status === "succeeded") {
        setMessage("Payment is already confirmed.");
        router.refresh();
      } else if (result.status === "processing") {
        setMessage("Your payment is processing. Do not start another checkout.");
        router.refresh();
      } else if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      } else {
        setMessage("Checkout is not ready yet. Please try again in a moment.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Secure checkout could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`payment-control${paid ? " payment-control-paid" : ""}`} aria-live="polite">
      <div className="payment-control-mark"><LockKeyhole size={24} /></div>
      <div className="payment-control-copy">
        <span className="eyebrow">Secure payment / Dodo Payments</span>
        <h2>{paid ? "Entry fee confirmed" : refunded ? "Entry fee refunded" : paymentClosed ? "Entry closed" : paymentStatus === "PENDING" ? "Finish your entry" : "Restart checkout"}</h2>
        <p>{paid ? "Your company is in the moderation queue. A second charge cannot be created." : refunded ? "Dodo Payments returned the entry fee. This rejected entry cannot be charged again." : paymentClosed ? "This entry is closed and cannot start another checkout." : "Complete the one-time entry payment to send this offer to human review."}</p>
        {message && <p className="payment-message">{message}</p>}
      </div>
      <div className="payment-control-action">
        {paid ? (
          receiptUrl ? <a className="button button-secondary" href={receiptUrl} target="_blank" rel="noreferrer">View receipt <ExternalLink size={15} /></a> : <strong>PAID</strong>
        ) : paymentClosed ? (
          <strong>{refunded ? "REFUNDED" : "CLOSED"}</strong>
        ) : (
          <Button type="button" variant="dark" onClick={startCheckout} disabled={busy}>
            {busy ? <><LoaderCircle className="spin" size={16} /> Checking payment</> : <><RotateCcw size={16} /> {paymentStatus === "PENDING" ? "Continue to payment" : "Try payment again"}</>}
          </Button>
        )}
        <small>Encrypted hosted checkout · DealWar never sees card details</small>
      </div>
    </section>
  );
}
