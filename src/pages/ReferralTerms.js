import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Gift, Shield } from 'lucide-react';

export default function ReferralTerms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Gift className="w-5 h-5 text-amber-500" /> Invite a Friend — Terms &amp; Conditions
          </h1>
        </div>

        <Card className="border-border/20">
          <CardContent className="p-6 space-y-5 text-sm leading-relaxed text-muted-foreground">

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">Campaign Summary</h2>
              <p>The PlusOneStar Referral Campaign ("Campaign") allows verified members to invite friends and earn a <strong>1 week free subscription</strong> for both the referrer and the referred person when the invited friend successfully joins and completes identity verification.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">Eligibility</h2>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>Only users who have completed <strong>identity verification</strong> (face verification) on PlusOneStar are eligible to refer others and earn rewards.</li>
                <li>The invited friend must register with a <strong>valid @gmail.com email address</strong>. Other email providers are not accepted for referral rewards.</li>
                <li>Each person may only claim the referral reward <strong>once</strong>. Multiple accounts by the same person are not permitted.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">Reward Details</h2>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>Both the referrer and the referred friend receive a <strong>7-day free subscription</strong> automatically applied when the referred friend completes identity verification.</li>
                <li>Rewards are non-transferable and cannot be converted to cash.</li>
                <li>Rewards may be revoked if fraudulent activity is detected.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">Duplicate Account Policy</h2>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>PlusOneStar uses facial recognition to detect duplicate accounts. If the same person's face is detected on multiple accounts, all rewards associated with those accounts will be revoked.</li>
                <li>The duplicate accounts will be placed under review and suspended. The user must delete the duplicate account to regain access.</li>
                <li>Attempting to earn multiple rewards through duplicate accounts constitutes fraud and may result in permanent suspension.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">Admin Rights</h2>
              <p>PlusOneStar reserves the right to:</p>
              <ul className="space-y-1.5 list-disc pl-4 mt-1.5">
                <li>Modify, pause, or end the Campaign at any time without notice.</li>
                <li>Revoke rewards in cases of suspected fraud or policy violations.</li>
                <li>Monitor all referral activity and blacklist abusive users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-foreground mb-2">General</h2>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>By participating in the Campaign, you agree to these Terms.</li>
                <li>These Terms are subject to PlusOneStar's general <a href="/terms" className="text-accent underline">Terms of Service</a>.</li>
                <li>Last updated: March 2026</li>
              </ul>
            </section>

          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/20">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground">PlusOneStar actively monitors for abuse and fake accounts using AI-powered face matching and behavioral analysis.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
