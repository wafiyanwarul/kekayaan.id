"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Memuat halaman verifikasi...</p>
          </div>
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  )
}

function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [timer, setTimer] = useState(60)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timer])

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto submit if all fields are filled
    const combinedOtp = newOtp.join("")
    if (combinedOtp.length === 6) {
      handleVerify(combinedOtp)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp]
      
      // If current input is empty, clear previous input and focus it
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = ""
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      } else {
        newOtp[index] = ""
        setOtp(newOtp)
      }
      setError("")
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()
    
    // Only accept numeric OTP codes of 6 digits
    if (!/^\d{6}$/.test(pastedData)) return

    const newOtp = pastedData.split("")
    setOtp(newOtp)
    
    // Focus the last input field
    inputRefs.current[5]?.focus()
    
    // Trigger verification
    handleVerify(pastedData)
  }

  const handleVerify = async (code: string) => {
    if (!email) {
      setError("Email tidak valid atau tidak ditemukan.")
      return
    }

    setLoading(true)
    setError("")
    setSuccessMsg("")

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    })

    if (verifyError) {
      setError(
        verifyError.message.includes("Token has expired")
          ? "Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode baru."
          : verifyError.message.includes("invalid") || verifyError.message.includes("does not match")
          ? "Kode OTP salah. Harap periksa kembali kode Anda."
          : verifyError.message
      )
      setLoading(false)
      // Reset OTP fields on error so user can re-type
      setOtp(new Array(6).fill(""))
      inputRefs.current[0]?.focus()
      return
    }

    // Verify success, redirect to dashboard
    window.location.href = "/dashboard"
  }

  const handleResend = async () => {
    if (!email || timer > 0 || resending) return

    setResending(true)
    setError("")
    setSuccessMsg("")

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    })

    if (resendError) {
      setError(resendError.message)
      setResending(false)
      return
    }

    setSuccessMsg("Kode OTP baru berhasil dikirim ke email kamu!")
    setTimer(60) // Reset timer to 60 seconds
    setResending(false)
    setOtp(new Array(6).fill(""))
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-md space-y-6 bg-[#131622]/40 p-8 rounded-2xl border border-[#1e2235]/60 backdrop-blur-xl">
        
        {/* Back Button */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Daftar
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Verifikasi Email Anda</h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Masukkan 6 digit kode OTP yang kami kirimkan ke email:
            <span className="block text-indigo-400 font-medium mt-1 break-all">{email || "email-kamu@domain.com"}</span>
          </p>
        </div>

        {/* Form OTP Input */}
        <div className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-[#181b2a] border border-[#232840] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            ))}
          </div>

          <button
            type="button"
            disabled={loading || otp.join("").length < 6}
            onClick={() => handleVerify(otp.join(""))}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
          >
            {loading ? "Memverifikasi..." : "Verifikasi OTP"}
          </button>

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Loading / Resend State */}
          <div className="text-center space-y-3 pt-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-2.5">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                <span>Memverifikasi kode...</span>
              </div>
            ) : (
              <div className="text-sm">
                <span className="text-slate-400">Tidak menerima kode? </span>
                {timer > 0 ? (
                  <span className="text-slate-500 font-medium">
                    Kirim ulang dalam <span className="text-indigo-400">{timer} detik</span>
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none hover:underline inline-flex items-center gap-1 transition"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Ulang OTP"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alternative Login Redirect */}
        <div className="border-t border-[#1e2235]/40 pt-5 text-center text-xs text-slate-500">
          Sudah memverifikasi akun Anda?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">
            Masuk ke aplikasi
          </Link>
        </div>
      </div>
    </div>
  )
}
