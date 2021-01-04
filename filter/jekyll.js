/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
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
  'December'
];

const normalizeDate = function(input) {
  if (!(input instanceof Date)) {
    input = new Date(input);
  }
  return input;
};

module.exports = {
  date_to_string(input) {
    input = normalizeDate(input);
    const d = input.getDate();
    const m = months[input.getMonth()];
    const y = input.getFullYear();
    return `${d} ${m.substr(0, 3)} ${y}`;
  },

  date_to_long_string(input) {
    input = normalizeDate(input);
    const d = input.getDate();
    const m = months[input.getMonth()];
    const y = input.getFullYear();
    return `${d} ${m} ${y}`;
  },

  date_to_rfc822(input) {
    input = normalizeDate(input);
    return input.toUTCString();
  },

  date_to_xmlschema(input) {
    input = normalizeDate(input);
    return input.toISOString();
  },

  number_of_words(input) {
    if (!input) { return input; }
    input = input.replace(/(^\s*)|(\s*$)/gi, '');
    input = input.replace(/[ ]{2,}/gi, ' ');
    input = input.replace(/\n /, "\n");
    return input.split(' ').length;
  },

  strip_html(input) {
    if (!input) { return input; }
    const regexp = new RegExp('<[^>]*>', 'g');
    return input.replace(regexp, '');
  },

  xml_escape(input) {
    return he.encode(input);
  }
};
