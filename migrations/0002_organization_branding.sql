CREATE TABLE organization_branding (
  normalized_domain TEXT PRIMARY KEY
    CHECK (
      normalized_domain = lower(trim(normalized_domain))
      AND length(normalized_domain) BETWEEN 3 AND 253
      AND instr(normalized_domain, '@') = 0
      AND instr(normalized_domain, ' ') = 0
    ),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  company_name TEXT NOT NULL
    CHECK (length(trim(company_name)) BETWEEN 1 AND 120),
  logo_url TEXT NOT NULL
    CHECK (
      length(logo_url) BETWEEN 2 AND 255
      AND substr(logo_url, 1, 1) = '/'
      AND substr(logo_url, 1, 2) <> '//'
      AND instr(logo_url, '?') = 0
      AND instr(logo_url, '#') = 0
      AND instr(logo_url, '\') = 0
    ),
  action_fill TEXT NOT NULL
    CHECK (
      length(action_fill) = 7
      AND substr(action_fill, 1, 1) = '#'
      AND substr(action_fill, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  on_action TEXT NOT NULL
    CHECK (
      length(on_action) = 7
      AND substr(on_action, 1, 1) = '#'
      AND substr(on_action, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  available_fill TEXT NOT NULL
    CHECK (
      length(available_fill) = 7
      AND substr(available_fill, 1, 1) = '#'
      AND substr(available_fill, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  on_available TEXT NOT NULL
    CHECK (
      length(on_available) = 7
      AND substr(on_available, 1, 1) = '#'
      AND substr(on_available, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  highlight TEXT NOT NULL
    CHECK (
      length(highlight) = 7
      AND substr(highlight, 1, 1) = '#'
      AND substr(highlight, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  dark_action_ink TEXT NOT NULL
    CHECK (
      length(dark_action_ink) = 7
      AND substr(dark_action_ink, 1, 1) = '#'
      AND substr(dark_action_ink, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  dark_available_ink TEXT NOT NULL
    CHECK (
      length(dark_available_ink) = 7
      AND substr(dark_available_ink, 1, 1) = '#'
      AND substr(dark_available_ink, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  light_action_ink TEXT NOT NULL
    CHECK (
      length(light_action_ink) = 7
      AND substr(light_action_ink, 1, 1) = '#'
      AND substr(light_action_ink, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  light_available_ink TEXT NOT NULL
    CHECK (
      length(light_available_ink) = 7
      AND substr(light_available_ink, 1, 1) = '#'
      AND substr(light_available_ink, 2) NOT GLOB '*[^0-9A-Fa-f]*'
    ),
  updated_at INTEGER NOT NULL CHECK (updated_at >= 0)
) STRICT;

INSERT INTO organization_branding (
  normalized_domain,
  enabled,
  company_name,
  logo_url,
  action_fill,
  on_action,
  available_fill,
  on_available,
  highlight,
  dark_action_ink,
  dark_available_ink,
  light_action_ink,
  light_available_ink,
  updated_at
) VALUES (
  'victorbuckservices.com',
  1,
  'Victor Buck Services',
  '/brands/victor-buck-services/logo.svg',
  '#003595',
  '#FFFFFF',
  '#01E1FF',
  '#00222A',
  '#E31C79',
  '#7FAAFF',
  '#01E1FF',
  '#003595',
  '#00616E',
  unixepoch()
);
