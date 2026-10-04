/**
 * Helper utilities for subscription and paywall access checks.
 */

/**
 * Determines whether a user has an active, valid VIP subscription.
 *
 * A subscription is considered active if:
 * 1. user object is valid
 * 2. user.isPremium is true
 * 3. user.subscriptionStatus is 'active' (or absent for lifetime VIP)
 * 4. user.subscriptionExpiresAt is not in the past (null/empty means lifetime)
 *
 * @param {object|null} user - The user object from auth store or API
 * @returns {boolean} True if the user currently has an active subscription
 */
export const checkHasActiveSubscription = (user) => {
  if (!user) return false;
  if (!user.isPremium) return false;

  // If subscriptionStatus is present, it must be 'active'
  if (user.subscriptionStatus && user.subscriptionStatus !== 'active') {
    return false;
  }

  // If an expiry date is set, ensure it is still in the future
  if (user.subscriptionExpiresAt) {
    const expiryTime = new Date(user.subscriptionExpiresAt).getTime();
    if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if a user has permanently purchased a specific template.
 *
 * @param {object|null} user - The user object from auth store or API
 * @param {string|object} templateOrId - The template object or ID
 * @returns {boolean} True if the user has purchased the template for lifetime
 */
export const checkIsTemplatePurchased = (user, templateOrId) => {
  if (!user || !templateOrId) return false;
  const targetId = typeof templateOrId === 'object'
    ? String(templateOrId._id || templateOrId.id || '')
    : String(templateOrId);
  if (!targetId) return false;

  const purchased = user.purchasedTemplates || [];
  return purchased.some((item) => {
    if (!item) return false;
    const id = typeof item === 'object' ? String(item._id || item.id || '') : String(item);
    return id === targetId;
  });
};

/**
 * Determines whether a user has access to export/download a template.
 * Returns true if:
 * 1. Template is free
 * 2. Template was purchased by the user (lifetime access)
 * 3. User has an active VIP subscription
 *
 * @param {object|null} user - The user object
 * @param {object|null} template - The template object
 * @returns {boolean}
 */
export const checkCanAccessTemplate = (user, template) => {
  if (!template) return false;
  if (template.accessType === 'free') return true;
  if (checkIsTemplatePurchased(user, template)) return true;
  if (checkHasActiveSubscription(user)) return true;
  return false;
};
