// Spiderweb — News Card UI Module (Section 3: Between-Level Story Beats)
// INCOMPLETE4-FIX: Implements the "Breaking News" story card system.
// index.html already contains the showNewsCard() function and #news-card element.
// This module provides the canonical NEWS_CARDS data and the showNewsCard API
// so it can also be imported by future modular builds.

export const NEWS_CARDS = [
  "Rooftop chaos reported downtown — witnesses describe a masked figure in navy and teal.",
  "Security firm denies any connection to last night's rooftop incident.",
  "Who is he? City records show no match for the vigilante's description.",
  "Sightings increase across the skyline — some are calling him 'Spider.'",
  "Mercenary crews spotted claiming rooftop territory. No comment from city officials.",
  "Corporate drones tagged a civilian as hostile. An unknown figure intervened.",
  "The Enforcer — Stinger's top lieutenant — was last seen on the upper east side.",
  "Night falls. The rooftops belong to someone now. The city holds its breath.",
  "Surveillance footage shows an unknown figure defeating a sniper merc. Elite level threat.",
  "Thread — a rival web-user — has been spotted moving at high speed across the skyline.",
  "A storm is coming. The city braces for impact. He's still out there.",
  "STINGER CONTAINED. Mystery vigilante confirmed responsible. City calls him: Spider."
];

/**
 * Show the between-level news card overlay.
 * @param {number} levelId - The level just completed (1-12)
 * @param {function} onContinue - Callback when user taps Continue
 */
export function showNewsCard(levelId, onContinue) {
  const cardEl = document.getElementById('news-card');
  const textEl = document.getElementById('news-text');
  const btnEl  = document.getElementById('btn-news-continue');

  if (!cardEl || !textEl || !btnEl) {
    console.warn('[Spiderweb NewsCards] Missing DOM elements for news card.');
    if (onContinue) onContinue();
    return;
  }

  const index = Math.min(levelId - 1, NEWS_CARDS.length - 1);
  textEl.textContent = NEWS_CARDS[index] || "The city never sleeps. Neither does he.";
  cardEl.style.display = 'flex';

  btnEl.onclick = () => {
    cardEl.style.display = 'none';
    if (onContinue) onContinue();
  };
}
