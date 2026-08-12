import React, { useEffect, useState } from 'react';
import PageHead from '../components/PageHead';
import { UsersThree, CrownSimple, Phone, UserCircle } from '@phosphor-icons/react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In dev backend, sample user is returned via seed
    setUsers([
      {
        _id: 'u1',
        name: 'Vivek Sharma',
        phoneNumber: '+919876543210',
        countryCode: '+91',
        isPremium: true,
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-5">
      <PageHead
        icon={<UsersThree className="w-6 h-6" weight="duotone" />}
        title="Users"
        subtitle={`${users.length} registered on the mobile app`}
      />

      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-night-400">Loading users…</p>
          </div>
        ) : (
          <div className="table-scroll anim">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone Number</th>
                  <th>Membership</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-glow-400 to-glow-500 text-night-950 flex items-center justify-center font-display font-bold shrink-0">
                          {u.name.substring(0, 1)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-[11px] text-night-400 flex items-center gap-1">
                            <UserCircle className="w-3 h-3" /> {u._id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-night-200 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-glow-400" weight="duotone" />
                      {u.phoneNumber}
                    </td>
                    <td>
                      {u.isPremium ? (
                        <span className="badge-amber">
                          <CrownSimple className="w-3 h-3" weight="fill" /> VIP Premium
                        </span>
                      ) : (
                        <span className="badge-muted">Free Member</span>
                      )}
                    </td>
                    <td className="text-night-300">{new Date(u.createdAt).toLocaleDateString()}</td>
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