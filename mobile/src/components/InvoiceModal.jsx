import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Image } from 'react-native';
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

import {
  inr,
  fmtDate,
  generateInvoiceHtml,
  styles,
} from '../modules/invoice';

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
  const templateName = template?.name || purchase?.planName || (purchase?.purchaseType === 'ai_credits_pack' ? 'AI Credits Pack' : 'Status Template');
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
      
      const htmlContent = generateInvoiceHtml({
        user,
        purchase,
        template,
        templateName,
        transactionId,
        invoiceNo,
        displayPhone,
        userId,
        amount,
        taxable,
        cgst,
        sgst,
      });
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

            {/* Generated AI Content Preview Card for Non-Zero Costings */}
            {amount > 0 && (
              <View style={styles.aiAssetCard}>
                <Image
                  source={{ uri: purchase?.finalAssetUrl || template?.thumbnail || template?.previewAsset || template?.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80' }}
                  style={styles.aiAssetThumb}
                  resizeMode="cover"
                />
                <View style={styles.aiAssetInfo}>
                  <View style={styles.aiAssetBadge}>
                    <Text style={styles.aiAssetBadgeText}>GENERATED AI ASSET</Text>
                  </View>
                  <Text style={styles.aiAssetTitle} numberOfLines={1}>{templateName}</Text>
                  <Text style={styles.aiAssetSub} numberOfLines={1}>Licensed High-Resolution Asset · Ref: {transactionId}</Text>
                </View>
              </View>
            )}

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

