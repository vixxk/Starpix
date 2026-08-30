import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { BRUTAL, FONTS, COLORS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticImpact, hapticTap } from '../utils/haptics';
import PressableScale from './PressableScale';
import BrutalCard from './BrutalCard';
import ConfirmModal from './ConfirmModal';
import { useTranslation } from 'react-i18next';

const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

function StatusStamp({ status }) {
  const map = {
    successful: { bg: '#DCFCE7', border: '#15803D', fg: '#14532D', label: 'Successful', icon: 'checkmark-circle' },
    pending: { bg: '#FEF3C7', border: '#D97706', fg: '#78350F', label: 'Pending', icon: 'time' },
    failed: { bg: '#FEE2E2', border: '#DC2626', fg: '#7F1D1D', label: 'Failed', icon: 'close-circle' },
  };
  const s = map[status] || map.successful;
  return (
    <View style={[styles.statusStamp, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Ionicons name={s.icon} size={11} color={s.fg} />
      <Text style={[styles.statusStampText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

/**
 * Brutalist invoice for a user's own purchase — mirrors the admin invoice
 * and the app's auth-splash styling (bone paper, ink slabs, flame accents).
 */
export default function InvoiceModal({ visible, purchase, user, onClose }) {
  const { t } = useTranslation();
  const [alertInfo, setAlertInfo] = useState(null);

  useEffect(() => {
    if (visible) hapticImpact();
  }, [visible]);

  const amount = Number(purchase?.amount) || 0;
  const taxable = Math.round((amount / 1.18) * 100) / 100;
  const gst = Math.round((amount - taxable) * 100) / 100;
  const cgst = Math.round((gst / 2) * 100) / 100;
  const sgst = Math.round((gst - cgst) * 100) / 100;

  const template = purchase?.templateId;
  const templateName = template?.name || 'Status Template';
  const transactionId = purchase?.transactionId || '—';
  const invoiceNo = `INV/${transactionId}`;
  const rawPhone = user?.phoneNumber || (typeof purchase?.userId === 'object' ? purchase?.userId?.phoneNumber : null) || '—';
  const countryCode = user?.countryCode || '+91';

  let displayPhone = rawPhone;
  if (displayPhone !== '—') {
    if (!displayPhone.startsWith('+')) {
      displayPhone = `${countryCode} ${displayPhone}`;
    }
  }

  const userId = user?._id || (typeof purchase?.userId === 'object' ? purchase?.userId?._id : purchase?.userId) || '—';

  const handleDownloadInvoice = async () => {
    try {
      hapticTap();
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Starpix Tax Invoice</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
              margin: 0;
              padding: 30px;
              color: #17120C;
              background-color: #FBF9F4;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              padding: 32px;
              border: 3px solid #17120C;
              background: #FFFFFF;
              box-shadow: 6px 6px 0px #17120C;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .brand-badge {
              display: inline-block;
              width: 44px;
              height: 44px;
              background-color: #FF5500;
              border: 2px solid #17120C;
              color: #FFFFFF;
              font-weight: 800;
              font-size: 24px;
              text-align: center;
              line-height: 44px;
              margin-right: 12px;
            }
            .brand-title {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 1px;
              color: #17120C;
              display: inline-block;
              vertical-align: middle;
            }
            .brand-sub {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 2px;
              color: #FF5500;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .invoice-title-cell {
              text-align: right;
              vertical-align: top;
            }
            .invoice-title {
              font-size: 26px;
              font-weight: 800;
              color: #17120C;
              letter-spacing: 1px;
            }
            .invoice-sub {
              font-size: 11px;
              font-weight: 700;
              color: #666;
              letter-spacing: 1px;
            }
            .meta-grid {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-top: 16px;
              border-top: 2px solid #17120C;
            }
            .meta-col {
              width: 48%;
            }
            .meta-label {
              font-size: 11px;
              font-weight: 700;
              color: #666;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .meta-value {
              font-size: 14px;
              font-weight: 700;
              color: #17120C;
            }
            .meta-small {
              font-size: 12px;
              color: #555;
              margin-top: 2px;
            }
            .uid-box {
              background: #F5F1E8;
              border: 2px solid #17120C;
              padding: 10px 14px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background: #17120C;
              color: #FFFFFF;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              padding: 10px 14px;
              text-align: left;
            }
            .items-table td {
              border-bottom: 2px solid #17120C;
              padding: 14px;
              font-size: 14px;
              color: #17120C;
            }
            .text-right {
              text-align: right !important;
            }
            .text-center {
              text-align: center !important;
            }
            .totals-table {
              width: 280px;
              margin-left: auto;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .totals-table td {
              padding: 6px 12px;
              font-size: 13px;
            }
            .totals-table .total-row {
              background: #17120C;
              color: #FFFFFF;
              font-weight: 800;
              font-size: 16px;
            }
            .totals-table .total-row td {
              padding: 10px 12px;
            }
            .badge-success {
              display: inline-block;
              background: #DCFCE7;
              border: 1px solid #15803D;
              color: #14532D;
              font-size: 11px;
              font-weight: 700;
              padding: 3px 8px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 2px dashed #CCC;
              font-size: 11px;
              color: #777;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <table class="header-table">
              <tr>
                <td class="logo-cell">
                  <div class="brand-badge">S</div>
                  <div style="display: inline-block; vertical-align: middle;">
                    <div class="brand-title">STARPIX</div>
                    <div class="brand-sub">DIGITAL STATUS PLATFORM</div>
                  </div>
                </td>
                <td class="invoice-title-cell">
                  <div class="invoice-title">TAX INVOICE</div>
                  <div class="invoice-sub">TEMPLATE UNLOCK</div>
                </td>
              </tr>
            </table>

            <div class="meta-grid">
              <div class="meta-col">
                <div class="meta-label">BILLED BY</div>
                <div class="meta-value">Starpix Digital Media</div>
                <div class="meta-small">Mobile Status Platform</div>
                <div class="meta-small">support@starpix.com</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">BILLED TO</div>
                <div class="meta-value">${user?.name || 'Starpix User'}</div>
                <div class="meta-small">${displayPhone}</div>
              </div>
            </div>

            <div class="uid-box">
              <span class="meta-label" style="margin:0;">USER ID (UID):</span>
              <span class="meta-value" style="font-size:12px; font-family:monospace;">${userId}</span>
            </div>

            <div class="meta-grid">
              <div class="meta-col">
                <div class="meta-label">INVOICE NO.</div>
                <div class="meta-value">${invoiceNo}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">ISSUE DATE & STATUS</div>
                <div class="meta-value">
                  ${fmtDate(purchase?.createdAt)} &nbsp;
                  <span class="badge-success">${(purchase?.status || 'successful').toUpperCase()}</span>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${templateName}</strong><br/>
                    <span style="font-size:12px; color:#666;">
                      ${purchase?.productId || 'starpix_single_unlock'} · ${template?.accessType || 'Premium'} Unlock
                    </span>
                  </td>
                  <td class="text-center">1</td>
                  <td class="text-right">${inr(taxable)}</td>
                </tr>
              </tbody>
            </table>

            <table class="totals-table">
              <tr>
                <td>Taxable Value:</td>
                <td class="text-right">${inr(taxable)}</td>
              </tr>
              <tr>
                <td>CGST @ 9%:</td>
                <td class="text-right">${inr(cgst)}</td>
              </tr>
              <tr>
                <td>SGST @ 9%:</td>
                <td class="text-right">${inr(sgst)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL PAID:</td>
                <td class="text-right">${inr(amount)}</td>
              </tr>
            </table>

            <div class="footer">
              This is an official computer-generated tax invoice for Starpix digital status platform.<br/>
              Transaction Ref: ${transactionId} · Generated ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const pdfFileName = `Invoice_${transactionId.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}.pdf`;
      const pdfFileUri = `${FileSystem.documentDirectory}${pdfFileName}`;
      
      await FileSystem.copyAsync({ from: uri, to: pdfFileUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfFileUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `Tax Invoice PDF ${invoiceNo}`,
        });
      } else {
        setAlertInfo({
          title: 'Invoice PDF Saved',
          message: `Tax invoice PDF saved to app documents: ${pdfFileName}`,
          icon: 'document-text-outline',
          iconColor: COLORS.orange,
        });
      }
    } catch (err) {
      console.error('Invoice download error:', err);
      setAlertInfo({
        title: 'Unable to Generate Invoice PDF',
        message: 'Could not generate or share the tax invoice PDF on this device. Please try again.',
        icon: 'alert-circle-outline',
        iconColor: COLORS.orange,
      });
    }
  };

  const Row = ({ label, value, strong }) => (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, strong && styles.metaValueStrong]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.backdrop} edges={['top', 'bottom']}>
        <BrutalCard style={styles.sheet} offset={wp(0.022)} contentStyle={styles.sheetFace}>

          {/* Ink toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.flameCorner} pointerEvents="none" />
            <Text style={styles.toolbarTitle}>TAX INVOICE</Text>
            <PressableScale onPress={onClose} scaleTo={0.9} haptic="tap" style={styles.closeBtn} contentStyle={styles.closeContent}>
              <Ionicons name="close" size={20} color={BRUTAL.paper} />
            </PressableScale>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Masthead */}
            <View style={styles.masthead}>
              <View style={styles.brandRow}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeLetter}>S</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>STARPIX</Text>
                  <Text style={styles.brandSub}>DIGITAL STATUS PLATFORM</Text>
                </View>
              </View>
              <View style={styles.invoiceTag}>
                <Text style={styles.invoiceTagText}>INVOICE</Text>
                <Text style={styles.invoiceTagSub}>TEMPLATE UNLOCK</Text>
              </View>
            </View>

            {/* Billed blocks */}
            <View style={styles.metaGrid}>
              <View style={styles.billedCol}>
                <Text style={styles.sectionLabel}>BILLED BY</Text>
                <Text style={styles.metaTitle}>Starpix Digital Media</Text>
                <Text style={styles.metaSmall}>Mobile Status Platform</Text>
                <Text style={styles.metaSmall}>support@starpix.com</Text>
              </View>
              <View style={styles.billedCol}>
                <Text style={styles.sectionLabel}>BILLED TO</Text>
                <Text style={styles.metaTitle}>{user?.name || 'Starpix User'}</Text>
                <Text style={styles.metaSmallMono}>
                  {displayPhone}
                </Text>
              </View>
            </View>

            {/* Dedicated UID Pill (full width, never truncated) */}
            <View style={styles.uidBox}>
              <Text style={styles.uidLabel}>USER ID (UID)</Text>
              <Text style={styles.uidValue} numberOfLines={1} selectable>
                {userId}
              </Text>
            </View>

            {/* Invoice meta */}
            <View style={styles.invoiceMetaRow}>
              <Row label="INVOICE NO." value={invoiceNo} strong />
              <Row label="ISSUE DATE" value={fmtDate(purchase?.createdAt)} />
              <Row label="STATUS" value={<StatusStamp status={purchase?.status || 'successful'} />} />
            </View>

            {/* Item line */}
            <Text style={styles.sectionLabel}>ITEM DETAILS</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.cellDesc]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.cellAmt]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.cellDesc]}>
                <Text style={styles.itemName} numberOfLines={1}>{templateName}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>
                  {{
                    free: 'Free Template',
                    premium: 'Premium Template Unlock',
                    paid: 'Paid Template Unlock',
                    vip: 'VIP Exclusive Template',
                  }[template?.accessType] || 'Premium Template Unlock'}{' '}
                  · {purchase?.productId || 'starpix_single_unlock'}
                </Text>
              </View>
              <Text style={[styles.cellQty, styles.itemQty]}>1</Text>
              <Text style={[styles.cellAmt, styles.itemAmt]}>{inr(taxable)}</Text>
            </View>

            {/* Totals */}
            <View style={styles.totalsBlock}>
              {amount > 0 ? (
                <>
                  <Row label="TAXABLE VALUE" value={inr(taxable)} />
                  <Row label="CGST @ 9%" value={inr(cgst)} />
                  <Row label="SGST @ 9%" value={inr(sgst)} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL PAID</Text>
                    <Text style={styles.totalValue}>{inr(amount)}</Text>
                  </View>
                  <Text style={styles.taxNote}>Inclusive of all taxes · {purchase?.currency || 'INR'}</Text>
                </>
              ) : (
                <View style={styles.freeStamp}>
                  <Ionicons name="gift" size={14} color="#14532D" />
                  <Text style={styles.freeStampText}>FREE UNLOCK · NO CHARGE</Text>
                </View>
              )}
            </View>

            {/* Payment trail */}
            <View style={styles.trailRow}>
              <Row label="PROVIDER" value={purchase?.paymentProvider || 'Development'} />
              <Row label="PAYMENT" value={purchase?.status || 'successful'} />
              <View style={styles.trailRef}>
                <Text style={styles.metaLabel}>TRANSACTION REF</Text>
                <Text style={styles.metaValueMono} numberOfLines={2}>{transactionId}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                This is a computer-generated invoice for the Starpix digital status platform.
              </Text>
              <Text style={styles.footerText}>
                Generated {fmtDate(new Date().toISOString())}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.buttonRow}>
              <PressableScale
                onPress={handleDownloadInvoice}
                scaleTo={0.96}
                style={styles.downloadBtn}
                contentStyle={styles.downloadContent}
              >
                <Ionicons name="download-outline" size={16} color={BRUTAL.paper} />
                <Text style={styles.downloadBtnText}>{t('download')}</Text>
              </PressableScale>

              <PressableScale
                onPress={() => {
                  hapticTap();
                  onClose();
                }}
                scaleTo={0.96}
                style={styles.doneBtn}
                contentStyle={styles.doneContent}
              >
                <Ionicons name="checkmark" size={16} color={BRUTAL.ink} />
                <Text style={styles.doneBtnText}>{t('got_it')}</Text>
              </PressableScale>
            </View>
          </ScrollView>
        </BrutalCard>
      </SafeAreaView>

      {/* Themed Alert Modal matching Logout confirmation design */}
      <ConfirmModal
        visible={!!alertInfo}
        title={alertInfo?.title || t('invoice')}
        message={alertInfo?.message || ''}
        icon={alertInfo?.icon || 'alert-circle-outline'}
        iconColor={alertInfo?.iconColor || COLORS.orange}
        confirmText={t('got_it')}
        hideCancel
        onConfirm={() => setAlertInfo(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 18, 12, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(0.04),
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
  },
  sheetFace: {
    backgroundColor: BRUTAL.bone,
    maxHeight: hp(0.88),
  },
  scroll: {
    flexShrink: 1,
  },
  toolbar: {
    backgroundColor: BRUTAL.ink,
    paddingHorizontal: wp(0.045),
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  flameCorner: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 56,
    height: 56,
    backgroundColor: BRUTAL.flame,
  },
  toolbarTitle: {
    color: BRUTAL.paper,
    fontSize: fontScale(16),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.paper,
    zIndex: 1,
  },
  closeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: wp(0.045),
    paddingBottom: wp(0.06),
  },
  masthead: {
    backgroundColor: BRUTAL.ink,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    paddingHorizontal: wp(0.04),
    paddingVertical: hp(0.022),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 40,
    height: 40,
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.paper,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandBadgeLetter: {
    color: BRUTAL.ink,
    fontSize: fontScale(20),
    fontFamily: FONTS.display,
  },
  brandName: {
    color: BRUTAL.paper,
    fontSize: fontScale(18),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  brandSub: {
    color: BRUTAL.flameLight,
    fontSize: fontScale(7.5),
    fontFamily: FONTS.bold,
    letterSpacing: 1.6,
    marginTop: 2,
  },
  invoiceTag: {
    alignItems: 'flex-end',
  },
  invoiceTagText: {
    color: BRUTAL.paper,
    fontSize: fontScale(22),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  invoiceTagSub: {
    color: 'rgba(245, 241, 232, 0.6)',
    fontSize: fontScale(7),
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: hp(0.024),
  },
  billedCol: {
    flex: 1,
  },
  uidBox: {
    backgroundColor: BRUTAL.paperAlt,
    borderWidth: 1.5,
    borderColor: BRUTAL.ink,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uidLabel: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  uidValue: {
    color: BRUTAL.ink,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
    flexShrink: 1,
    marginLeft: 8,
  },
  sectionLabel: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  metaTitle: {
    color: BRUTAL.ink,
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
  },
  metaSmall: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(10),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  metaSmallMono: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(9.5),
    fontFamily: FONTS.semibold,
    marginTop: 2,
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: hp(0.022),
    paddingTop: hp(0.018),
    borderTopWidth: 2,
    borderTopColor: 'rgba(23, 18, 12, 0.15)',
  },
  metaRow: {
    flex: 1,
    minWidth: '40%',
  },
  metaLabel: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  metaValue: {
    color: BRUTAL.inkSoft,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.semibold,
  },
  metaValueStrong: {
    color: BRUTAL.ink,
    fontFamily: FONTS.bold,
  },
  metaValueMono: {
    color: BRUTAL.inkSoft,
    fontSize: fontScale(9.5),
    fontFamily: FONTS.semibold,
  },
  statusStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusStampText: {
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRUTAL.paperAlt,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: hp(0.016),
  },
  tableHeaderCell: {
    color: BRUTAL.ink,
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  cellDesc: {
    flex: 1,
  },
  cellQty: {
    width: 44,
    textAlign: 'center',
  },
  cellAmt: {
    width: 86,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: BRUTAL.ink,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  itemName: {
    color: BRUTAL.ink,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
  },
  itemSub: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(8.5),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  itemQty: {
    color: BRUTAL.ink,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
  },
  itemAmt: {
    color: BRUTAL.ink,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
  },
  totalsBlock: {
    marginTop: hp(0.02),
    gap: 8,
    alignSelf: 'flex-end',
    width: '100%',
    maxWidth: 260,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRUTAL.ink,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  totalLabel: {
    color: BRUTAL.paper,
    fontSize: fontScale(11),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  totalValue: {
    color: BRUTAL.paper,
    fontSize: fontScale(14),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  taxNote: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(8),
    fontFamily: FONTS.medium,
    textAlign: 'right',
  },
  freeStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#15803D',
    borderRadius: 2,
    paddingVertical: 10,
  },
  freeStampText: {
    color: '#14532D',
    fontSize: fontScale(10),
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  trailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: hp(0.022),
    paddingTop: hp(0.018),
    borderTopWidth: 2,
    borderTopColor: 'rgba(23, 18, 12, 0.15)',
  },
  trailRef: {
    flex: 1,
    minWidth: '100%',
  },
  footer: {
    marginTop: hp(0.024),
    backgroundColor: BRUTAL.paperAlt,
    borderWidth: 2,
    borderColor: 'rgba(23, 18, 12, 0.25)',
    borderRadius: 2,
    padding: 10,
    gap: 3,
  },
  footerText: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(8),
    fontFamily: FONTS.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: hp(0.024),
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: BRUTAL.ink,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 4,
    minHeight: 48,
  },
  downloadContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadBtnText: {
    color: BRUTAL.paper,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  doneBtn: {
    flex: 1,
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 4,
    minHeight: 48,
  },
  doneContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneBtnText: {
    color: BRUTAL.ink,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
