import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import { CreditCard, CheckCircle, Receipt, Fingerprint } from '@phosphor-icons/react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await API.get('/analytics/dashboard');
        setPurchases(res.data.data?.recentPurchases || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  return (
    <div className="space-y-5">
      <PageHead
        icon={<CreditCard className="w-6 h-6" weight="duotone" />}
        title="Purchases"
        subtitle="Revenue & entitlement transaction log"
      />

      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-night-400">Loading purchases…</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-8 h-8 text-night-500 mx-auto mb-2" />
            <p className="text-sm text-night-300 font-medium">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="table-scroll anim">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Template Unlocked</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-night-100 flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-glow-400" weight="duotone" />
                        {p.transactionId}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-white">{p.userId?.name || 'Mobile User'}</p>
                      <p className="text-[11px] text-night-400">{p.userId?.phoneNumber || ''}</p>
                    </td>
                    <td className="font-medium text-night-200">{p.templateId?.name || 'Template'}</td>
                    <td className="font-bold text-glow-300">₹{p.amount} <span className="text-[10px] font-medium text-night-400">{p.currency}</span></td>
                    <td className="capitalize text-night-200">{p.paymentProvider}</td>
                    <td>
                      <span className="badge-success">
                        <CheckCircle className="w-3 h-3" weight="fill" /> Successful
                      </span>
                    </td>
                    <td className="text-night-300">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}