import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Footer from '@/components/Footer';
import {
  ShieldCheck, AlertTriangle, Scale, Ban, CreditCard, Users, Lock,
  Cookie, Eye, FileText, CheckCircle, XCircle, Mail, Camera
} from 'lucide-react';

const accent = { professional: '#3b82f6', casual: '#f43f5e' };
const accentGrad = { professional: 'linear-gradient(135deg,#3b82f6,#6366f1)', casual: 'linear-gradient(135deg,#f43f5e,#e11d48)' };

const TERMS_SECTIONS = [
  {
    icon: Scale,
    title: 'Platform Purpose & Eligibility',
    content: `PlusOneStar is a premium companionship platform connecting verified individuals for public social and professional events across India. You must be 18 years or older to register and use this platform.

PlusOneStar is strictly NOT a dating app, escort service, relationship brokerage, or adult entertainment platform in any form. All meetings must occur exclusively at public venues such as restaurants, hotels, malls, event halls, museums, and similar public spaces.

By registering, you confirm that you are 18+ years of age and agree to use the platform only for its stated purpose of companionship for public events.`
  },
  {
    icon: ShieldCheck,
    title: 'User Responsibilities & Conduct',
    content: `Users are solely and fully responsible for all their actions and decisions while using PlusOneStar. The platform facilitates connections only — we do not guarantee any specific outcome, compatibility, or personal safety, as we cannot supervise in-person meetings.

All users must:
• Provide accurate and up-to-date profile information at all times
• Immediately update their profile if any information becomes outdated
• Maintain at least one verified profile photo at all times
• Keep all companion interactions within the platform's communication tools
• Never share personal contact details, social media handles, or private information through any channel

Misrepresentation of identity, age, gender, profession, or intent is grounds for immediate permanent account termination.`
  },
  {
    icon: Ban,
    title: 'Strictly Prohibited Activities',
    content: `The following activities are absolutely forbidden and will result in immediate account action:

Contact & Privacy Violations:
• Sharing phone numbers, email addresses, or social media handles in messages, bio, or photos
• Soliciting, promoting, or engaging in private/off-platform meetings or services
• Meeting companions at private residences, hotel rooms, or any non-public location

Conduct Violations:
• Sexual solicitation, harassment, or inappropriate communications of any kind
• Creating multiple accounts or re-registering after a ban
• Using the platform for commercial advertising or business promotion
• Threatening, blackmailing, or abusive behavior of any form

Financial Violations:
• **Requesting advance payment** or money transfers through any channel
• **Engaging in any fraudulent misrepresentation** for financial benefit

All violations are logged and may be reported to law enforcement authorities.`
  },
  {
    icon: AlertTriangle,
    title: 'Account Discipline & Strike System',
    content: `PlusOneStar enforces a transparent disciplinary system:

Strike 1: Official warning — the violation is logged and the user is notified
Strike 2: 7-day account suspension — no access to browse or communicate
Strike 3: Permanent ban — the account is terminated indefinitely

Severe violations (illegal activity, threats of violence, financial fraud, sexual solicitation) result in immediate permanent ban without the three-strike process. Admin decisions are final and non-negotiable.

Permanently banned users may not re-register under any alias, email, phone number, or device. Attempting to do so constitutes a material breach of these terms and may be reported to appropriate authorities.`
  },
  {
    icon: CreditCard,
    title: 'Subscriptions, Payments & Money Handling',
    content: `Subscription fees for PlusOneStar premium plans are non-refundable unless specifically approved in writing by platform administration. GST applies to all transactions as required by Indian law.

IMPORTANT — Money Between Users:
PlusOneStar does NOT process, handle, or facilitate any financial transactions between companion finders and companions. We have no in-app payment system for user-to-user payments. All monetary arrangements for companionship services must be agreed upon and handled entirely between the two parties in person, at the time and location of the event.

PlusOneStar takes no commission from in-person user payments and accepts no liability for any financial disagreements between users. All money matters are entirely the personal responsibility of the individuals involved.

Never pay anyone in advance, via transfer, or through any digital payment method before meeting them in person. Never send money to any user for any reason, under any circumstances.`
  },
  {
    icon: Lock,
    title: 'Verification & Identity Security',
    content: `Profile verification on PlusOneStar uses AI-powered face liveness detection. Government IDs are never stored on our servers — we only confirm that the person is real and present.

Verification requirements:
• Users must maintain at least one verified photo on their profile at all times
• Changing or removing the verified profile photo requires completing face re-verification
• Until re-verification is complete, online status and visibility to other users is disabled
• Fake or manipulated verification attempts result in immediate permanent ban

The SOS emergency button immediately sends an alert to the user's registered emergency contact and to platform administrators simultaneously. Users should keep their emergency contact information current at all times.`
  },
  {
    icon: Users,
    title: 'Platform Rights & Modifications',
    content: `PlusOneStar reserves the right to:

• **Modify, update, or discontinue** any feature, service, or aspect of the platform at any time without prior notice
• **Change subscription pricing** with reasonable advance notice to active subscribers
• **Suspend or terminate any user account** without prior notice if safety or policy violations are detected
• **Access and review flagged conversations** for safety and compliance purposes
• Update these terms at any time — continued use of the platform constitutes acceptance of updated terms
• Refuse service to any individual at our sole discretion`
  },
  {
    icon: Camera,
    title: 'Chat Privacy & Screenshot Policy',
    content: `Taking screenshots, screen recordings, or any form of media capture of private conversations on PlusOneStar is STRICTLY PROHIBITED and constitutes a serious violation of user privacy.

What we enforce:
• Screenshots and screen recordings of any chat conversation are forbidden without the explicit written consent of all parties involved
• Our platform employs detection technology that identifies common screenshot attempts and immediately notifies the other participant
• Any detectable screenshot attempt is automatically logged against your account
• The other party is notified in real-time: "Someone attempted to capture this conversation"
• Sharing, distributing, or publishing any captured content from PlusOneStar chats on any external platform constitutes a severe breach and will result in immediate permanent ban

Penalties for violations:
• First detection: Official warning + notification to the other participant
• Second detection: 7-day account suspension
• Third detection: Permanent ban and potential legal action under Indian IT Act 2000 (Section 66E — Privacy Violation)

All chat interactions are end-to-end protected. Any evidence of screenshot abuse may be shared with law enforcement upon request.`
  },
  {
    icon: Ban,
    title: 'Language & Communication Standards',
    content: `PlusOneStar maintains a strict zero-tolerance policy on offensive, abusive, or discriminatory language in all chat communications.

Prohibited language includes:
• Sexually explicit, crude, or harassing language of any kind
• Racist, casteist, communal, or religiously offensive remarks
• Threats, intimidation, or aggressive messaging
• Derogatory comments about gender, sexuality, appearance, or disability
• Stalking-style repeated messaging after the other party has disengaged

How we enforce it:
• All messages are scanned in real-time by our AI moderation system
• First violation: Immediate content warning + Strike 1 logged
• Second violation: 7-day suspension + Strike 2 logged
• Third violation: Permanent account ban without appeal
• Severe messages (explicit threats, illegal content): Immediate permanent ban + report to law enforcement

We do not tolerate any form of verbal abuse. Our platform is built for respectful, dignified, public social connections. Users who cannot maintain basic standards of human decency have no place on PlusOneStar.`
  },
  {
    icon: FileText,
    title: 'Governing Law, Disputes & Legal Contact',
    content: `These Terms of Service are governed by and construed in accordance with the laws of India, specifically the Indian Information Technology Act 2000 and Consumer Protection Act 2019.

Any disputes arising from the use of PlusOneStar are subject to the exclusive jurisdiction of the courts located in Andhra Pradesh, India.

By using this platform, you agree to make a good-faith attempt to resolve disputes through direct negotiation before seeking legal remedies. For all legal and compliance matters, contact us exclusively at:

support@plusonestar.com

Please use the above email for all legal inquiries, privacy requests, and compliance matters.`
  },
];

