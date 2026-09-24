// Google Tag Manager - single source of truth for the container ID and the
// Consent Mode v2 default (denied until the visitor accepts cookies via the
// consent banner - see consent.js). Every page loads this one file instead
// of pasting the GTM snippet inline, so the container ID only lives here.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
(function () {
  var a = 'denied', m = 'denied';
  try {
    var r = localStorage.getItem('stowflex-cookie-consent');
    if (r === 'granted') { a = m = 'granted'; }
    else if (r && r !== 'denied') {
      var c = JSON.parse(r);
      a = c.analytics ? 'granted' : 'denied';
      m = c.marketing ? 'granted' : 'denied';
    }
  } catch (e) {}
  gtag('consent', 'default', { analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m, wait_for_update: 500 });
})();
(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-WBTT66WN');
