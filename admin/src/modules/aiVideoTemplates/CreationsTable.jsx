import React from 'react';
import {
  MagnifyingGlass,
  FunnelSimple,
  Play,
  Phone,
  Clock,
  Eye,
  ArrowSquareOut,
  Sparkle,
} from '@phosphor-icons/react';
import Pagination from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeleton';

export default function CreationsTable({
  creations,
  loading,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  page,
  setPage,
  pagination,
  onPreview,
}) {
  return (
    <>
      {/* User Generated AI Content Toolbar */}
      <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search AI creations by template title or format..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select pl-9 pr-8 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            <option value="all">All File Types</option>
            <option value="video">Videos Only (.mp4)</option>
            <option value="image">Photos Only (.png/.jpg)</option>
          </select>
          <FunnelSimple className="w-4 h-4 text-ink-mute absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Content Feed Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : creations.length === 0 ? (
        <div className="panel p-12 text-center">
          <Sparkle className="w-12 h-12 text-ink-mute mx-auto mb-3" />
          <h3 className="font-bold text-ink text-base">No AI creations found</h3>
          <p className="text-ink-mute text-xs mt-1">Users haven't generated any AI videos/photos matching this filter.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-20">Preview</th>
                <th>Template Title</th>
                <th>Created By User</th>
                <th>Media Type</th>
                <th>Created At</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {creations.map((c) => {
                const isVideo = Boolean(c.imageUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i));
                const title = c.templateTitle || c.aiTemplateId?.title || 'Custom AI Face Swap';
                const userName = c.userId?.name || 'Starpix User';
                const userPhone = c.userId?.phoneNumber || 'No phone';

                return (
                  <tr key={c._id} className="hover:bg-paper-100/50">
                    <td>
                      <div
                        onClick={() => onPreview({ url: c.imageUrl, isVideo, title })}
                        className="w-14 aspect-[9/16] bg-black rounded-[2px] overflow-hidden border border-ink cursor-pointer relative group"
                      >
                        {isVideo ? (
                          <video
                            src={c.imageUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            onMouseOver={(e) => e.target.play().catch(() => {})}
                            onMouseOut={(e) => e.target.pause()}
                          />
                        ) : (
                          <img
                            src={c.imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white" weight="fill" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-bold text-ink text-sm line-clamp-1">{title}</p>
                      <p className="text-[11px] text-ink-mute font-mono truncate max-w-[200px]">
                        ID: {c._id}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-ink text-flame-400 font-bold text-xs flex items-center justify-center border border-ink">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-ink text-xs">{userName}</p>
                          <p className="font-mono text-xs text-ink-soft flex items-center gap-1">
                            <Phone className="w-3 h-3 text-glow-600" />
                            {userPhone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${isVideo ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-purple-100 text-purple-700 border border-purple-300'}`}>
                        {isVideo ? 'AI Video (.mp4)' : 'AI Photo (.png)'}
                      </span>
                    </td>
                    <td className="text-ink-mute text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-ink-mute" />
                        {new Date(c.downloadedAt || c.createdAt).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onPreview({ url: c.imageUrl, isVideo, title })}
                          className="btn-xs border-ink bg-paper-100 hover:bg-paper-200"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <a
                          href={c.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-xs bg-flame-500 text-ink border-ink hover:bg-flame-400 flex items-center gap-1"
                        >
                          <ArrowSquareOut className="w-3.5 h-3.5" /> Open S3
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Creations Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={setPage}
      />
    </>
  );
}
