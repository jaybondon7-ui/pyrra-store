// Pyrra SMP store settings. This is the only file you need to edit.
window.PYRRA_CFG = {
  // Tebex Headless "Public Token" (creator.tebex.io > Integrations > API Keys).
  // It is made to be public, so it is fine in this file. Empty = demo mode with sample data.
  token: '',

  // Discord invite link for the top bar and footer. Empty hides the Discord buttons.
  discord: '',

  // Extra info for Tebex packages, by package id: our description file, card colour, badge, fallback picture.
  packages: {
    7799254: { desc: 'key_rare', color: '#3aa0ff', img: 'images/rare_key.png' },
    7799259: { desc: 'key_epic', color: '#b066ff', img: 'images/epic_key.png' },
    7799264: { desc: 'key_legendary', color: '#ffc425', img: 'images/legendary_key.png', badge: 'Popular' },
    7799268: { desc: 'key_mythic', color: '#ff4fd8', img: 'images/mythic_key.png' },
  },

  // Packages not listed above are matched by a word in their name (first match wins).
  byName: {
    'rare key': { desc: 'key_rare', color: '#3aa0ff', img: 'images/rare_key.png' },
    'epic key': { desc: 'key_epic', color: '#b066ff', img: 'images/epic_key.png' },
    'legendary key': { desc: 'key_legendary', color: '#ffc425', img: 'images/legendary_key.png', badge: 'Popular' },
    'mythic key': { desc: 'key_mythic', color: '#ff4fd8', img: 'images/mythic_key.png' },
    'spark': { desc: 'rank_spark', color: '#e9eef5', img: 'images/ranks/spark.png' },
    'ember': { desc: 'rank_ember', color: '#ffe14d', img: 'images/ranks/ember.png' },
    'flame': { desc: 'rank_flame', color: '#ff9a1f', img: 'images/ranks/flame.png' },
    'blaze': { desc: 'rank_blaze', color: '#ff3b3b', img: 'images/ranks/blaze.png' },
    'magma': { desc: 'rank_magma', color: '#ff6a2a', img: 'images/ranks/magma.png' },
    'inferno': { desc: 'rank_inferno', color: '#c06bff', img: 'images/ranks/inferno.png' },
    'phoenix': { desc: 'rank_phoenix', color: '#ff4fd8', img: 'images/ranks/phoenix.png', badge: 'Popular' },
    'pyrra': { desc: 'rank_pyrra', color: '#4fd8ff', img: 'images/ranks/pyrra.png', badge: 'Best value' },
  },
};
