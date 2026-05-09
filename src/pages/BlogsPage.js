import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight, X, Shield, Star, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRO_POSTS = [
  {
    id: 1,
    title: 'Executive Etiquette: Mastering Professional Galas',
    excerpt: 'High-stakes networking requires more than just a suit. Learn the unspoken rules of business conversation and social presence in the modern age.',
    content: `
      In the world of high-stakes professional networking, first impressions are not just about what you wear, but how you navigate the complex social landscape of a gala or executive dinner. Our comprehensive guide focuses on the nuances that set leaders apart.
      
      **Business Conversation Architecture:**
      Mastering the art of the pivot is essential. Professional networking isn't about selling; it's about building rapport. Learn how to transition gracefully from ambient small talk to meaningful professional inquiries without appearing opportunistic. The goal is to establish a shared narrative before diving into utility.
      
      **The Silent Language of Dress Codes:**
      Deciphering "Black Tie," "Business Formal," and the increasingly common "Executive Casual" can be a minefield. Our experts detail the exact combinations for each, ensuring you never feel underdressed or over-prepared. Remember, your attire is your first non-verbal communication of respect for the venue and the host.
      
      **Companion Leverage:**
      A professional companion acts as more than just a guest; they are a strategic asset. From acting as an icebreaker in awkward silences to helping you disengage from unproductive conversations, a trained companion allows you to focus 100% on your networking objectives while they handle the social "buffer." This synergy is why top executives never attend career-defining events alone.
    `,
    category: 'Etiquette',
    author: 'Corporate Coach',
    date: 'March 22, 2026',
    image: '/assets/blogs/pro_gala.png'
  },
  {
    id: 2,
    title: 'Why CEOs Choose Professional Companions',
    excerpt: 'Discover why top-tier executives use professional companions to manage their social presence at major global conferences and board-level dinners.',
    content: `
      Professional companionship has evolved from a luxury to a strategic necessity for the modern executive. In a world where every public appearance is scrutinized, having a vetted, professional partner by your side ensures your brand remains impeccable.
      
      **Social Intelligence & Room Analysis:**
      Our companions are trained in social intelligence, capable of reading the room's energy and identifying key power players. They assist you in navigating complex social hierarchies, ensuring you are seen with the right people at the right time.
      
      **Logistics & Boundary Management:**
      Focus on your strategic goals while your companion handles the ambient logistics—from managing event schedules to ensuring your privacy is respected. They act as a sophisticated shield, filtering out distractions and allowing you to remain in your "executive zone."
      
      **The Psychological Edge:**
      Attending a major event as a solo act can be draining. Having a reliable, professional companion provides a psychological anchor, reducing the cognitive load of social anxiety and allowing your natural leadership charisma to shine. This isn't about help; it's about empowerment.
    `,
    category: 'Executive',
    author: 'Business Analyst',
    date: 'March 20, 2026',
    image: '/assets/blogs/pro_ceo.png'
  },
  {
    id: 3,
    title: 'Safe Business Travel: Our Enterprise Safety Shield',
    excerpt: 'Enterprise-grade security meets professional hospitality. Learn about our 24/7 monitoring and VIP protocols for the modern professional traveler.',
    content: `
      For the professional traveler, safety isn't just about physical security—it's about the peace of mind that comes from a redundant support system. PlusOneStar integrates hospitality with high-tech monitoring to create the "Enterprise Safety Shield."
      
      **24/7 Technical Monitoring:**
      Every booking in Professional Mode is monitored by our dedicated security operations center. We track check-in statuses and venue safety levels in real-time, providing immediate intervention if a deviation from the plan occurs.
      
      **Verified VIP Venues:**
      We prioritize venues that meet strict corporate safety and privacy standards. Our database includes hotels, restaurants, and conference centers that are vetted not just for their service, but for their security infrastructure and discreet environment.
      
      **Encrypted Communication Protocol:**
      In an era of corporate espionage, your communication must be secure. All coordination between you and your companion is handled through our proprietary, end-to-end encrypted platform, ensuring your business plans remain confidential.
    `,
    category: 'Safety',
    author: 'Security Lead',
    date: 'March 18, 2026',
    image: '/assets/blogs/pro_security.png'
  }
];

