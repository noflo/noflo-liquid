months = [
  'January'
  'February'
  'March'
  'April'
  'May'
  'June'
  'July'
  'August'
  'September'
  'October'
  'November'
  'December'
]

normalizeDate = (input) ->
  unless input instanceof Date
    input = new Date input
  input

module.exports =
  date_to_string: (input) ->
    input = normalizeDate input
    d = input.getDate()
    m = months[input.getMonth()]
    y = input.getFullYear()
    "#{d} #{m.substr(0, 3)} #{y}"

  date_to_long_string: (input) ->
    input = normalizeDate input
    d = input.getDate()
    m = months[input.getMonth()]
    y = input.getFullYear()
    "#{d} #{m} #{y}"

  date_to_rfc822: (input) ->
    input = normalizeDate input
    return input.toUTCString()

  date_to_xmlschema: (input) ->
    input = normalizeDate input
    return input.toISOString()

  number_of_words: (input) ->
    return input unless input
    input = input.replace /(^\s*)|(\s*$)/gi, ''
    input = input.replace /[ ]{2,}/gi, ' '
    input = input.replace /\n /, "\n"
    input.split(' ').length

  strip_html: (input) ->
    return input unless input
    regexp = new RegExp '<[^>]*>', 'g'
    input.replace regexp, ''
