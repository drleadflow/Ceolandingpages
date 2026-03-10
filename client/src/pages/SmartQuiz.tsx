import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Lightbulb, Loader2, TrendingUp, Zap, Target, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import { EnhancedProgressBar } from "@/components/EnhancedProgressBar";
import { ExitIntentModal } from "@/components/ExitIntentModal";
import { SocialProof } from "@/components/SocialProof";
import { ConfidenceSlider } from "@/components/ConfidenceSlider";
import { usePixelTracking } from "@/hooks/usePixelTracking";

type QuestionType = "text" | "buttons" | "lesson" | "insight" | "confidence";

interface Question {
  id: number;
  type: QuestionType;
  question?: string;
  placeholder?: string;
  helperText?: string;
  field?: string;
  options?: string[];
  multiSelect?: boolean;
  lessonTitle?: string;
  lessonContent?: string[];
  lessonStat?: string;
  optional?: boolean;
  insightTitle?: string;
  insightContent?: string;
  insightIcon?: "lightbulb" | "zap" | "trending" | "target" | "award";
  insightImage?: string;
  skipIf?: (data: Record<string, string>) => boolean;
}

const questions: Question[] = [
  // Q0: Welcome Screen
  {
    id: 0,
    type: "lesson",
    lessonTitle: "Get Your Free Scaling Roadmap",
    lessonContent: [
      "In the next 3 minutes, you'll get:",
      "✓ Your personalized CEO Scaling Roadmap",
      "✓ 4 bonus playbooks (Offer, Ads, Instagram, Lead Gen)",
      "✓ Your biggest growth bottleneck diagnosis",
      "✓ Exactly which systems to build first",
      "",
      "5,000+ health professionals have already requested their roadmap.",
      "",
      "No credit card required. Just honest answers."
    ],
    lessonStat: "Takes under 3 minutes"
  },

  // Q1: First Name
  {
    id: 1,
    type: "text",
    question: "What's your first name?",
    placeholder: "e.g., Sarah",
    field: "firstName",
    skipIf: (data) => !!data.firstName,
  },

  // Q2: Biggest Frustration (MOVED FROM Q19 - EMOTIONAL HOOK EARLY!) - MULTI-SELECT
  {
    id: 2,
    type: "buttons",
    question: "What's your biggest frustration or roadblock right now?",
    helperText: "Select all that apply",
    field: "biggestFrustration",
    multiSelect: true,
    options: [
      "Not enough leads coming in",
      "Leads aren't converting to bookings",
      "Too many no-shows/cancellations",
      "Can't scale past current revenue",
      "Don't know what marketing actually works",
      "Spending on ads with no ROI",
      "No time to create content",
      "Doing everything myself",
    ],
  },

  // Q3: Business Name
  { 
    id: 3, 
    type: "text", 
    question: "What's your business called?", 
    placeholder: "e.g., Radiance Med Spa", 
    field: "businessName" 
  },

  // Q4: Business Type (BUTTONS)
  {
    id: 4,
    type: "buttons",
    question: "What type of practice do you run?",
    field: "businessType",
    options: ["IV Hydration", "Med Spa", "Dental Clinic", "Chiropractic", "Physical Therapy", "Aesthetic Clinic", "Other"],
  },

  // Q5: Monthly Revenue (BUTTONS)
  {
    id: 5,
    type: "buttons",
    question: "What's your current monthly revenue?",
    field: "monthlyRevenue",
    options: ["$0-$5K", "$5K-$20K", "$20K-$50K", "$50K-$100K", "$100K+"],
  },

  // Q6: EMAIL (EARLY CAPTURE - Hormozi strategy)
  {
    id: 6,
    type: "text",
    question: "Where should I send your roadmap?",
    placeholder: "your@email.com",
    helperText: "I'll send your personalized roadmap here",
    field: "email",
    skipIf: (data) => !!data.email,
  },

  // Q7: Main Offer & Differentiation (COMBINED)
  { 
    id: 8, 
    type: "text", 
    question: "What's your main offer and what makes you different?", 
    placeholder: 'e.g., "6-month skin transformation ($5K) - we use regenerative peptides instead of just Botox"', 
    helperText: "Include your price and what sets you apart from competitors",
    field: "mainOffer" 
  },

  // Q7.5: Offer Confidence (BUTTONS - Mobile Friendly)
  {
    id: 8.5,
    type: "buttons",
    question: "How confident are you that your offer is clearly communicated and compelling?",
    field: "offerConfidence",
    options: [
      "Not confident",
      "Somewhat confident",
      "Very confident"
    ]
  },

  // INSIGHT: The Value Equation (after Offer Confidence)
  {
    id: 8.6,
    type: "insight",
    insightTitle: "The Architecture of Infinite Value",
    insightContent: "The most irresistible offers maximize the dream outcome and perceived likelihood of achievement, while minimizing time delay and effort required. This is how top health pros charge 3-5x more than competitors.",
    insightIcon: "zap",
    insightImage: "/offer-optimization.png",
  },

  // Q8: CRM Usage (BUTTONS) - Skip if revenue is very low
  {
    id: 9,
    type: "buttons",
    question: "Are you using a CRM?",
    field: "crmUsage",
    options: ["Yes (use it daily)", "Yes (barely touch it)", "No (manual tracking)", "No (nothing tracked)"],
    skipIf: (data) => data.monthlyRevenue === "$0-$5K"
  },

  // Q9: Lead Response Speed (BUTTONS)
  {
    id: 10,
    type: "buttons",
    question: "How fast do you respond to new leads?",
    field: "leadResponseSpeed",
    options: ["Within 5 minutes", "Within 1 hour", "Within 24 hours", "Whenever I can"],
  },

  // MICRO-INSIGHT #2: After Lead Response (Response Time Benchmark)
  {
    id: 11,
    type: "insight",
    insightTitle: "Response Time Matters More Than You Think",
    insightContent: "Harvard Business Review found that leads contacted within 5 minutes are 100x more likely to convert. If you're responding slower than that, you're leaving serious money on the table. We'll show you how to fix this.",
    insightIcon: "zap"
  },

  // Q10: Missed Leads (BUTTONS)
  {
    id: 12,
    type: "buttons",
    question: "What % of leads do you miss due to slow/no response?",
    field: "missedLeads",
    options: ["0-10%", "10-25%", "25-50%", "50%+", "I don't know"],
  },

  // Q11: Chat Agents (BUTTONS)
  {
    id: 13,
    type: "buttons",
    question: "Do you have AI chat agents handling inquiries?",
    field: "chatAgents",
    options: ["Yes (website + social)", "Yes (website only)", "No (manual responses)", "No (no chat at all)"],
  },

  // LESSON 1: The After-Hours Advantage
  {
    id: 14,
    type: "lesson",
    lessonTitle: "The after-hours advantage",
    lessonStat: "60% of leads come after hours—your competitors aren't sleeping",
    lessonContent: [
      "Harvard Business Review found that leads contacted within 5 minutes are 100x more likely to convert than those contacted after 30 minutes.",
      "The practices dominating your market have AI assistants that:",
      "• Respond to leads in under 60 seconds (even at 2 AM)",
      "• Book appointments without human intervention",
      "• Send automated reminders that cut no-shows by 70%",
      "While you're asleep, they're booking your patients.",
    ],
  },

  // Q12: Content Frequency (BUTTONS)
  {
    id: 15,
    type: "buttons",
    question: "How often do you post on social media?",
    field: "contentFrequency",
    options: ["Daily", "3-5x/week", "1-2x/week", "Rarely", "Never"],
  },

  // Q13: Audience Size (BUTTONS)
  {
    id: 16,
    type: "buttons",
    question: "What's your total audience size?",
    helperText: "Instagram + Facebook + Email + YouTube combined",
    field: "audienceSize",
    options: ["0-500", "500-2K", "2K-5K", "5K-10K", "10K-25K", "25K+"],
  },

  // MICRO-INSIGHT #3: After Audience Size (50% MARK - FREE RESOURCE!)
  {
    id: 17,
    type: "insight",
    insightTitle: "🎁 You're Halfway There! Here's a Gift...",
    insightContent: "Practices your size that post 3-4x/week typically generate 2-3x more leads than those posting weekly. As a thank you for getting this far, you'll receive 5 Lead Response Templates That Book 40% More Calls (free) with your roadmap. Keep going...",
    insightIcon: "award"
  },

  // LESSON 2: The 15 Content Styles That Convert
  {
    id: 18,
    type: "lesson",
    lessonTitle: "Content that builds trust",
    lessonStat: "Why strategic content matters",
    lessonContent: [
      "Content is often overlooked by medical professionals, but the best content helps your perfect prospect know, like, and trust you.",
      "",
      "Some of the most popular styles include:",
      "• Patient FAQs & Myth-Busting",
      "• Before & After Transformations",
      "• Behind-the-Scenes & Day in the Life",
      "• Educational Explainers",
      "",
      "...and this is just scratching the surface.",
      "",
      "The complete content library with all 15+ proven formats will be provided in your Instagram playbook when you finish.",
    ],
  },

  // Q14: Instagram Handle
  { 
    id: 19, 
    type: "text", 
    question: "What's your Instagram handle?", 
    placeholder: "@yourhandle", 
    field: "instagramHandle" 
  },

  // INSIGHT: The 9-Second Bio Test (after Instagram handle)
  {
    id: 19.5,
    type: "insight",
    insightTitle: "The 9-Second Test That Wins or Loses a Client",
    insightContent: "Your Instagram profile is not a resume. It's a filter. If someone can't understand who you help and why in 9 seconds, they scroll. Your bio needs: Name + Niche, who you help + their pain, your method + the result, proof, and one clear CTA.",
    insightIcon: "target",
    insightImage: "/ig-profile.png",
  },

  // Q15: Monthly Ad Budget (BUTTONS)
  {
    id: 20,
    type: "buttons",
    question: "How much do you plan to invest in ads per month?",
    field: "monthlyAdBudget",
    options: ["$0 (organic only)", "$500-$1K", "$1K-$3K", "$3K-$5K", "$5K+"],
  },

  // MICRO-INSIGHT #4: After Ad Budget (Cost Per Lead Estimate) - Skip if organic only
  {
    id: 21,
    type: "insight",
    insightTitle: "Your Ad Budget Reality Check",
    insightContent: "At your revenue level with your ad budget, your cost per lead should be around $25-$45. If it's higher, something's broken (offer, targeting, or follow-up). We'll diagnose exactly what in your roadmap.",
    insightIcon: "target",
    skipIf: (data) => data.monthlyAdBudget === "$0 (organic only)"
  },

  // LESSON 3: You Don't Need an Agency - Skip if organic only
  {
    id: 22,
    type: "lesson",
    lessonTitle: "You don't need a $5K/month agency",
    lessonStat: "Ads are a high-leverage skill anyone can learn",
    skipIf: (data) => data.monthlyAdBudget === "$0 (organic only)",
    lessonContent: [
      "Here's what agencies don't tell you: Facebook ads are a SYSTEM, not magic.",
      "",
      "But here's the catch—ads only work if your business is ready:",
      "• Your offer needs to convert (fix this first)",
      "• Your lead follow-up needs to be fast (fix this second)",
      "• Your content needs to build trust (fix this third)",
      "",
      "Once those are dialed in? Running ads is just:",
      "1. Use Facebook's Creative Report to see what's working in your niche",
      "2. Model the top performers",
      "3. Test 3-5 variations",
      "4. Scale what converts",
      "",
      "Agencies charge $5K/month to do this. You can learn it in a weekend.",
      "",
      "The bottom line: Fix your bottlenecks first. Then ads become a strategic growth tool you control—not an expensive gamble you outsource.",
    ],
  },

  // Q16: 90-Day Goal
  { 
    id: 23, 
    type: "text", 
    question: "What's your primary goal for the next 90 days?", 
    placeholder: 'e.g., "Hit $50K/month"', 
    field: "ninetyDayGoal" 
  },

  // LESSON 4: The System vs. The Hustle
  {
    id: 24,
    type: "lesson",
    lessonTitle: "The fastest way to grow",
    lessonStat: "The most successful practices grow with systems, not hustle.",
    lessonContent: [
      "The fastest-growing practices all share the same foundation:",
      "• Automated lead capture that works 24/7",
      "• A clear, compelling offer that converts on sight",
      "• Content that builds trust before the first appointment",
      "• Follow-up sequences that never let a lead slip through",
      "",
      "The difference between practices that scale and those that plateau isn't effort — it's having the right systems in place.",
      "You're about to see exactly which systems YOU need to build first.",
    ],
  },

  // Q17: Phone (OPTIONAL)
  { 
    id: 25, 
    type: "text", 
    question: "What's your phone number?", 
    placeholder: "(555) 123-4567", 
    helperText: "We'll text you a link to your roadmap",
    field: "phone"
  },

  // Q18: Website (OPTIONAL)
  { 
    id: 27, 
    type: "text", 
    question: "What's your website?", 
    placeholder: "https://...", 
    helperText: "(Optional) So I can see your current setup",
    field: "website",
    optional: true
  },
];