const PRIVACY_SECTIONS = [
  {
    icon: Eye,
    title: 'Data We Collect',
    content: `We collect the minimum data required to operate the platform safely and effectively:

Account Information:
• Name, email address, phone number, date of birth, gender

Profile Information:
• Photos, bio text, city/state location, hobbies, occupation, blood group, religion, languages
• Companion pricing, availability, and event categories (for companion finder accounts)

Usage Data:
• Pages visited, search queries used, request history, login timestamps

Device & Network Data:
• IP address, browser type, device model, operating system

Communication Data:
• AI-moderated chat messages for safety compliance (message content is not retained after moderation review)`
  },
  {
    icon: Lock,
    title: 'How We Use Your Data',
    content: `Your data is used exclusively for the following purposes:

• Displaying your public profile to other verified users on the platform
• Matching companions with companion finders based on search preferences
• Processing subscription payments and managing plan access
• Sending transactional communications (OTP codes, request confirmations, safety alerts)
• AI-powered identity verification (liveness detection only — no ID storage)
• Moderating content for safety and community standards compliance
• Improving platform matching algorithms using anonymized patterns
• Fulfilling legal compliance obligations under Indian law

We do NOT use your data for advertising, profiling for third-party purposes, or any commercial use beyond operating PlusOneStar.`
  },
  {
    icon: ShieldCheck,
    title: 'Data Protection & Security',
    content: `We implement industry-standard security measures to protect your data:

Encryption:
• All data transmitted over the internet uses TLS 1.3 encryption
• All stored sensitive data uses AES-256 encryption
• Passwords are one-way hashed using bcrypt with salt — they cannot be recovered or read

Authentication:
• JWT tokens with 7-day expiry are used for session management
• OTP codes are required for account verification and password resets

AI Verification:
• Face verification images are processed transiently and are not stored on our servers
• Government IDs are never collected, stored, or transmitted

We do not sell, rent, share, or trade your personal data with any third party for commercial purposes. We share data with law enforcement only when legally compelled to do so.`
  },
  {
    icon: Users,
    title: 'What Others Can See',
    content: `Your public profile (visible to all authenticated users):
• Profile name, photos, age, gender, location (city/state only), bio, hobbies, companion pricing, rating, and reviews

Information that is NEVER visible to other users:
• Email address
• Phone number
• Blood group and religion (unless you explicitly add them to your public bio)
• Emergency contact details
• Payment history and subscription status
• Device information and IP addresses

Location precision is always limited to city and state level — your street address or exact GPS coordinates are never displayed publicly.`
  },
  {
    icon: FileText,
    title: 'Your Rights Under Indian Data Law',
    content: `Under India's Personal Data Protection framework, you have the following rights:

Right to Access: Request a complete copy of all personal data we hold about you.

Right to Correction: Request correction of any inaccurate or outdated information.

Right to Deletion: Request complete deletion of your account and all associated personal data. Note: request records are retained for 12 months for legal and dispute resolution purposes.

Right to Portability: Receive your personal data in a structured, machine-readable format.

Right to Opt-Out: Opt out of non-essential communications at any time.

To exercise any of these rights, send a request from your registered email to:
support@plusonestar.com

We process all data rights requests within 30 calendar days.`
  },
  {
    icon: AlertTriangle,
    title: 'Data Retention Policy',
    content: `How long we keep your information:

Active accounts: All profile data is retained while your account is active and in good standing.

After account deletion:
• Profile information is permanently removed within 30 days of the deletion request
• Request and transaction records are retained for 12 months for legal/dispute purposes
• Safety-flagged or moderation-reviewed messages are retained for 6 months
• Anonymized, non-personally-identifiable usage analytics are retained indefinitely for platform improvement`
  },
];

