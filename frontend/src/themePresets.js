export const THEME_PRESETS = {
  light: {
    name: 'Light',
    description: 'Classic light theme',
    className: 'theme-light',
  },

  dark: {
    name: 'Dark',
    description: 'Dark slate theme',
    className: 'theme-dark',
  },

  oled: {
    name: 'OLED',
    description: 'Pure black OLED-friendly theme',
    className: 'theme-oled',
  },

  system: {
    name: 'System',
    description: 'Follow your device preference',
    className: 'theme-system',
  },
};

export const THEME_PRESET_KEYS = Object.keys(THEME_PRESETS);