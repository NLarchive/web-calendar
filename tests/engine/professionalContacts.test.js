import { describe, it, expect } from 'vitest';
import {
  normalizeProfessional,
  findProfessionalById,
  getProfessionalDisplayName,
  renderProfessionalDetailsHtml,
  buildProfessionalDescriptionText,
  renderProfessionalOptions,
} from '../../src/modules/professional/professionalContacts.js';

describe('normalizeProfessional', () => {
  it('fills defaults for missing fields', () => {
    const result = normalizeProfessional({});
    expect(result.id).toBeTruthy();
    expect(result.companyName).toBe('');
    expect(result.contactPerson).toBe('');
    expect(result.phone).toBe('');
    expect(result.whatsapp).toBe('');
    expect(result.email).toBe('');
    expect(result.website).toBe('');
    expect(result.service).toBe('');
    expect(result.address).toBe('');
    expect(result.notes).toBe('');
  });

  it('trims and preserves provided values', () => {
    const result = normalizeProfessional({
      id: 'vet-1',
      companyName: '  Reinavet  ',
      contactPerson: '  Nicolás Larenas  ',
      service: ' Veterinaria a domicilio ',
    });
    expect(result.id).toBe('vet-1');
    expect(result.companyName).toBe('Reinavet');
    expect(result.contactPerson).toBe('Nicolás Larenas');
    expect(result.service).toBe('Veterinaria a domicilio');
  });
});

describe('findProfessionalById', () => {
  const professionals = [
    { id: 'p1', companyName: 'Alpha' },
    { id: 'p2', companyName: 'Beta' },
  ];

  it('returns the matching professional', () => {
    expect(findProfessionalById(professionals, 'p2').companyName).toBe('Beta');
  });

  it('returns null for unknown id', () => {
    expect(findProfessionalById(professionals, 'p99')).toBeNull();
  });

  it('returns null when id is falsy', () => {
    expect(findProfessionalById(professionals, '')).toBeNull();
    expect(findProfessionalById(professionals, null)).toBeNull();
  });

  it('handles non-array gracefully', () => {
    expect(findProfessionalById(null, 'p1')).toBeNull();
  });
});

describe('getProfessionalDisplayName', () => {
  it('prefers company name', () => {
    expect(getProfessionalDisplayName({ companyName: 'Reinavet', contactPerson: 'Nico' })).toBe('Reinavet');
  });

  it('falls back to contact person', () => {
    expect(getProfessionalDisplayName({ companyName: '', contactPerson: 'Nico' })).toBe('Nico');
  });

  it('returns empty for null', () => {
    expect(getProfessionalDisplayName(null)).toBe('');
  });
});

describe('renderProfessionalDetailsHtml', () => {
  it('returns fallback for null professional', () => {
    const html = renderProfessionalDetailsHtml(null);
    expect(html).toContain('None assigned');
  });

  it('renders clickable links for phone/email/website/whatsapp', () => {
    const html = renderProfessionalDetailsHtml({
      companyName: 'Reinavet',
      contactPerson: 'Nicolás',
      phone: '+56912345678',
      email: 'vet@example.com',
      website: 'https://reinavet.cl',
      whatsapp: 'https://wa.me/56967555613',
      service: 'Veterinaria a domicilio',
    });
    expect(html).toContain('href="tel:+56912345678"');
    expect(html).toContain('href="mailto:vet@example.com"');
    expect(html).toContain('href="https://reinavet.cl"');
    expect(html).toContain('href="https://wa.me/56967555613"');
    expect(html).toContain('Reinavet');
    expect(html).toContain('Nicolás');
    expect(html).toContain('Veterinaria a domicilio');
  });

  it('escapes HTML in values', () => {
    const html = renderProfessionalDetailsHtml({
      companyName: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('buildProfessionalDescriptionText', () => {
  it('returns empty for null', () => {
    expect(buildProfessionalDescriptionText(null)).toBe('');
  });

  it('builds plain text with all fields', () => {
    const text = buildProfessionalDescriptionText({
      companyName: 'Reinavet',
      contactPerson: 'Nicolás',
      phone: '+569',
      whatsapp: 'https://wa.me/56967555613',
      email: 'vet@x.com',
      website: 'https://reinavet.cl',
      service: 'Vet',
      address: '123 St',
      notes: 'Note here',
    });
    expect(text).toContain('Professional Contact');
    expect(text).toContain('Company: Reinavet');
    expect(text).toContain('Contact: Nicolás');
    expect(text).toContain('WhatsApp: https://wa.me/56967555613');
    expect(text).toContain('Website: https://reinavet.cl');
  });
});

describe('renderProfessionalOptions', () => {
  it('renders None option when no professionals', () => {
    const html = renderProfessionalOptions([], null);
    expect(html).toContain('<option value=""');
    expect(html).toContain('None');
  });

  it('renders options with selected state', () => {
    const pros = [
      { id: 'p1', companyName: 'Alpha' },
      { id: 'p2', companyName: 'Beta' },
    ];
    const html = renderProfessionalOptions(pros, 'p2');
    expect(html).toContain('value="p1"');
    expect(html).toContain('value="p2"');
    expect(html).toContain('Alpha');
    expect(html).toContain('Beta');
    expect(html).toMatch(/value="p2"\s*selected/);
  });
});
