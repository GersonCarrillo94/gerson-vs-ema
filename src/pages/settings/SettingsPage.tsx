import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { updateProfile, fetchCurrentProfile } from '@/features/auth/services/authService';
import {
  searchPartner,
  linkPartner,
  type PartnerSearchResult,
  type SearchMethod,
} from '@/features/auth/services/partnerService';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const METHODS: { key: SearchMethod; label: string; placeholder: string; icon: string }[] = [
  { key: 'name',  label: 'Nombre',   placeholder: 'Buscar por nombre de usuario…',    icon: '👤' },
  { key: 'email', label: 'Email',    placeholder: 'Buscar por correo electrónico…',   icon: '✉️' },
  { key: 'phone', label: 'Teléfono', placeholder: 'Número exacto (ej. +521234567890)', icon: '📱' },
];

const LANG_LABEL: Record<string, string> = {
  english: 'Aprende inglés 🇺🇸',
  spanish: 'Aprende español 🇲🇽',
};

// ── Sección: perfil ──────────────────────────────────────────────────────────

function ProfileSection() {
  const { user } = useAuth();
  const { setUser } = useAuthStore();

  const [name, setName]           = useState(user?.display_name ?? '');
  const [phone, setPhone]         = useState(user?.phone ?? '');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Sync cuando el user del store cambia (ej. después de vincular)
  useEffect(() => {
    setName(user?.display_name ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.display_name, user?.phone]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const updated = await updateProfile({
        display_name: name.trim() || undefined,
        phone: phone.trim() || null,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => { setSaved(false); }, 2500);
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    name.trim() !== (user?.display_name ?? '') ||
    phone.trim() !== (user?.phone ?? '');

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Perfil</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de usuario
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-gerson focus:outline-none focus:ring-2 focus:ring-brand-gerson/30 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de teléfono
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              (para que tu compañero te encuentre)
            </span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); }}
            placeholder="+521234567890"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-gerson focus:outline-none focus:ring-2 focus:ring-brand-gerson/30 transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={() => void handleSave()}
          isLoading={saving}
          disabled={!dirty || saving}
          size="sm"
        >
          {saved ? '✓ Guardado' : 'Guardar cambios'}
        </Button>
        <p className="text-xs text-gray-400">{user?.email}</p>
      </div>
    </section>
  );
}

// ── Sección: buscar compañero ────────────────────────────────────────────────

function PartnerSearchSection() {
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const [method, setMethod]           = useState<SearchMethod>('name');
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<PartnerSearchResult[]>([]);
  const [searched, setSearched]       = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [linkingId, setLinkingId]     = useState<string | null>(null);
  const [linkError, setLinkError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setSearchError('No se pudo realizar la búsqueda. Intenta de nuevo.');
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
      setLinkError(err instanceof Error ? err.message : 'Error al vincular. Intenta de nuevo.');
      setLinkingId(null);
    }
  }

  // Si ya tiene compañero mostrar info del vínculo
  if (user?.partner_id) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Compañero vinculado</h2>
        <p className="text-sm text-gray-500">
          Ya tienes un compañero asignado. Si necesitas cambiar, contacta al administrador por
          ahora (función de desvincular próximamente).
        </p>
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
          <span className="text-emerald-600">✓</span>
          <span className="text-sm font-medium text-emerald-800">Vínculo activo</span>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Buscar compañero</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Encuentra a la persona con quien quieres aprender y compite.
        </p>
      </div>

      {/* Tabs de método */}
      <div className="flex gap-2">
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

      {/* Input + botón */}
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
          size="sm"
          className="shrink-0"
        >
          Buscar
        </Button>
      </div>

      {/* Resultados */}
      <div className="space-y-3">
        {isSearching && (
          <div className="flex justify-center py-6">
            <Spinner size="md" />
          </div>
        )}

        {!isSearching && searchError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{searchError}</p>
        )}

        {!isSearching && searched && results.length === 0 && !searchError && (
          <div className="rounded-lg bg-gray-50 px-4 py-5 text-center">
            <p className="text-sm text-gray-500">No se encontraron usuarios disponibles.</p>
            <p className="mt-1 text-xs text-gray-400">Solo aparecen usuarios sin compañero asignado.</p>
          </div>
        )}

        {results.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gerson/15 text-sm font-bold text-brand-gerson">
              {r.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{r.display_name}</p>
              <p className="text-xs text-gray-400">{LANG_LABEL[r.language_learning] ?? r.language_learning}</p>
            </div>
            <Button
              size="sm"
              onClick={() => void handleLink(r)}
              isLoading={linkingId === r.id}
              disabled={linkingId !== null}
              className="shrink-0"
            >
              Vincular
            </Button>
          </div>
        ))}

        {linkError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{linkError}</p>
        )}
      </div>
    </section>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">Administra tu perfil y tu vínculo de compañero.</p>
      </div>

      <ProfileSection />
      <PartnerSearchSection />
    </div>
  );
}
