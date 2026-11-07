import { describe, expect, it } from 'vitest';
import { defaults, mergeConfig } from './config';
import fs from 'node:fs';

describe('config.json (Branding ohne Build)', () => {
  it('uebernimmt gueltige Werte', () => {
    const { config, warnings } = mergeConfig(defaults, {
      appName: 'SQL-Labor',
      theme: 'th-koeln',
      header: 'hell',
      colors: { brand: '#003366' },
      readySureShare: 0.9,
      footerLinks: [{ label: 'Impressum', href: 'https://example.org/impressum' }],
      _hinweis: 'Kommentar',
    });
    expect(warnings).toEqual([]);
    expect(config.appName).toBe('SQL-Labor');
    expect(config.colors.brand).toBe('#003366');
    expect(config.readySureShare).toBe(0.9);
    expect(config.footerLinks).toHaveLength(1);
  });

  it('ignoriert Tippfehler und falsche Typen statt abzustuerzen', () => {
    const { config, warnings } = mergeConfig(defaults, {
      appname: 'x',
      readyStreak: 'drei',
      readySureShare: 80,
      colors: { brand: 'javascript:alert(1)', farbe: '#fff' },
      footerLinks: 'kaputt',
    });
    expect(warnings.length).toBe(6);
    expect(config.appName).toBe(defaults.appName);
    expect(config.readyStreak).toBe(defaults.readyStreak);
    expect(config.readySureShare).toBe(defaults.readySureShare);
    expect(config.colors).toEqual({});
  });

  it('die mitgelieferte public/config.json ist gueltig', () => {
    const json = JSON.parse(fs.readFileSync(new URL('../public/config.json', import.meta.url), 'utf8'));
    expect(mergeConfig(defaults, json).warnings).toEqual([]);
  });
});

import { assetUrl, configToJson } from './config';

describe('config.json aus dem Design-Editor', () => {
  it('enthaelt nur Abweichungen und ist wieder einlesbar', () => {
    const { config } = mergeConfig(defaults, { appName: 'SQL-Labor', colors: { brand: '#003366' }, header: 'hell' });
    const json = JSON.parse(configToJson(config));
    expect(Object.keys(json).sort()).toEqual(['_hinweis', 'appName', 'colors', 'header']);
    expect(mergeConfig(defaults, json).config).toEqual(config);
    expect(Object.keys(JSON.parse(configToJson(defaults)))).toEqual(['_hinweis']);
  });
  it('Logo als Dateiname, Adresse oder eingebettete Datei', () => {
    expect(assetUrl('logo.svg')).toBe('brand/logo.svg');
    expect(assetUrl('data:image/svg+xml;base64,AAA')).toMatch(/^data:/);
    expect(assetUrl('https://x.de/l.png')).toBe('https://x.de/l.png');
  });
});
