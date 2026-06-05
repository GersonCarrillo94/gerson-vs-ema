import { useTranslation } from 'react-i18next';
import { updateProfile } from '@/features/auth/services/authService';
import { useAuthStore } from '@/store/authStore';

type Lang = 'es' | 'en';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { user, setUser } = useAuthStore();
  const currentRaw = i18n.language.startsWith('en') ? 'en' : 'es';
  const current: Lang = currentRaw === 'en' ? 'en' : 'es';

  async function handleChange(lang: Lang) {
    if (lang === current) return;
    await i18n.changeLanguage(lang);
    if (user) {
      try {
        const updated = await updateProfile({ preferred_language: lang });
        setUser(updated);
      } catch {
        // silent — UI already changed, will sync on next login
      }
    }
  }

  return (
    <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs font-semibold">
      {(['es', 'en'] as Lang[]).map((lang) => (
        <button
          key={lang}
          onClick={() => { void handleChange(lang); }}
          className={[
            'px-2.5 py-1 transition-colors uppercase',
            current === lang
              ? 'bg-brand-gerson text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
          ].join(' ')}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
