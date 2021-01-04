const he = require('he');

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const normalizeDate = function (input) {
  if (!(input instanceof Date)) {
    return new Date(input);
  }
  return input;
};

module.exports = {
  date_to_string(input) {
    const date = normalizeDate(input);
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m.substr(0, 3)} ${y}`;
  },

  date_to_long_string(input) {
    const date = normalizeDate(input);
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  },

  date_to_rfc822(input) {
    const date = normalizeDate(input);
    return date.toUTCString();
  },

  date_to_xmlschema(input) {
    const date = normalizeDate(input);
    return date.toISOString();
  },

  number_of_words(input) {
    if (!input) { return input; }
    let replaced = input;
    replaced = replaced.replace(/(^\s*)|(\s*$)/gi, '');
    replaced = replaced.replace(/[ ]{2,}/gi, ' ');
    replaced = replaced.replace(/\n /, '\n');
    return replaced.split(' ').length;
  },

  strip_html(input) {
    if (!input) { return input; }
    const regexp = new RegExp('<[^>]*>', 'g');
    return input.replace(regexp, '');
  },

  xml_escape(input) {
    return he.encode(input);
  },
};
