import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import API from '../services/api';
import { AlertCircle, Loader2, Mail } from 'lucide-react';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // State for missing/private email flow
  const [promptEmail, setPromptEmail] = useState(false);
  const [email, setEmail] = useState('');
  // Signed proof of the provider identity, issued by the OAuth callback. The
  // raw githubId used to travel in the query string and be trusted on the way
  // back, which let anyone claim any identity without visiting the provider.
  const [pendingToken, setPendingToken] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const isPromptEmail = searchParams.get('prompt_email') === 'true';
    const errorParam = searchParams.get('error');

    if (errorParam) {
      navigate(`/login?error=${encodeURIComponent(errorParam)}`);
      return;
    }

    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Load user profile via Redux
      dispatch(loadUser()).then(() => {
        navigate('/dashboard');
      });
    } else if (isPromptEmail) {
      // The display name and avatar are inside the signed token now, so the
      // server reads them from the provider's own data rather than from
      // whatever the browser sends back.
      setPendingToken(searchParams.get('pendingToken') || '');
      setPromptEmail(true);
      setLoading(false);
    } else {
      // Missing required params
      navigate('/login?error=invalid_callback');
    }
  }, [searchParams, dispatch, navigate]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await API.post('/auth/oauth/register-email', {
        email,
        pendingToken,
      });

      if (res.data?.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        dispatch(loadUser()).then(() => {
          navigate('/dashboard');
        });
      } else {
        setError('Failed to finalize authentication.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. The email might be already registered.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-stone-250">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-medium tracking-wide">Completing social login connection...</p>
      </div>
    );
  }

  if (promptEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 mb-4">
              <Mail className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-stone-100 font-playfair">
              Provide Email Address
            </h3>
            <p className="text-sm text-stone-400 mt-2 leading-relaxed">
              Your GitHub account does not expose a public email address. Please enter an email to finish creating your OpenPrep AI profile.
            </p>

            <form onSubmit={handleEmailSubmit} className="w-full mt-6 space-y-4">
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="text-left">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
