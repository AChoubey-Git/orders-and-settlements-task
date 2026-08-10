import { useTheme } from '../lib/theme';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      id="theme-switcher-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme.name === 'dark' ? 'Light' : 'Dark'} Mode`}
      style={{
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border)',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '18px',
        color: 'var(--text-main)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--dropdown-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--input-bg)')}
    >
      <div 
        style={{ 
          transform: theme.name === 'dark' ? 'scale(1)' : 'scale(1)', 
          transition: 'transform 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {theme.name === 'dark' ? '🌙' : '☀️'}
      </div>
    </button>
  );
}