// localStorage keys
const STORAGE_KEY_PROGRESS = 'healthProCEO_quizProgress';
const STORAGE_KEY_DATA = 'healthProCEO_quizData';
const STORAGE_EXPIRY_DAYS = 7; // Progress expires after 7 days

// Helper functions for localStorage
function saveProgress(step: number, data: Record<string, string>) {
  try {
    const payload = {
      step,
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

function loadProgress(): { step: number; data: Record<string, string> } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!saved) return null;

    const payload = JSON.parse(saved);
    const age = Date.now() - payload.timestamp;
    const maxAge = STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (age > maxAge) {
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      return null;
    }

    return { step: payload.step, data: payload.data };
  } catch (e) {
    console.error('Failed to load progress:', e);
    return null;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
  } catch (e) {
    console.error('Failed to clear progress:', e);
  }
}

export default function SmartQuiz() {
  const searchParams = new URLSearchParams(window.location.search);
  const testMode = searchParams.get('test') === 'playbooks';
  
  const dummyData = {
    firstName: "Test",
    businessName: "Test Med Spa",
    businessType: "Med Spa",
    email: "test@example.com",
    monthlyRevenue: "$20K-$50K",
    mainOffer: "Botox treatments",
    crmUsage: "No (manual tracking)",
    leadResponseSpeed: "Within 24 hours",
    missedLeads: "25-50%",
    chatAgents: "No (no chat at all)",
    contentFrequency: "1-2x/week",
    audienceSize: "2K-5K",
    instagramHandle: "@testmedspa",
    monthlyAdBudget: "$1K-$3K",
    ninetyDayGoal: "Hit $50K/month",
    biggestFrustration: "Not enough leads coming in",
    phone: "555-1234",
  };
  
  // Capture URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const industryParam = urlParams.get('industry');
  const firstNameParam = urlParams.get('firstName');
  const emailParam = urlParams.get('email');

  // Load saved progress on mount
  const savedProgress = !testMode ? loadProgress() : null;

  // Build initial form data (URL params override saved progress)
  const initialFormData: Record<string, string> = {
    ...(testMode ? dummyData : savedProgress?.data || {}),
    ...(industryParam ? { industry: industryParam } : {}),
    ...(firstNameParam ? { firstName: firstNameParam } : {}),
    ...(emailParam ? { email: emailParam } : {}),
  };

  // Calculate starting step, skipping questions that are already answered
  let initialStep = testMode ? 26 : savedProgress?.step || 0;
  if (!testMode && !savedProgress) {
    while (initialStep < questions.length && questions[initialStep].skipIf?.(initialFormData)) {
      initialStep++;
    }
  }

  const { fireEvent } = usePixelTracking("quiz");

  useEffect(() => { fireEvent("page_view"); }, []);

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<Record<string, string>>(initialFormData);
  const [showResumePrompt, setShowResumePrompt] = useState(!!savedProgress && savedProgress.step > 0);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [lastAnswer, setLastAnswer] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const currentQuestion = questions[currentStep];
  const totalQuestions = questions.filter((q) => q.type !== "lesson" && q.type !== "insight").length;
  const questionNumber = questions.slice(0, currentStep + 1).filter((q) => q.type !== "lesson" && q.type !== "insight").length;
  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);

  const generateRoadmap = trpc.roadmap.generate.useMutation({
    onSuccess: (data) => {
      navigate(`/dashboard/${data.id}`);
    },
    onError: (error) => {
      console.error("Roadmap generation failed:", error);
      toast.error("Failed to generate roadmap. Please try again.");
    },
  });

  // Auto-save progress whenever step or data changes (but not during submission)
  useEffect(() => {
    if (!testMode && currentStep > 0 && !generateRoadmap.isPending) {
      saveProgress(currentStep, formData);
    }
  }, [currentStep, formData, testMode, generateRoadmap.isPending]);

  const handleNext = () => {
    // Validate input before proceeding
    if (currentQuestion.type === 'text' && currentQuestion.field) {
      const value = formData[currentQuestion.field];
      
      // Email validation
      if (currentQuestion.field === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          setValidationError('Please enter a valid email address (e.g., name@example.com)');
          return;
        }
      }
      
      // Phone validation
      if (currentQuestion.field === 'phone' && value) {
        const phoneRegex = /^[\d\s()+-]{10,}$/;
        if (!phoneRegex.test(value)) {
          setValidationError('Please enter a valid phone number (at least 10 digits)');
          return;
        }
      }
    }
    
    // Clear any validation errors
    setValidationError(null);
    
    // Trigger confetti at milestones
    if (progressPercent === 50 || progressPercent === 100) {
      confetti({
        particleCount: progressPercent === 100 ? 150 : 100,
        spread: progressPercent === 100 ? 100 : 70,
        origin: { y: 0.6 },
        colors: ['#E5C158', '#f4d88a', '#FFD700']
      });
    }

    // Smooth transition
    setIsTransitioning(true);
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        // Smart branching: find next non-skipped question
        let nextStep = currentStep + 1;
        while (nextStep < questions.length && questions[nextStep].skipIf?.(formData)) {
          nextStep++;
        }
        setCurrentStep(nextStep);
        setShowSocialProof(false);
      } else {
        // Submit the form - clear progress on successful submission
        clearProgress(); // Clear saved progress since quiz is complete
        generateRoadmap.mutate(formData as any); // Type assertion needed since formData is Record<string, string>
      }
      setIsTransitioning(false);
    }, 200);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationError) setValidationError(null);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartFresh = () => {
    clearProgress();
    setShowResumePrompt(false);
    setCurrentStep(0);
    setFormData({});
  };

  const canProceed = () => {
    if (currentQuestion.type === "lesson" || currentQuestion.type === "insight") return true;
    if (currentQuestion.optional) return true;
    if (!currentQuestion.field) return true;
    
    const value = formData[currentQuestion.field];
    if (!value) return false;
    
    // Email validation
    if (currentQuestion.field === "email") {
      const emailRegex = /^[A-Za-z0-9_+\-\.]+@[A-Za-z0-9\-\.]+\.[A-Za-z]{2,}$/;
      return emailRegex.test(value);
    }
    
    // Phone validation (US format: digits, spaces, dashes, parentheses allowed)
    if (currentQuestion.field === "phone") {
      const phoneRegex = /^[\d\s\-\(\)]+$/;
      const digitsOnly = value.replace(/\D/g, '');
      return phoneRegex.test(value) && digitsOnly.length >= 10;
    }
    
    return true;
  };

  // Get milestone for progress bar
  const getMilestone = () => {
    if (progressPercent >= 100) return "🎉 Complete! Generating your roadmap...";
    if (progressPercent >= 75) return "🔓 Almost there! Your custom strategy is ready...";
    if (progressPercent >= 50) return "🔓 Halfway! Your bottleneck analysis unlocked";
    if (progressPercent >= 25) return "🔓 Great start! Keep going...";
    return "Let's find your growth bottleneck";
  };

  const getInsightIcon = (icon?: string) => {
    switch (icon) {
      case "zap": return <Zap className="w-6 h-6" style={{ color: 'var(--titan-blue)' }} />;
      case "trending": return <TrendingUp className="w-6 h-6" style={{ color: 'var(--titan-blue)' }} />;
      case "target": return <Target className="w-6 h-6" style={{ color: 'var(--titan-blue)' }} />;
      case "award": return <Award className="w-6 h-6" style={{ color: 'var(--titan-blue)' }} />;
      default: return <Lightbulb className="w-6 h-6" style={{ color: 'var(--titan-blue)' }} />;
    }
  };

  // Multi-stage loading animation
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const LOADING_GIFS = [
    "/loading-1.gif",
    "/loading-2.gif",
    "/loading-3.gif",
    "/loading-4.gif",
    "/loading-5.gif",
  ];

  const loadingStages = [
    { text: "Diagnosing your bottlenecks...", progress: 20 },
    { text: "Analyzing your business health...", progress: 40 },
    { text: "Identifying your biggest growth levers...", progress: 60 },
    { text: "Creating your custom playbooks...", progress: 80 },
    { text: "Finalizing your roadmap...", progress: 100 },
  ];

  useEffect(() => {
    if (generateRoadmap.isPending) {
      const stageInterval = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev < loadingStages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 8000); // Change stage every 8 seconds

      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          const targetProgress = loadingStages[loadingStage]?.progress || 0;
          if (prev < targetProgress) {
            return Math.min(prev + 2, targetProgress);
          }
          return prev;
        });
      }, 100); // Smooth progress animation

      return () => {
        clearInterval(stageInterval);
        clearInterval(progressInterval);
      };
    } else {
      setLoadingStage(0);
      setLoadingProgress(0);
    }
  }, [generateRoadmap.isPending, loadingStage]);

  if (generateRoadmap.isPending) {
    const currentStage = loadingStages[loadingStage];
    const currentGif = LOADING_GIFS[loadingStage % LOADING_GIFS.length];
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--titan-background)' }}>
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <img
            src={currentGif}
            alt="Loading"
            className="mx-auto w-48 h-48 object-contain rounded-xl"
          />
          <h2 style={{ color: 'var(--titan-text-primary)', fontSize: 'var(--titan-size-h2)', fontWeight: 600 }}>
            {currentStage.text}
          </h2>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full transition-all duration-300 ease-out"
              style={{ 
                width: `${loadingProgress}%`,
                background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)'
              }}
            />
          </div>
          
          <p style={{ color: 'var(--titan-text-muted)', fontSize: 'var(--titan-size-small)' }}>
            Typically takes 30-60 seconds
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--titan-blue)' }} />
            <span style={{ color: 'var(--titan-text-muted)', fontSize: 'var(--titan-size-small)' }}>
              {loadingProgress}% complete
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--titan-background)' }}
    >
      <div className="w-full" style={{ maxWidth: '680px' }}>
        {/* Enhanced Progress Bar with Milestones */}
        {currentQuestion.type !== "lesson" && currentQuestion.type !== "insight" && (
          <div className="mb-2">
            <EnhancedProgressBar
              progressPercent={progressPercent}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
            />
            {currentStep > 0 && (
              <div className="flex justify-end mt-1">
                <button
                  onClick={handleStartFresh}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--titan-text-muted)' }}
                >
                  Start over
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resume Prompt */}
        {showResumePrompt && (
          <div 
            className="p-6 rounded-lg mb-6 border"
            style={{ 
              background: 'var(--titan-white)',
              borderColor: 'var(--titan-blue)'
            }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--titan-text-primary)' }}>
              Welcome back! Resume where you left off?
            </h3>
            <p className="mb-4" style={{ color: 'var(--titan-text-muted)', fontSize: 'var(--titan-size-body-sm)' }}>
              You were on question {questionNumber} of {totalQuestions}
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowResumePrompt(false)}
                style={{ 
                  background: 'var(--titan-blue)',
                  color: 'var(--titan-background)'
                }}
              >
                Continue
              </Button>
              <Button 
                onClick={handleStartFresh}
                variant="outline"
                style={{ 
                  borderColor: 'var(--titan-border)',
                  color: 'var(--titan-text-primary)'
                }}
              >
                Start fresh
              </Button>
            </div>
          </div>
        )}

        {/* Exit Intent Modal */}
        <ExitIntentModal 
          onContinue={() => {}} 
          progressPercent={progressPercent}
          questionsLeft={totalQuestions - questionNumber}
        />

        {/* Question Card */}
        <div 
          className="p-8 rounded-lg transition-all duration-300"
          style={{ 
            background: 'var(--titan-white)',
            opacity: isTransitioning ? 0.5 : 1,
            transform: isTransitioning ? 'translateX(-20px)' : 'translateX(0)'
          }}
        >
          {/* LESSON TYPE */}
          {currentQuestion.type === "lesson" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: 'var(--titan-blue)' }} />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--titan-text-primary)' }}>
                    {currentQuestion.lessonTitle}
                  </h2>
                  {currentQuestion.lessonStat && (
                    <p className="text-sm mb-4" style={{ color: 'var(--titan-blue)' }}>
                      {currentQuestion.lessonStat}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-3" style={{ color: 'var(--titan-text-primary)', fontSize: 'var(--titan-size-body)', lineHeight: 1.7 }}>
                {currentQuestion.lessonContent?.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                    style={{ 
                      borderColor: 'var(--titan-border)',
                      color: 'var(--titan-text-primary)',
                      padding: '12px 24px'
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  onClick={handleNext}
                  className="flex-1"
                  style={{ 
                    background: 'var(--titan-blue)',
                    color: 'var(--titan-background)',
                    padding: '12px 24px'
                  }}
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* INSIGHT TYPE (NEW!) */}
          {currentQuestion.type === "insight" && (
            <div className="space-y-6">
              <div 
                className="p-6 rounded-lg border-2"
                style={{ 
                  background: 'rgba(229, 193, 88, 0.1)',
                  borderColor: 'var(--titan-blue)'
                }}
              >
                <div className="flex items-start gap-4">
                  {getInsightIcon(currentQuestion.insightIcon)}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--titan-blue)' }}>
                      {currentQuestion.insightTitle}
                    </h3>
                    <p style={{ color: 'var(--titan-text-primary)', fontSize: 'var(--titan-size-body)', lineHeight: 1.7 }}>
                      {currentQuestion.insightContent}
                    </p>
                    {currentQuestion.insightImage && (
                      <img
                        src={currentQuestion.insightImage}
                        alt={currentQuestion.insightTitle || 'Insight'}
                        className="mt-4 w-full rounded-lg shadow-md"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                    style={{ 
                      borderColor: 'var(--titan-border)',
                      color: 'var(--titan-text-primary)',
                      padding: '12px 24px'
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  onClick={handleNext}
                  className="flex-1"
                  style={{ 
                    background: 'var(--titan-blue)',
                    color: 'var(--titan-background)',
                    padding: '12px 24px'
                  }}
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* TEXT INPUT TYPE */}
          {currentQuestion.type === "text" && (
            <div className="space-y-6">
              <div>
                <Label 
                  htmlFor={currentQuestion.field}
                  className="text-xl font-semibold mb-3 block"
                  style={{ color: 'var(--titan-text-primary)' }}
                >
                  {currentQuestion.question}
                </Label>
                {currentQuestion.helperText && (
                  <p className="text-sm mb-4" style={{ color: 'var(--titan-text-muted)' }}>
                    {currentQuestion.helperText}
                  </p>
                )}
                <Input
                  id={currentQuestion.field}
                  type={currentQuestion.field === "email" ? "email" : "text"}
                  placeholder={currentQuestion.placeholder}
                  value={formData[currentQuestion.field!] || ""}
                  onChange={(e) => handleInputChange(currentQuestion.field!, e.target.value)}
                  className="text-lg p-4"
                  style={{ 
                    background: 'var(--titan-background)',
                    borderColor: validationError ? '#ef4444' : 'var(--titan-border)',
                    color: 'var(--titan-text-primary)'
                  }}
                />
                {validationError && (
                  <p className="text-sm mt-2" style={{ color: '#ef4444' }}>
                    {validationError}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button 
                    onClick={handleBack}
                    variant="outline"
                    style={{ 
                      borderColor: 'var(--titan-border)',
                      color: 'var(--titan-text-primary)'
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1"
                  style={{ 
                    background: canProceed() ? 'var(--titan-blue)' : 'var(--titan-border)',
                    color: canProceed() ? 'var(--titan-background)' : 'var(--titan-text-muted)',
                    padding: '12px 24px'
                  }}
                >
                  {currentStep === questions.length - 1 ? "Generate Roadmap" : "Continue"} 
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* CONFIDENCE SLIDER TYPE */}
          {currentQuestion.type === "confidence" && (
            <div className="space-y-6">
              <ConfidenceSlider
                question={currentQuestion.question!}
                value={parseInt(formData[currentQuestion.field!] || "50")}
                onChange={(value) => handleInputChange(currentQuestion.field!, value.toString())}
              />
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button 
                    onClick={handleBack}
                    variant="outline"
                    style={{ 
                      borderColor: 'var(--titan-border)',
                      color: 'var(--titan-text-primary)'
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  onClick={handleNext}
                  className="flex-1"
                  style={{ 
                    background: 'var(--titan-blue)',
                    color: 'var(--titan-background)',
                    padding: '12px 24px'
                  }}
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* BUTTONS TYPE */}
          {currentQuestion.type === "buttons" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--titan-text-primary)' }}>
                  {currentQuestion.question}
                </h2>
                {currentQuestion.helperText && (
                  <p className="text-sm mb-4" style={{ color: 'var(--titan-text-muted)' }}>
                    {currentQuestion.helperText}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                {currentQuestion.options?.map((option) => {
                  const isSelected = currentQuestion.multiSelect
                    ? formData[currentQuestion.field!]?.includes(option)
                    : formData[currentQuestion.field!] === option;

                  return (
                    <button
                      key={option}
                      onClick={() => {
                        if (currentQuestion.multiSelect) {
                          const current = formData[currentQuestion.field!]?.split(",").filter(Boolean) || [];
                          const updated = current.includes(option)
                            ? current.filter((o) => o !== option)
                            : [...current, option];
                          handleInputChange(currentQuestion.field!, updated.join(","));
                        } else {
                          handleInputChange(currentQuestion.field!, option);
                        }
                      }}
                      className="p-4 rounded-lg text-left transition-all duration-200 border-2 flex items-center gap-3 hover:scale-[1.02] hover:shadow-lg"
                      style={{
                        background: isSelected ? 'rgba(229, 193, 88, 0.1)' : 'var(--titan-background)',
                        borderColor: isSelected ? 'var(--titan-blue)' : 'var(--titan-border)',
                        color: isSelected ? 'var(--titan-blue)' : 'var(--titan-text-primary)',
                        boxShadow: isSelected ? '0 0 20px rgba(229, 193, 88, 0.3)' : 'none'
                      }}
                    >
                      {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--titan-blue)' }} />}
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Social Proof */}
              {showSocialProof && lastAnswer && (
                <SocialProof 
                  selectedOption={lastAnswer}
                  questionType={currentQuestion.field || ""}
                />
              )}
              
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button 
                    onClick={handleBack}
                    variant="outline"
                    style={{ 
                      borderColor: 'var(--titan-border)',
                      color: 'var(--titan-text-primary)'
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1"
                  style={{ 
                    background: canProceed() ? 'var(--titan-blue)' : 'var(--titan-border)',
                    color: canProceed() ? 'var(--titan-background)' : 'var(--titan-text-muted)',
                    padding: '12px 24px'
                  }}
                >
                  {currentStep === questions.length - 1 ? "Generate Roadmap" : "Continue"} 
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
