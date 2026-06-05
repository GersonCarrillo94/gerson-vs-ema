import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { fetchCurrentProfile } from '@/features/auth/services/authService';
import {
  searchPartner,
  linkPartner,
  type PartnerSearchResult,
  type SearchMethod,
} from '@/features/auth/services/partnerService';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export function LinkPartnerPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const METHODS: { key: SearchMethod; label: string; placeholder: string; icon: string }[] = [
    { key: 'name',  label: t('auth.linkPartner.methodName'),  placeholder: t('auth.linkPartner.searchByName'),  icon: '👤' },
    { key: 'email', label: t('auth.linkPartner.methodEmail'), placeholder: t('auth.linkPartner.searchByEmail'), icon: '✉️' },
    { key: 'phone', label: t('auth.linkPartner.methodPhone'), placeholder: t('auth.linkPartner.searchByPhone'), icon: '📱' },
  ];

  const LANG_LABEL: Record<string, string> = {
    english: t('auth.linkPartner.learnEnglishLabel'),
    spanish: t('auth.linkPartner.learnSpanishLabel'),
  };

  const [method, setMethod]           = useState<SearchMethod>('name');
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<PartnerSearchResult[]>([]);
  const [searched, setSearched]       = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [linkingId, setLinkingId]     = useState<string | null>(null);
  const [linkError, setLinkError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.partner_id) navigate('/', { replace: true });
  }, [user, navigate]);

  function handleMethodChange(m: SearchMethod) {
    setMethod(m);
    setQuery('');
    setResults([]);
    setSearched(false);
    setSearchError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    setSearched(false);
    try {
      const found = await searchPartner(trimmed, method);
      setResults(found);
      setSearched(true);
    } catch {
      setSearchError(t('auth.linkPartner.searchError'));
      setSearched(true);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleLink(partner: PartnerSearchResult) {
    setLinkingId(partner.id);
    setLinkError(null);
    try {
      await linkPartner(partner.id);
      const updated = await fetchCurrentProfile();
      setUser(updated);
      navigate('/', { replace: true });
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : t('auth.linkPartner.linkError'));
      setLinkingId(null);
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-brand-gerson">Gerson</span>
            <span className="mx-2 text-gray-400">vs</span>
            <span className="text-brand-ema">Ema</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">{t('common.tagline')}</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('auth.linkPartner.title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('auth.linkPartner.subtitle')}</p>
          </div>

          <div className="mb-5 flex gap-2">
            {METHODS.map((m) => (
              <button
                key={m.key}
                onClick={() => { handleMethodChange(m.key); }}
                className={[
                  'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                  method === m.key
                    ? 'bg-brand-gerson text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ].join(' ')}
              >
                <span className="mr-1">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type={method === 'email' ? 'email' : method === 'phone' ? 'tel' : 'text'}
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
              placeholder={METHODS.find((m) => m.key === method)?.placeholder}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-gerson focus:outline-none focus:ring-2 focus:ring-brand-gerson/30 transition-colors"
            />
            <Button
              onClick={() => void handleSearch()}
              isLoading={isSearching}
              disabled={!query.trim() || isSearching}
              className="shrink-0"
            >
              {t('auth.linkPartner.searchButton')}
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {isSearching && (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            )}

            {!isSearching && searchError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{searchError}</p>
            )}

            {!isSearching && searched && results.length === 0 && !searchError && (
              <div className="rounded-lg bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm text-gray-500">
                  {method === 'phone'
                    ? t('auth.linkPartner.noResultsPhone')
                    : t('auth.linkPartner.noResults')}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t('auth.linkPartner.noResultsNote')}</p>
              </div>
            )}

            {results.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gerson/15 text-sm font-bold text-brand-gerson">
                  {r.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{r.display_name}</p>
                  <p className="text-xs text-gray-400">
                    {LANG_LABEL[r.language_learning] ?? r.language_learning}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleLink(r)}
                  isLoading={linkingId === r.id}
                  disabled={linkingId !== null}
                  className="shrink-0"
                >
                  {t('auth.linkPartner.linkButton')}
                </Button>
              </div>
            ))}

            {linkError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{linkError}</p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          {t('auth.linkPartner.sessionAs')}{' '}
          <span className="font-medium text-gray-600">{user?.display_name}</span>
          {' · '}
          <button
            onClick={() => { navigate('/login'); }}
            className="text-brand-gerson hover:underline"
          >
            {t('auth.linkPartner.changeAccount')}
          </button>
        </p>
      </div>
    </div>
  );
}
