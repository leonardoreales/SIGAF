import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const styles = `
  .glass-card {
    backdrop-filter: blur(25px) saturate(180%);
    -webkit-backdrop-filter: blur(25px) saturate(180%);
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-card-in {
    animation: card-in 1s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .brand-logo {
    transform: perspective(1200px) translateZ(0);
    transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .brand-logo:hover {
    transform: perspective(1200px) translateZ(0) scale(1.03);
  }
`

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

const goldLabel: React.CSSProperties = {
  backgroundImage: 'linear-gradient(90deg, #C8922A 0%, #F5C842 50%, #C8922A 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export default function LoginPage() {
  const { user, isLoading, error, login } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user) navigate('/dashboard', { replace: true })
  }, [user, isLoading, navigate])

  async function handleSuccess(cred: CredentialResponse) {
    if (!cred.credential) return
    try {
      await login(cred.credential)
      navigate('/dashboard', { replace: true })
    } catch {
      /* error is handled in AuthContext */
    }
  }

  const navyBase = '#0D1B4A'
  const navyDeep = '#060E28'
  const leftBg = `linear-gradient(165deg, ${navyBase} 0%, ${navyDeep} 100%)`
  const rightBg = isDark ? navyDeep : '#F8F9FA'
  const sigafGradient = 'linear-gradient(165deg, #FFFFFF 0%, #E0E0E0 50%, #BDBDBD 100%)'

  return (
    <div
      className="relative min-h-screen flex overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: isDark ? navyBase : '#FFFFFF' }}
    >
      <style>{styles}</style>

      <button
        onClick={toggle}
        className="fixed top-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl"
        style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          color: '#D4AF37',
          backdropFilter: 'blur(12px)',
        }}
        aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        type="button"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div
        className="hidden lg:flex lg:w-[58%] flex-col justify-center items-center relative overflow-hidden transition-all duration-1000"
        style={{ background: leftBg }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-navyAccent/40 blur-[100px]" />
        </div>

        <div className="flex flex-col items-center gap-12 max-w-3xl px-16 text-center relative z-10">
          <div className="relative group brand-logo w-full max-w-[620px]">
            <img
              src="/logo-americana-completo.png"
              alt="Americana Corporación Universitaria"
              className="w-full h-auto object-contain relative z-10"
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative w-48 h-[2px] my-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
            </div>

            <div className="flex flex-col items-center gap-4">
              <p
                className="font-syne font-black leading-none"
                style={{
                  fontSize: '4.5rem',
                  letterSpacing: '-0.06em',
                  backgroundImage: sigafGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))',
                }}
              >
                SIGAF
              </p>
              <div className="flex items-center gap-6">
                <div className="h-[1px] w-8 bg-gold/30" />
                <p className="font-mono text-[13px] tracking-[0.5em] uppercase font-semibold text-white/40">
                  Gestión de Activos Fijos
                </p>
                <div className="h-[1px] w-8 bg-gold/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-16 inset-x-0">
          <div className="flex items-center justify-center gap-10">
            {['Medellín', 'Barranquilla', 'Bogotá'].map((city, i) => (
              <div key={city} className="flex items-center gap-10">
                <p className="font-mono text-[11px] tracking-[0.5em] uppercase text-white/30 hover:text-gold transition-colors cursor-default">
                  {city}
                </p>
                {i < 2 && <div className="w-1.5 h-1.5 rounded-full bg-gold/30" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center p-12 relative transition-all duration-1000"
        style={{ backgroundColor: rightBg }}
      >
        <div className="w-full max-w-[460px] animate-card-in relative z-10">
          <div className="flex lg:hidden flex-col items-center gap-6 mb-14 text-center">
            <img
              src="/logo-americana-completo.png"
              alt="Americana Corporación Universitaria"
              className="w-full max-w-[320px] h-auto object-contain brand-logo"
            />
            <p className="font-mono text-[12px] tracking-[0.3em] uppercase opacity-40">
              Gestión de Activos Fijos
            </p>
          </div>

          <div
            className="glass-card relative overflow-hidden rounded-[3.5rem] transition-all duration-500"
            style={{
              background: isDark ? 'rgba(0, 13, 26, 0.8)' : 'rgba(255, 255, 255, 0.95)',
              border: isDark ? '1px solid rgba(212, 175, 55, 0.15)' : '1px solid rgba(0, 26, 51, 0.08)',
              boxShadow: isDark
                ? '0 50px 100px -20px rgba(0, 0, 0, 1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 30px 60px -15px rgba(0, 26, 51, 0.15)',
            }}
          >
            <div className="absolute top-0 inset-x-20 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-100" />

            <div className="px-14 py-16">
              <div className="mb-14 text-center">
                <h2 className="font-syne font-bold text-5xl tracking-tight mb-5" style={{ color: isDark ? '#FFFFFF' : navyBase }}>
                  Bienvenido
                </h2>
                <p className="text-[17px] opacity-50 leading-relaxed max-w-[280px] mx-auto" style={{ color: isDark ? '#FFFFFF' : navyBase }}>
                  Acceda con su identidad institucional corporativa
                </p>
                <div className="mt-8 inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-gold/10 border border-gold/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                  <span className="text-[14px] font-bold tracking-[0.2em]" style={goldLabel}>
                    @americana.edu.co
                  </span>
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex justify-center transform transition-all duration-500 hover:scale-[1.05] active:scale-[0.98]">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => {}}
                    useOneTap
                    theme={isDark ? 'filled_black' : 'outline'}
                    shape="pill"
                    locale="es"
                    width="360"
                  />
                </div>

                {error && (
                  <div className="rounded-3xl p-6 bg-red-500/10 border border-red-500/20 text-center animate-bounce-short">
                    <p className="text-[12px] font-bold text-red-500 uppercase tracking-[0.3em] mb-2">
                      Error Critico
                    </p>
                    <p className="text-[15px] text-red-500/90 leading-snug">{error}</p>
                  </div>
                )}
              </div>

              <div className="mt-16 pt-10 border-t border-black/5 flex flex-col items-center gap-5">
                <div className="flex items-center gap-4 text-[12px] font-mono tracking-[0.3em] uppercase opacity-30" style={{ color: isDark ? '#FFFFFF' : navyBase }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Protocolo de Seguridad AES-256</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-12 text-[12px] font-mono tracking-[0.6em] uppercase opacity-20" style={{ color: isDark ? '#FFFFFF' : navyBase }}>
            SIGAF Enterprise v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