const COOKIE_SECTIONS = [
  {
    icon: Cookie,
    title: 'What Are Cookies and Why We Use Them',
    content: `Cookies are small text files that are stored on your device when you visit PlusOneStar. They serve important functions that allow the platform to work correctly and remember your preferences.

We use two types of cookies:

Session Cookies: Temporary cookies that exist only while your browser is open. They are automatically deleted when you close your browser or tab.

Persistent Cookies: Cookies that remain on your device for a set period (up to 12 months). They are used to remember your preferences such as dark mode and professional/casual mode settings between visits.

We use the absolute minimum number of cookies needed to operate the platform. We do NOT use advertising cookies, third-party tracking scripts, Google Analytics, Facebook Pixel, or any similar commercial tracking tools.`
  },
  {
    icon: ShieldCheck,
    title: 'Essential Cookies (Required)',
    content: `These cookies are strictly necessary for the platform to function. You cannot disable them without preventing login and core functionality from working.

Authentication Token (plusonestar_token):
Keeps you securely logged into your account. Without this cookie, you would need to log in on every page load. Duration: 7 days.

Theme & Mode Preference (theme_preference):
Remembers whether you prefer dark or light mode, and whether you are in professional or casual mode. Duration: 30 days.

Security Tokens:
Used to protect form submissions from cross-site request forgery (CSRF) attacks. Duration: Session only.

Session State:
Preserves your in-progress actions such as partially completed booking forms. Duration: Session only.`
  },
  {
    icon: Eye,
    title: 'Optional & Analytics Cookies',
    content: `Referral Tracking (pendingReferralCode):
If you arrive at PlusOneStar via a referral link, this cookie temporarily stores the referral code so it can be applied when you complete your signup. Duration: Session only. This cookie is deleted automatically after signup.

First-Party Analytics:
We use basic, anonymized first-party analytics to understand how users interact with the platform — which features are popular and where improvements are needed. This data is never linked to individual identities and is never shared with third parties. Duration: 12 months.

You can disable analytics cookies by adjusting your browser settings without affecting core platform functionality.`
  },
  {
    icon: Lock,
    title: 'Managing and Controlling Cookies',
    content: `You have full control over cookies through your browser settings:

To disable cookies: Go to your browser settings → Privacy & Security → Cookies. Note that disabling essential cookies will prevent you from logging in.

To clear cookies: Clearing cookies in your browser will log you out of all sessions. You can then log back in with your email and password.

To use incognito/private mode: Session cookies only — all cookies are deleted when you close the private window.

Browser Do Not Track (DNT): We respect DNT signals for all non-essential cookies. If your browser sends a DNT header, we will not set analytics cookies.

Most modern browsers (Chrome, Firefox, Safari, Edge) allow you to view, manage, and delete individual cookies through their developer tools or settings menus.`
  },
];

