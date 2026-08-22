"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ImagePlus, LoaderCircle, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { calculateEntryFeeCents } from "@/lib/pricing";

type Props = { roundId: string; roundName: string; minimumFeeCents: number };

export function DealSubmissionForm({ roundId, roundName, minimumFeeCents }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [credit, setCredit] = useState(20);
  const [codesText, setCodesText] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const codes = useMemo(
    () => codesText.split(/\r?\n|,/).map((code) => code.trim()).filter(Boolean),
    [codesText],
  );
  const poolCents = credit * 100 * codes.length;
  const feeCents = calculateEntryFeeCents(poolCents, minimumFeeCents);

  async function uploadLogo(file: File) {
    setLogoError(null);
    setUploadingLogo(true);
    try {
      const response = await fetch("/api/uploads/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Could not prepare logo upload.");
      const upload = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, "Cache-Control": "public, max-age=31536000, immutable" },
        body: file,
      });
      if (!upload.ok) throw new Error("Object storage rejected the logo upload.");
      setLogoUrl(data.publicUrl);
    } catch (uploadError) {
      setLogoUrl(null);
      setLogoError(uploadError instanceof Error ? uploadError.message : "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const payload = {
      roundId,
      companyName: form.get("companyName"),
      companyWebsite: form.get("companyWebsite"),
      productName: form.get("productName"),
      tagline: form.get("tagline"),
      description: form.get("description"),
      headline: form.get("headline"),
      redemptionUrl: form.get("redemptionUrl"),
      terms: form.get("terms"),
      accentColor: form.get("accentColor"),
      logoUrl: logoUrl || undefined,
      creditAmountDollars: credit,
      couponCodes: codes,
    };
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message || "Submission failed.");
        setFieldErrors(data.fields || {});
        return;
      }
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else router.push(`/dashboard/deals/${data.dealId}`);
    } catch {
      setError("DealWar could not submit your entry. Your codes were not stored.");
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) => fieldErrors[name]?.[0];

  return (
    <form className="submission-form" onSubmit={submit}>
      <div className="form-section">
        <div className="form-section-index">01</div>
        <div className="form-section-body">
          <div className="form-title"><span>Company identity</span><p>Who is making the promise?</p></div>
          <div className="form-grid">
            <label><span>Company name</span><input name="companyName" required minLength={2} maxLength={80} /><small>{fieldError("companyName")}</small></label>
            <label><span>Company website</span><input name="companyWebsite" type="url" placeholder="https://company.com" required /><small>{fieldError("companyWebsite")}</small></label>
            <label><span>Product name</span><input name="productName" required minLength={2} maxLength={64} /><small>{fieldError("productName")}</small></label>
            <label><span>Brand accent</span><span className="color-input"><input name="accentColor" type="color" defaultValue="#ff4f1f" /> Used on the live board</span></label>
          </div>
          <label className="logo-upload">
            <span>Company logo <em>optional</em></span>
            <span className="logo-upload-control">
              <span className="logo-preview">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed upload has a public object URL
                  <img src={logoUrl} alt="Uploaded company logo preview" />
                ) : uploadingLogo ? <LoaderCircle className="spin" /> : <ImagePlus />}
              </span>
              <span><strong>{uploadingLogo ? "Uploading…" : logoUrl ? "Logo secured" : "Upload PNG, JPEG or WebP"}</strong><small>Square artwork works best · 2 MB maximum</small></span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingLogo}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
            </span>
            {logoError && <small className="logo-error">{logoError} You can still submit without a logo.</small>}
          </label>
          <label><span>One-line product description</span><input name="tagline" required minLength={10} maxLength={120} placeholder="What your product does, without adjectives." /><small>{fieldError("tagline")}</small></label>
          <label><span>Full description</span><textarea name="description" required minLength={40} maxLength={1000} rows={4} /><small>{fieldError("description")}</small></label>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-index">02</div>
        <div className="form-section-body">
          <div className="form-title"><span>Build your offer</span><p>Only fixed-dollar credit enters {roundName}.</p></div>
          <label><span>Public deal headline</span><input name="headline" required minLength={8} maxLength={100} placeholder="Get $20 credit toward any paid plan" /><small>{fieldError("headline")}</small></label>
          <div className="form-grid">
            <label><span>Credit per customer (USD)</span><span className="money-input"><b>$</b><input type="number" value={credit} onChange={(e) => setCredit(Number(e.target.value))} min={1} max={10000} required /></span></label>
            <label><span>Redemption page</span><input name="redemptionUrl" type="url" required placeholder="https://company.com/redeem" /><small>{fieldError("redemptionUrl")}</small></label>
          </div>
          <label><span>Plain-English terms</span><textarea name="terms" required minLength={20} maxLength={2000} rows={4} placeholder="New customers only. Valid on monthly Pro plans. Expires 30 days after claim." /><small>{fieldError("terms")}</small></label>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-index">03</div>
        <div className="form-section-body">
          <div className="form-title"><span>Load verified inventory</span><p>One unique code per line. Encrypted before storage.</p></div>
          <label className="code-upload">
            <Upload size={24} />
            <span>Paste unique coupon codes</span>
            <textarea value={codesText} onChange={(event) => setCodesText(event.target.value)} rows={8} placeholder={"DW-8K2M-XP9Q\nDW-4T7N-JL2A\nDW-6C1R-VB5H"} required />
            <small className={codes.length >= 5 ? "valid-count" : ""}>{codes.length} codes detected · minimum 5</small>
            <small>{fieldError("couponCodes")}</small>
          </label>
          <div className="security-note"><ShieldCheck size={21} /><p><strong>Codes are encrypted with AES-256-GCM.</strong> Plaintext is revealed only to the authenticated claimant. Duplicate hashes are rejected.</p></div>
        </div>
      </div>

      <div className="entry-summary">
        <div><span>Public credit pool</span><strong>{formatMoney(poolCents)}</strong><small>{formatMoney(credit * 100)} × {codes.length} codes</small></div>
        <div><span>Entry + verification fee</span><strong>{formatMoney(feeCents)}</strong><small>2% · $19 minimum · $500 maximum</small></div>
        <div className="summary-action">
          <ul><li><Check size={14} /> Payment does not affect rank</li><li><Check size={14} /> Manual company review</li><li><Check size={14} /> Refund if rejected</li></ul>
          <label className="checkout-consent">
            <input type="checkbox" required />
            <span>I can bind this company and accept the <a href="/terms" target="_blank" rel="noopener noreferrer">terms</a>, <a href="/rules" target="_blank" rel="noopener noreferrer">rules</a>, and <a href="/refund-policy" target="_blank" rel="noopener noreferrer">refund policy</a>.</span>
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <Button type="submit" variant="dark" disabled={pending || uploadingLogo || codes.length < 5}>
            {pending ? <LoaderCircle className="spin" size={17} /> : null}
            {pending ? "Securing inventory" : "Review and pay"}
            {!pending && <ArrowRight size={17} />}
          </Button>
        </div>
      </div>
    </form>
  );
}
