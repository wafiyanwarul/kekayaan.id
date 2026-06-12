"use client"
import { useEffect, useRef, useState } from "react"
import { Wallet, Target, Sparkles, ChevronRight } from "lucide-react"

interface OnboardingSlidesProps {
  onComplete: () => void
}

export function OnboardingSlides({ onComplete }: OnboardingSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [splashStep, setSplashStep] = useState<"loading" | "logo" | "fadeout" | "complete">("loading")

  useEffect(() => {
    // Stage 1: Loading animation (0 to 1200ms)
    const logoTimer = setTimeout(() => {
      setSplashStep("logo")
    }, 1200)

    // Stage 2: Logo reveal (1200ms to 2400ms)
    const fadeoutTimer = setTimeout(() => {
      setSplashStep("fadeout")
    }, 2400)

    // Stage 3: Fade out splash overlay (2400ms to 2800ms)
    const completeTimer = setTimeout(() => {
      setSplashStep("complete")
    }, 2800)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(fadeoutTimer)
      clearTimeout(completeTimer)
    }
  }, [])

  const slides = [
    {
      title: "Wealth Monitor",
      description: "Pantau aset, liabilitas, dan kekayaan bersih kamu dalam satu dashboard cockpit yang aman dan terintegrasi.",
      icon: Wallet,
      colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      glowClass: "from-indigo-500/10 via-transparent to-transparent",
    },
    {
      title: "Financial Pilot",
      description: "Atur target tabungan, impian keuangan, dan pantau rasio surplus arus kas bulanan secara real-time.",
      icon: Target,
      colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      glowClass: "from-purple-500/10 via-transparent to-transparent",
    },
    {
      title: "Auto Extractor",
      description: "Ekstrak PDF mutasi bank otomatis dengan AI. Keamanan terjamin tanpa menyimpan file PDF di server.",
      icon: Sparkles,
      colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      glowClass: "from-emerald-500/10 via-transparent to-transparent",
    },
  ]

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft
      const width = containerRef.current.clientWidth
      if (width > 0) {
        const index = Math.round(scrollLeft / width)
        if (index !== currentSlide) {
          setCurrentSlide(index)
        }
      }
    }
  }

  const goToSlide = (index: number) => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth
      containerRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      })
      setCurrentSlide(index)
    }
  }

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = () => {
    localStorage.setItem("kekayaan-id-onboarding-completed", "true")
    onComplete()
  }

  // Handle keyboard arrow keys for testing ease
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext()
      } else if (e.key === "ArrowLeft" && currentSlide > 0) {
        goToSlide(currentSlide - 1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentSlide])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#0f1117] text-white select-none">
      {/* Top Background Glow */}
      <div className={`absolute top-0 inset-x-0 h-80 bg-gradient-to-b ${slides[currentSlide].glowClass} blur-3xl transition-all duration-700`} />

      {/* Skip Button */}
      <div className="flex justify-end p-6 z-10">
        {currentSlide < slides.length - 1 && (
          <button
            onClick={handleFinish}
            className="text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Lewati
          </button>
        )}
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {slides.map((slide, idx) => {
          const Icon = slide.icon
          return (
            <div
              key={idx}
              className="w-full shrink-0 snap-start flex flex-col items-center justify-center px-8 text-center"
            >
              {/* Illustration Circle */}
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl border ${slide.colorClass} mb-8 shadow-2xl animate-scale-in`}>
                <Icon className="w-12 h-12" />
              </div>

              {/* Title & Description */}
              <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-white">
                {slide.title}
              </h1>
              <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                {slide.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-8 z-10 flex flex-col items-center gap-6">
        {/* Pagination Dots */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "w-6 bg-indigo-500" : "w-2 bg-slate-700 hover:bg-slate-600"
              }`}
              aria-label={`Pergi ke slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full max-w-sm py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          {currentSlide === slides.length - 1 ? (
            "Mulai Sekarang"
          ) : (
            <>
              Lanjut
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Splash Screen Overlay */}
      {splashStep !== "complete" && (
        <div
          className={`fixed inset-0 z-[110] flex flex-col items-center justify-center bg-[#0b0c14] transition-opacity duration-500 select-none ${
            splashStep === "fadeout" ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Ambient Glowing Background */}
          <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          
          <div className="relative flex flex-col items-center justify-center">
            {/* Stage 1: Geometric Loading Orbit */}
            {splashStep === "loading" && (
              <div className="relative w-20 h-20 flex items-center justify-center animate-scale-in">
                {/* Pulsing inner glow */}
                <div className="absolute inset-2 bg-indigo-500/20 rounded-full blur-md animate-ping" />
                {/* Double spinning rings */}
                <div className="absolute inset-0 border-2 border-transparent border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
                <div className="absolute inset-2 border-2 border-transparent border-b-violet-500 border-l-violet-500 rounded-full animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
              </div>
            )}

            {/* Stage 2 & 3: Logo Reveal with Neon Glow */}
            {(splashStep === "logo" || splashStep === "fadeout") && (
              <div className="flex flex-col items-center gap-5 animate-scale-in">
                {/* Glow ring behind logo */}
                <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/25 shadow-2xl shadow-indigo-500/20 animate-pulse-glow">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-md" />
                  <img
                    src="/android-chrome-192x192.png"
                    alt="kekayaan.id logo"
                    className="w-14 h-14 rounded-2xl relative z-10 animate-float"
                  />
                </div>
                
                {/* Text reveal */}
                <div className="text-center space-y-1 mt-2">
                  <h2 className="text-2xl font-extrabold tracking-widest text-white uppercase bg-gradient-to-r from-indigo-200 via-white to-violet-200 bg-clip-text text-transparent animate-fade-in">
                    kekayaan.id
                  </h2>
                  <p className="text-[10px] tracking-widest uppercase text-slate-500 font-semibold animate-fade-in-delayed">
                    Personal Wealth OS
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
