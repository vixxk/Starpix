import { StyleSheet } from 'react-native';
import { fontScale, wp, hp } from '../../utils/responsive';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topGlowOrb: {
    position: 'absolute',
    top: -hp(0.08),
    right: -wp(0.2),
    width: wp(0.9),
    height: wp(0.9),
    borderRadius: wp(0.45),
    backgroundColor: 'rgba(225, 29, 72, 0.06)',
  },
  bottomLeftGlowOrb: {
    position: 'absolute',
    bottom: -hp(0.05),
    left: -wp(0.2),
    width: wp(0.7),
    height: wp(0.7),
    borderRadius: wp(0.35),
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
  },
  bottomRightGlowOrb: {
    position: 'absolute',
    bottom: -hp(0.08),
    right: -wp(0.2),
    width: wp(0.75),
    height: wp(0.75),
    borderRadius: wp(0.375),
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },

  /* Header Bar */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.04),
    paddingBottom: hp(0.01),
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerBackBtn: {
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: fontScale(22),
    fontWeight: '900',
    color: '#EE1D24',
    letterSpacing: -0.5,
  },
  brandStar: {
    marginLeft: wp(0.005),
    marginTop: -hp(0.006),
  },
  brandTagline: {
    fontSize: fontScale(9),
    color: '#4B5563',
    fontWeight: '500',
    marginTop: -hp(0.002),
  },
  headerSkipBtn: {
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerSkipText: {
    fontSize: fontScale(13.5),
    fontWeight: '600',
    color: '#1F2937',
  },

  /* Scroll container */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(0.04),
  },

  /* Hero Section */
  heroSection: {
    flexDirection: 'row',
    marginTop: hp(0.006),
    marginBottom: hp(0.015),
    height: hp(0.355),
  },
  heroLeft: {
    flex: 1.18,
    paddingRight: wp(0.02),
    justifyContent: 'flex-start',
  },
  heroUnlockText: {
    fontSize: fontScale(23),
    fontWeight: '900',
    color: '#111827',
    lineHeight: fontScale(27),
    letterSpacing: -0.6,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroBrandText: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#EE1D24',
    lineHeight: fontScale(25),
    letterSpacing: -0.4,
  },
  heroCrown: {
    fontSize: fontScale(16),
    marginLeft: wp(0.01),
  },
  heroSubtitle: {
    fontSize: fontScale(10.5),
    color: '#4B5563',
    fontWeight: '500',
    lineHeight: fontScale(14),
    marginTop: hp(0.004),
    marginBottom: hp(0.01),
  },

  /* Checklist */
  checklist: {
    gap: hp(0.007),
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconBox: {
    width: wp(0.055),
    height: wp(0.055),
    borderRadius: wp(0.013),
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pBadge: {
    width: wp(0.042),
    height: wp(0.042),
    backgroundColor: '#EE1D24',
    borderRadius: wp(0.008),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pBadgeText: {
    color: '#FFFFFF',
    fontSize: fontScale(9),
    fontWeight: '900',
  },
  checkItemText: {
    fontSize: fontScale(10.2),
    color: '#374151',
    fontWeight: '500',
    marginLeft: wp(0.018),
    flex: 1,
    lineHeight: fontScale(13.5),
  },

  /* Right Column: Fanned Cards */
  heroRight: {
    flex: 0.95,
    position: 'relative',
    height: '100%',
  },
  posterCard: {
    position: 'absolute',
    borderRadius: wp(0.035),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(0.005) },
    shadowOpacity: 0.22,
    shadowRadius: wp(0.018),
    elevation: 6,
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },

  /* Precise positions & rotations for the 5 fanned cards */
  poster1: {
    top: 0,
    left: wp(0.04),
    width: wp(0.24),
    height: wp(0.315),
    transform: [{ rotate: '-6deg' }],
    zIndex: 1,
  },
  poster2: {
    top: hp(0.018),
    right: wp(0.01),
    width: wp(0.225),
    height: wp(0.295),
    transform: [{ rotate: '8deg' }],
    zIndex: 2,
  },
  poster3: {
    top: hp(0.095),
    left: wp(0.005),
    width: wp(0.235),
    height: wp(0.305),
    transform: [{ rotate: '-4deg' }],
    zIndex: 3,
  },
  poster4: {
    top: hp(0.125),
    right: wp(0.01),
    width: wp(0.225),
    height: wp(0.295),
    transform: [{ rotate: '6deg' }],
    zIndex: 4,
  },
  poster5: {
    top: hp(0.185),
    left: wp(0.045),
    width: wp(0.245),
    height: wp(0.315),
    transform: [{ rotate: '-3deg' }],
    zIndex: 5,
  },

  /* Plans Container (3 Cards side by side) */
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: wp(0.018),
    marginTop: hp(0.008),
  },
  planCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.035),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp(0.018),
    paddingTop: hp(0.016),
    paddingBottom: hp(0.014),
    alignItems: 'center',
    position: 'relative',
    minHeight: hp(0.24),
  },
  planCardSelected: {
    borderColor: '#EE1D24',
    borderWidth: 1.8,
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: hp(0.004) },
    shadowOpacity: 0.15,
    shadowRadius: wp(0.02),
    elevation: 4,
  },

  /* Badges */
  planBadge: {
    position: 'absolute',
    top: -hp(0.013),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(0.018),
    paddingVertical: hp(0.0035),
    borderRadius: wp(0.02),
    zIndex: 2,
  },
  popularBadge: {
    backgroundColor: '#EE1D24',
  },
  bestValueBadge: {
    backgroundColor: '#FEF08A',
  },
  activePlanBadge: {
    backgroundColor: '#16A34A',
  },
  lockedPlanBadge: {
    backgroundColor: '#6B7280',
  },
  upgradePlanBadge: {
    backgroundColor: '#D97706',
  },
  badgeIcon: {
    marginRight: wp(0.008),
  },
  badgeCrownIcon: {
    fontSize: fontScale(8.5),
    marginRight: wp(0.008),
  },
  planBadgeText: {
    fontSize: fontScale(7.8),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  popularBadgeText: {
    color: '#FFFFFF',
  },
  bestValueBadgeText: {
    color: '#854D0E',
  },
  activePlanBadgeText: {
    color: '#FFFFFF',
  },
  lockedPlanBadgeText: {
    color: '#FFFFFF',
  },
  upgradePlanBadgeText: {
    color: '#FFFFFF',
  },
  planCardActiveSub: {
    borderColor: '#16A34A',
    borderWidth: 1.8,
    backgroundColor: '#F0FDF4',
  },
  planCardDisabled: {
    opacity: 0.45,
    backgroundColor: '#F9FAFB',
  },

  /* Radio button */
  radioWrap: {
    marginBottom: hp(0.006),
  },
  radioCircle: {
    width: wp(0.046),
    height: wp(0.046),
    borderRadius: wp(0.023),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#EE1D24',
  },
  radioDot: {
    width: wp(0.024),
    height: wp(0.024),
    borderRadius: wp(0.012),
    backgroundColor: '#EE1D24',
  },

  /* Price & Period */
  planPrice: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  planPriceSelected: {
    color: '#EE1D24',
  },
  planPeriod: {
    fontSize: fontScale(9.8),
    fontWeight: '700',
    color: '#111827',
    marginTop: hp(0.002),
    textAlign: 'center',
  },
  planPeriodSelected: {
    color: '#EE1D24',
  },

  planCardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp(0.008),
  },

  /* Plan feature list */
  planFeaturesList: {
    width: '100%',
    gap: hp(0.005),
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planCheckIcon: {
    marginRight: wp(0.01),
    marginTop: hp(0.001),
  },
  planFeatureText: {
    fontSize: fontScale(8.6),
    color: '#374151',
    fontWeight: '500',
    lineHeight: fontScale(11.5),
    flex: 1,
  },

  /* Primary CTA Button */
  ctaButton: {
    backgroundColor: '#EE1D24',
    borderRadius: wp(0.07),
    paddingVertical: hp(0.016),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.02),
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: hp(0.006) },
    shadowOpacity: 0.35,
    shadowRadius: wp(0.03),
    elevation: 5,
  },
  ctaButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* Disclaimers */
  disclaimersWrap: {
    alignItems: 'center',
    marginTop: hp(0.012),
    marginBottom: hp(0.015),
  },
  disclaimerPrimary: {
    fontSize: fontScale(10.5),
    color: '#4B5563',
    fontWeight: '600',
  },
  disclaimerSecondary: {
    fontSize: fontScale(9.5),
    color: '#9CA3AF',
    marginTop: hp(0.003),
  },

  /* Trust Badges */
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(0.01),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  trustBadgeItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(0.01),
  },
  trustDivider: {
    width: 1,
    height: hp(0.035),
    backgroundColor: '#E5E7EB',
  },
  trustBadgeText: {
    fontSize: fontScale(8.6),
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: hp(0.005),
    lineHeight: fontScale(11),
  },

  /* Legal Footer */
  legalFooter: {
    alignItems: 'center',
    marginTop: hp(0.012),
    paddingHorizontal: wp(0.04),
  },
  legalText: {
    fontSize: fontScale(9),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: fontScale(13),
  },
  legalLink: {
    color: '#EE1D24',
    textDecorationLine: 'underline',
  },
});