const SAFETY_SECTIONS = [
  {
    icon: ShieldCheck,
    title: 'Before You Meet — Precautions',
    positive: [
      'Verify the companion has the blue face-verified badge on their profile before request',
      'Share your confirmed meeting location and time with at least one trusted person before leaving',
      "Check the companion's profile reviews and star rating from previous requests",
      'Confirm the venue is a well-known, accessible public location',
      'Keep all pre-meeting communication strictly within the PlusOneStar chat system',
      "Keep all pre-meeting communication strictly within the PlusOneStar chat system",
      "Make sure your emergency contact's details are updated in your profile settings",
    ],
    negative: [
      'Never share your home address, workplace, or any private location details',
      'Never pay any amount in advance — payments are handled only in person at the event',
      'Never accept meeting requests sent outside the platform (WhatsApp, Instagram, etc.)',
      'Never meet at private residences, hotel rooms, or any non-public place',
    ]
  },
  {
    icon: AlertTriangle,
    title: 'During Your Meeting — Stay Safe',
    positive: [
      'Meet only at the confirmed venue you discussed during booking',
      'Keep your phone charged and readily accessible at all times',
      'Use the SOS button in your PlusOneStar dashboard immediately if you feel unsafe',
      'Trust your instincts — it is completely acceptable to leave if anything feels wrong',
      'Let your emergency contact know when you arrive and when you safely leave',
    ],
    negative: [
      'Never reveal your bank details, financial information, or personal identification',
      'Never agree to move to a second location that was not agreed on during request',
      'Never accept food or drinks from a companion that you did not personally order or prepare',
      'Never hand over any money before the event begins or in any way other than in-person at the event',
    ]
  },
  {
    icon: Ban,
    title: 'Red Flags — Report Immediately',
    positive: [],
    negative: [
      'Asking for your personal phone number, Instagram handle, or social media profiles',
      'Pressuring you to meet somewhere private or outside the confirmed public venue',
      'Requesting money in advance, via UPI, or in cryptocurrency',
      'Making sexually suggestive, inappropriate, or uncomfortable comments',
      'Displaying threatening, aggressive, or manipulative behavior',
      'Claiming to be in an emergency and asking you for money',
      'Trying to get you to communicate outside the PlusOneStar platform',
    ]
  },
  {
    icon: Lock,
    title: 'Money & Payments — Non-Negotiable Rules',
    positive: [
      'All payments between you and a companion happen in person, at the event',
      'Agree on the exact amount during request before the event takes place',
      'Pay only in cash or via a method you both agree on, in person',
      'Ask for a simple acknowledgment from the companion after paying',
    ],
    negative: [
      '**Never pay anyone in advance under any circumstances**',
      '**Never send money via UPI, bank transfer, PayTM, or cryptocurrency to any user**',
      'Never pay outside of the in-person agreed arrangement',
      '**PlusOneStar does not have an in-app payment system between users — any request to pay "through the app" is a scam**',
    ]
  },
  {
    icon: Lock,
    title: 'SOS Emergency System',
    positive: [
      'Tap the SOS button on your dashboard in any emergency situation',
      'Your emergency contact receives an immediate detailed email alert',
      'The alert includes your last known GPS location if permission is granted',
      'Platform safety administrators are notified simultaneously',
      'Each SOS has a unique incident ID for safety team tracking',
      'The SOS button reactivates 6 seconds after pressing — to prevent accidental triggers',
    ],
    negative: [
      'Never ignore an SOS alert received from someone in your contacts',
      'Never abuse the SOS system with false alarms — this is a serious safety tool',
    ]
  },
];