const CASUAL_POSTS = [
  {
    id: 1,
    title: 'Fun First: Social Safety for Your Next Meetup',
    excerpt: 'Enjoying a concert or a dinner date? Here is how to keep things light, fun, and completely safe with PlusOneStar.',
    content: `
      Socializing should be a source of joy, not stress. At PlusOneStar, we believe that the best social experiences are built on a foundation of proactive safety and common sense.
      
      **The Public Venue Rule:**
      The most fundamental rule of casual meetups is transparency. Always choose vibrant, public social spots for your first few interactions. Whether it's a bustling café or a major music festival, being in a public space ensures accountability and a comfortable atmosphere for both parties.
      
      **Dynamic Location Sharing:**
      Our mobile-first dashboard allows you to share your live location with trusted friends or family members with a single tap. This digital "buddy system" ensures that someone you trust always knows where you are, without intruding on the fun of your meetup.
      
      **Instant Peace of Mind (SOS):**
      The PlusOneStar SOS button is more than just a tool; it's a commitment. If a situation ever feels uncomfortable or deviates from your expectations, the SOS button provides an immediate connection to our support team and emergency contacts, ensuring help is never far away.
    `,
    category: 'Safety',
    author: 'Social Expert',
    date: 'March 22, 2026',
    image: '/assets/blogs/casual_safety.png'
  },
  {
    id: 2,
    title: 'Finding Your Vibe: The Art of Hobby Matching',
    excerpt: 'Connect with people who share your passions for music, photography, art, or dining. Authentic connections start here.',
    content: `
      Tired of repetitive small talk that leads nowhere? PlusOneStar is designed to skip the superficial and dive straight into what makes you tick. Finding your "vibe" is about more than just a matching algorithm.
      
      **Interest-First Discovery:**
      Our advanced filtering system allows you to discover companions based on specific micro-hobbies. Whether you are looking for a rare jazz enthusiast or a street-food connoisseur, our community is segmented by passion, ensuring your conversations are engaging from the first message.
      
      **Chemistry & Communication:**
      Great meetups start with great communication. Use our secure, rich-media chat to share your work, your favorite tracks, or your travel bucket list before you meet. This pre-meetup engagement helps establish a level of comfort and excitement that ensures the actual interaction is seamless.
      
      **Local Expertise:**
      Not sure where to go? Each city-profile comes with curated "Vibe Guides"—a list of the best hidden gems, underground galleries, and rooftop lounges tailored to specific interests. We don't just find you a companion; we find you the perfect stage for your shared experience.
    `,
    category: 'Hobby',
    author: 'Vibe Creator',
    date: 'March 20, 2026',
    image: '/assets/blogs/casual_hobby.png'
  },
  {
    id: 3,
    title: 'Top 5 Concerts & Events in India This Month',
    excerpt: 'Looking for someone to join you at the hottest social events of the season? Discover our top picks and find your perfect crowd.',
    content: `
      India's event calendar is more vibrant than ever, and experiencing it alone is a missed opportunity. From the neon lights of electronic festivals to the soul-stirring melodies of classical concerts, we help you find your front-row partner.
      
      **Group Social Mechanics:**
      Don't want a one-on-one? Many PlusOneStar users coordinate group socials for major events. Experience the energy of a music festival with a vetted group of like-minded fans, combining safety with the unparalleled fun of collective excitement.
      
      **AI-Powerd Authenticity:**
      The "Star" in PlusOneStar stands for our commitment to realism. Our AI face-validation technology ensures that the person you are meeting for that concert is exactly who they say they are. No catfishing, no surprises—just authentic people sharing authentic moments.
      
      **Last-Minute Spontaneity:**
      Some of the best events are discovered hours before they start. Our platform is optimized for speed, allowing you to find and book a verified companion in minutes, turning a quiet evening into an unforgettable social adventure.
    `,
    category: 'Social',
    author: 'Event Editor',
    date: 'March 18, 2026',
    image: '/assets/blogs/casual_concert.png'
  }
];

import { useAuth } from '@/contexts/AuthContext';

