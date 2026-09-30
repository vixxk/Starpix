import React from 'react';
import {
  Clock,
  Gear,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';

export default function ReportStatusBadge({ status }) {
  switch (status) {
    case 'resolved':
      return (
        <span className="badge badge-success flex items-center gap-1 font-bold">
          <CheckCircle className="w-3.5 h-3.5" weight="fill" />
          <span>Resolved</span>
        </span>
      );
    case 'in_progress':
      return (
        <span className="badge bg-amber-400 text-ink border border-ink flex items-center gap-1 font-bold">
          <Gear className="w-3.5 h-3.5 animate-spin" />
          <span>In Progress</span>
        </span>
      );
    case 'rejected':
      return (
        <span className="badge badge-error flex items-center gap-1 font-bold">
          <XCircle className="w-3.5 h-3.5" weight="fill" />
          <span>Rejected</span>
        </span>
      );
    default:
      return (
        <span className="badge badge-warning flex items-center gap-1 font-bold">
          <Clock className="w-3.5 h-3.5" weight="fill" />
          <span>Pending</span>
        </span>
      );
  }
}
