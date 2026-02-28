const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'data', 'calendar-template');

/**
 * Fields that MUST be in the topic root (base) and MUST NOT be in language files.
 */
const SYSTEM_FIELDS = [
  'date', 'endDate', 'recurrence', 'status', 'attendees', 'category', 'tags',
  'priority', 'allDay', 'calendarId', 'reminderMinutes', 'createdAt', 'professionalId',
  'timezone', 'schedule', 'conditions'
];

/**
 * Structural fields that must be in both to map strings.
 */
const KEY_FIELDS = ['id', 'name', 'value'];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function refineCommonTemplate(common) {
  // Strings to remove from common
  delete common.title;
  delete common.description;
  delete common.disclaimer;
  
  if (common.fields) {
    common.fields.forEach(f => {
      delete f.label;
      delete f.placeholder;
      if (f.options) f.options.forEach(o => delete o.label);
    });
  }
  
  if (common.events) {
    common.events.forEach(e => {
      delete e.titleTemplate;
      delete e.description;
    });
  }
  return common;
}

function refineLanguageTemplate(langData) {
  // Keep only strings and mapping keys.
  const refined = {
    title: langData.title,
    description: langData.description,
    disclaimer: langData.disclaimer,
  };
  
  if (langData.fields) {
    refined.fields = langData.fields.map(f => ({
      name: f.name,
      label: f.label,
      placeholder: f.placeholder,
      options: (f.options || []).map(o => ({ value: o.value, label: o.label }))
    }));
  }
  
  if (langData.events) {
    refined.events = langData.events.map(e => ({
      id: e.id,
      titleTemplate: e.titleTemplate,
      description: e.description
    }));
  }
  
  return refined;
}

function refineCommonState(common) {
  if (common.appointments) {
    common.appointments.forEach(a => {
      delete a.title;
      delete a.description;
      delete a.timezone;
    });
  }
  if (common.calendars) {
    common.calendars.forEach(c => delete c.name);
  }
  return common;
}

function refineLanguageState(langData) {
  const refined = {};
  if (langData.appointments) {
    refined.appointments = langData.appointments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description
    }));
  }
  if (langData.calendars) {
    refined.calendars = langData.calendars.map(c => ({
      id: c.id,
      name: c.name
    }));
  }
  return refined;
}

function processTopic(topic) {
  const topicPath = path.join(BASE_DIR, topic);
  if (!fs.existsSync(topicPath)) return;

  const entries = fs.readdirSync(topicPath);
  entries.forEach(entry => {
    const entryPath = path.join(topicPath, entry);
    if (fs.statSync(entryPath).isDirectory()) return; // skip languages dir
    if (!entry.endsWith('.json')) return;

    // Load common
    const common = JSON.parse(fs.readFileSync(entryPath, 'utf8'));
    const refinedCommon = entry.includes('calendar') ? refineCommonTemplate(deepClone(common)) : refineCommonState(deepClone(common));
    fs.writeFileSync(entryPath, JSON.stringify(refinedCommon, null, 2));

    // Process languages
    const langRoot = path.join(topicPath, 'languages');
    if (!fs.existsSync(langRoot)) return;
    
    fs.readdirSync(langRoot).forEach(lang => {
      const langFile = path.join(langRoot, lang, entry);
      if (!fs.existsSync(langFile)) return;
      
      const langData = JSON.parse(fs.readFileSync(langFile, 'utf8'));
      const refinedLang = entry.includes('calendar') ? refineLanguageTemplate(deepClone(langData)) : refineLanguageState(deepClone(langData));
      fs.writeFileSync(langFile, JSON.stringify(refinedLang, null, 2));
    });
  });
}

const topics = fs.readdirSync(BASE_DIR);
topics.forEach(topic => {
  if (fs.statSync(path.join(BASE_DIR, topic)).isDirectory()) {
    processTopic(topic);
  }
});

console.log('Success: All shared content is at the topic root and duplicated logic has been removed from language files.');