export default function BlogsPage() {
  const { user } = useAuth();
  const { mode, theme } = useTheme();
  const [selectedPost, setSelectedPost] = useState(null);

  // Auto-scroll to top when a post is opened
  useEffect(() => {
    if (selectedPost) {
      window.scrollTo(0, 0);
      const modal = document.querySelector('[role="dialog"]');
      if (modal) modal.scrollTo(0, 0);
    }
  }, [selectedPost]);
  const isPro = mode === 'professional';
  const isDark = theme === 'dark';
  const accent = isPro ? '#2563eb' : '#f43f5e';
  const accentGrad = isPro ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#f43f5e,#e11d48)';
  const posts = isPro ? PRO_POSTS : CASUAL_POSTS;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${accent} 0%, transparent 70%)` }} />
        <div className="max-w-5xl mx-auto space-y-8 relative">
          <Badge variant="outline" className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] bg-accent/5 backdrop-blur-md" style={{ borderColor: `${accent}40`, color: accent }}>
            {isPro ? 'Executive Insights' : 'Social Guides'}
          </Badge>
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9]" style={{ fontFamily: 'var(--font-heading)' }}>
            PlusOne<span style={{ color: accent }}>{isPro ? 'Pro' : 'Star'}</span> Blog
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
            {isPro 
              ? 'Premium guides for business leaders and professional networking across India.' 
              : 'Fun, safe, and engaging social experiences. Find your perfect hobby partner.'}
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden border-border/10 group hover:shadow-2xl hover:shadow-accent/5 transition-all duration-300 bg-card/50 backdrop-blur-md">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 left-4">
                  <Badge className="font-bold py-1 px-3 shadow-lg" style={{ background: accentGrad, color: '#fff', border: 'none' }}>{post.category}</Badge>
                </div>
              </div>
              <CardHeader className="space-y-3 p-6">
                <div className="flex items-center gap-5 text-xs text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                </div>
                <CardTitle className="text-2xl leading-tight group-hover:text-accent transition-colors font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 pt-0">
                <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed">{post.excerpt}</p>
                <Button 
                  onClick={() => setSelectedPost(post)}
                  className="w-full h-11 px-6 rounded-xl font-bold gap-2 text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95" 
                  style={{ background: accentGrad, color: '#fff', border: 'none' }}
                >
                  Read Full Insight <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* READING MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-4 bg-background/95 backdrop-blur-3xl animate-in fade-in duration-300 overscroll-contain">
          <div className="w-full max-w-6xl h-full lg:h-auto lg:max-h-[92vh] bg-card lg:border lg:border-border/20 lg:shadow-2xl lg:rounded-[2.5rem] overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row-reverse animate-in zoom-in-95 duration-300 relative group">
            
            {/* STICKY CLOSE BUTTON (Mobile & Desktop) */}
            <button 
              onClick={() => setSelectedPost(null)}
              className="fixed lg:absolute top-5 right-5 z-[210] w-12 h-12 rounded-full bg-background/60 backdrop-blur-xl flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-all shadow-2xl hover:scale-110 active:scale-90 border border-border/10"
              title="Close Article"
            >
              <X className="w-6 h-6" />
            </button>

            {/* IMAGE SIDE (Right on Desktop, Top on Mobile) */}
            <div className="w-full lg:w-[55%] h-60 sm:h-80 lg:h-auto shrink-0 relative lg:border-l lg:border-border/10 overflow-hidden">
              <img src={selectedPost.image} alt="" className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent lg:hidden" />
              <div className="absolute bottom-4 left-5 right-5 space-y-1 lg:hidden">
                <Badge className="px-2 py-0.5 text-[8px] font-bold" style={{ background: accentGrad, color: '#fff', border: 'none' }}>{selectedPost.category}</Badge>
                <h2 className="text-xl font-black text-white tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>{selectedPost.title}</h2>
              </div>
            </div>
                {/* CONTENT SIDE (Left on Desktop, Bottom on Mobile) */}
            <div className="flex-1 lg:overflow-y-auto p-6 sm:p-10 lg:p-16 scrollbar-hide bg-card">
              <div className="max-w-3xl mx-auto">
                <div className="hidden lg:block space-y-4 mb-8">
                  <Badge className="px-4 py-1.5 font-bold" style={{ background: accentGrad, color: '#fff', border: 'none' }}>{selectedPost.category}</Badge>
                  <h2 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter leading-[1.1]" style={{ fontFamily: 'var(--font-heading)' }}>{selectedPost.title}</h2>
                  <div className="flex items-center gap-6 text-xs text-muted-foreground font-semibold pt-2">
                    <span className="flex items-center gap-2"><User className="w-4 h-4" /> {selectedPost.author}</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedPost.date}</span>
                  </div>
                </div>
                
                <div className="prose prose-sm lg:prose-lg dark:prose-invert max-w-none">
                  {selectedPost.content.trim().split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-snug sm:leading-relaxed mb-4 sm:mb-8 opacity-90 font-medium">
                      {para.split('**').map((item, index) => 
                        index % 2 === 1 ? <strong key={index} className="font-black" style={{ color: accent }}>{item}</strong> : item
                      )}
                    </p>
                  ))}
                </div>

                {!user && (
                   <div className="mt-8 sm:mt-16 p-5 sm:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] bg-accent/5 border border-accent/10 space-y-4 sm:space-y-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 blur-2xl rounded-full -mr-12 -mt-12" />
                     <h3 className="text-base sm:text-2xl font-black flex items-center gap-2 relative z-10" style={{ color: accent }}>
                       <Shield className="w-5 h-5 sm:w-7 sm:h-7" /> Experience PlusOneStar
                     </h3>
                     <p className="text-[11px] sm:text-base text-muted-foreground relative z-10 font-medium leading-normal">Join our community of thousands for a safe, premium social experience tailored to your lifestyle.</p>
                     <Link to="/auth" className="relative z-10 block">
                       <Button size="lg" className="h-11 sm:h-14 px-8 sm:px-10 font-black text-xs sm:text-base rounded-xl sm:rounded-2xl shadow-xl hover:shadow-accent/20 transition-all w-full sm:w-auto" style={{ background: accentGrad, color: '#fff' }}>
                         Join Now & Get Started <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                       </Button>
                     </Link>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter / CTA */}
      {!user && (
        <section className="py-24 px-4 font-heading">
          <div className="max-w-5xl mx-auto rounded-[3rem] p-12 text-center space-y-10 relative overflow-hidden border border-border/10 shadow-3xl shadow-accent/5" 
               style={{ background: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.7)' }}>
            <div className="space-y-4 relative z-10">
              <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Stay Informed & <span style={{ color: accent }}>Secure</span></h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium">Join 10k+ subscribers getting weekly event safety guides and companion insights.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto relative z-10">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-6 h-14 rounded-2xl bg-background border-2 border-border/20 focus:outline-none focus:ring-2 transition-all" 
                style={{ ringColor: accent }} 
              />
              <Button className="h-14 font-black px-10 rounded-2xl btn-glow shadow-xl" style={{ background: accentGrad, color: '#fff' }}>Join Newsletter</Button>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
