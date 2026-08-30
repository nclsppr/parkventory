UPDATE organization_branding
SET
  action_fill = '#0D92D2',
  on_action = '#030504',
  available_fill = '#E31C79',
  on_available = '#030504',
  highlight = '#E31C79',
  dark_action_ink = '#0D92D2',
  dark_available_ink = '#E31C79',
  light_action_ink = '#00537F',
  light_available_ink = '#C31465',
  updated_at = unixepoch()
WHERE normalized_domain = 'victorbuckservices.com';
