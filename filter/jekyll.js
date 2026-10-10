import he from "he";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * @param {unknown} input
 * @returns {Date}
 */
const normalizeDate = (input) => {
  if (!(input instanceof Date)) {
    return new Date(/** @type {any} */ (input));
  }
  return input;
};

/** Jekyll-compatible Liquid filters. */
export const jekyllFilters = {
  date_to_string(/** @type {unknown} */ input) {
    const date = normalizeDate(input);
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m.substr(0, 3)} ${y}`;
  },

  date_to_long_string(/** @type {unknown} */ input) {
    const date = normalizeDate(input);
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  },

  date_to_rfc822(/** @type {unknown} */ input) {
    const date = normalizeDate(input);
    return date.toUTCString();
  },

  date_to_xmlschema(/** @type {unknown} */ input) {
    const date = normalizeDate(input);
    return date.toISOString();
  },

  number_of_words(/** @type {string | undefined} */ input) {
    if (!input) {
      return input;
    }
    let replaced = input;
    replaced = replaced.replace(/(^\s*)|(\s*$)/gi, "");
    replaced = replaced.replace(/[ ]{2,}/gi, " ");
    replaced = replaced.replace(/\n /, "\n");
    return replaced.split(" ").length;
  },

  strip_html(/** @type {string | undefined} */ input) {
    if (!input) {
      return input;
    }
    const regexp = /<[^>]*>/g;
    return input.replace(regexp, "");
  },

  xml_escape(/** @type {string} */ input) {
    return he.encode(input);
  },
};