const TABS = [
  { id: 'terms', label: 'Terms & Conditions', icon: Scale },
  { id: 'privacy', label: 'Privacy Policy', icon: Eye },
  { id: 'cookies', label: 'Cookie Policy', icon: Cookie },
  { id: 'safety', label: 'Safety Guide', icon: ShieldCheck },
];

function Section({ icon: Icon, title, content, ac, index }) {
  const parseBold = (text) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, i) => 
      part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-foreground tracking-wide font-bold">{part.slice(2, -2)}</strong> : part
    );
  };

  return (
    <div className="p-8 rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-sm space-y-5 shadow-lg transition-all hover:shadow-xl hover:bg-card mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `${ac}15` }}>
          <Icon className="w-6 h-6" style={{ color: ac }} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold text-muted-foreground/50 font-mono tracking-widest">{String(index + 1).padStart(2, '0')}</span>
            <h3 className="text-lg font-black leading-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
          </div>
          <div className="space-y-4">
            {content.split('\n\n').map((para, i) => (
              <p key={i} className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">{parseBold(para)}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SafetySection({ icon: Icon, title, positive, negative, ac }) {
  const parseBold = (text) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, i) => 
      part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-foreground tracking-wide font-bold">{part.slice(2, -2)}</strong> : part
    );
  };

  return (
    <div className="p-8 rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-sm space-y-6 shadow-lg transition-all hover:shadow-xl hover:bg-card mb-8 text-left">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `${ac}15` }}>
          <Icon className="w-6 h-6" style={{ color: ac }} />
        </div>
        <h3 className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
      </div>
      
      <div className="bg-background/40 rounded-2xl p-6 space-y-6 border border-border/20">
        {positive.length > 0 && (
          <div className="space-y-4">
            {positive.map((p, j) => (
              <div key={j} className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[15px] text-muted-foreground leading-relaxed">{parseBold(p)}</p>
              </div>
            ))}
          </div>
        )}
        {positive.length > 0 && negative.length > 0 && <div className="h-px w-full bg-border/40 my-2" />}
        {negative.length > 0 && (
          <div className="space-y-4">
            {negative.map((n, j) => (
              <div key={j} className="flex items-start gap-4">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[15px] text-muted-foreground leading-relaxed">{parseBold(n)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TermsPage() {
  const { mode, theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('terms');
  const isDark = theme === 'dark';
  const isPro = mode === 'professional';
  const ac = isPro ? accent.professional : accent.casual;
  const grad = isPro ? accentGrad.professional : accentGrad.casual;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden max-w-[100vw]" data-testid="terms-page">
      {/* Disclaimer strip */}
      <div className="w-full py-1.5 px-4 text-center text-[10px] font-semibold" style={{ background: `${ac}10`, borderBottom: `1px solid ${ac}20`, color: ac }}>
        18+ platform · Public venues only · All interactions at your own risk
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="PlusOneStar Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>PlusOneStar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={user ? '/dashboard' : '/'}><Button variant="ghost" size="sm" className="text-xs">{user ? 'Dashboard' : 'Home'}</Button></Link>
            {!user && (
              <Link to="/auth"><Button size="sm" className="text-xs" style={{ background: grad, color: '#fff', border: 'none' }}>Join Free</Button></Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 px-4 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
        <div className="max-w-2xl mx-auto space-y-3">
          <Badge className="font-bold" style={{ background: `${ac}15`, color: ac, border: `1px solid ${ac}30` }}>Legal & Safety</Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Platform <span style={{ color: ac }}>Policies</span>
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2025 · Governed by Indian IT Act 2000 & Consumer Protection Act 2019</p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2 scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${activeTab === id ? 'text-white shadow-sm' : 'text-muted-foreground hover:bg-accent/10'}`}
                style={activeTab === id ? { background: grad } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10 pb-20">

        {/* Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="space-y-10">
            <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">By creating an account and using PlusOneStar, you agree to these Terms. This is a legally binding agreement under Indian law. Please read every section carefully before proceeding.</p>
            </div>
            {TERMS_SECTIONS.map(({ icon, title, content }, i) => (
              <Section key={i} icon={icon} title={title} content={content} ac={ac} index={i} />
            ))}
            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 text-center space-y-3 mt-8">
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Platform Disclaimer</p>
              <p className="text-sm text-muted-foreground leading-relaxed">PlusOneStar is strictly a companionship platform for public events only. We do not facilitate, endorse, or condone any form of private meetings, romantic or sexual arrangements, financial misrepresentation, or any illegal activity. Violations result in immediate termination and may be reported to law enforcement.</p>
              <p className="text-xs text-muted-foreground mt-2">All legal and policy inquiries: <a href="mailto:support@plusonestar.com" className="underline font-semibold">support@plusonestar.com</a></p>
            </div>
          </div>
        )}

        {/* Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="space-y-10">
            <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-3">
              <Eye className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">Your privacy is a fundamental right, not an afterthought. We collect only what is necessary to operate the platform safely, protect it with industry-standard encryption, and never sell it to third parties.</p>
            </div>
            {PRIVACY_SECTIONS.map(({ icon, title, content }, i) => (
              <Section key={i} icon={icon} title={title} content={content} ac={ac} index={i} />
            ))}
            <div className="p-6 rounded-2xl border border-border/20 bg-card text-center space-y-3 mt-8">
              <p className="text-sm font-bold">Request Data Deletion</p>
              <p className="text-sm text-muted-foreground leading-relaxed">To request deletion of your account and all associated personal data, send an email from your registered address. We process all deletion requests within 30 calendar days.</p>
              <a href="mailto:support@plusonestar.com">
                <Button size="sm" style={{ background: grad, color: '#fff', border: 'none' }} className="gap-2 mt-2">
                  <Mail className="w-3.5 h-3.5" /> support@plusonestar.com
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Cookie Policy */}
        {activeTab === 'cookies' && (
          <div className="space-y-10">
            <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5 text-sm text-green-700 dark:text-green-400 flex items-start gap-3">
              <Cookie className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">We use the absolute minimum number of cookies required to operate PlusOneStar. We do not use advertising cookies, third-party tracking, or commercial analytics tools of any kind.</p>
            </div>
            {COOKIE_SECTIONS.map(({ icon, title, content }, i) => (
              <Section key={i} icon={icon} title={title} content={content} ac={ac} index={i} />
            ))}

          </div>
        )}

        {/* Safety Guide */}
        {activeTab === 'safety' && (
          <div className="space-y-10">
            <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">Your safety is our highest and non-negotiable priority. Please read and follow all of these guidelines every single time you use PlusOneStar. No meeting is worth compromising your personal safety.</p>
            </div>
            {SAFETY_SECTIONS.map(({ icon, title, positive, negative }, i) => (
              <SafetySection key={i} icon={icon} title={title} positive={positive} negative={negative} ac={ac} />
            ))}
            <div className="p-6 rounded-2xl text-center space-y-4 mt-8" style={{ background: grad }}>
              <ShieldCheck className="w-10 h-10 text-white mx-auto" />
              <div>
                <p className="text-white font-bold text-lg">In an emergency, use SOS immediately.</p>
                <p className="text-white/80 text-sm mt-2 leading-relaxed">Your SOS alert will reach your emergency contact and our safety team within seconds. Always keep your emergency contact details updated in your profile.</p>
              </div>
              {user && <Link to="/dashboard"><Button variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">Go to Safety Center</Button></Link>}
            </div>
          </div>
        )}

        <Separator className="my-10" />
        <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`hover:text-foreground underline transition-colors ${activeTab === id ? 'text-foreground font-semibold' : ''}`}>{label}</button>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-5">
          Questions, legal inquiries, data requests: <a href="mailto:support@plusonestar.com" className="underline font-semibold">support@plusonestar.com</a>
        </p>
      </div>
      <Footer />
    </div>
  );
}
