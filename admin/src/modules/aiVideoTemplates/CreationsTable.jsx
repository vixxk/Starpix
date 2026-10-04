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
  VideoCamera,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import Pagination from '../../components/Pagination';
import TableScroll from '../../components/TableScroll';
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
  searchPlaceholder = 'Search creations by template title, ID, or user...',
  emptyTitle = 'No creations found',
  emptySubtitle = 'Users have not generated any content matching this filter.',
}) {
  return (
    <div className="space-y-4">
      {/* Content Toolbar */}
      <div className="panel p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 h-10 text-xs sm:text-sm"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select pl-9 pr-8 h-10 text-xs font-semibold uppercase tracking-wider"
          >
            <option value="all">All Media Types</option>
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
          <Sparkle className="w-10 h-10 text-paper-400 mx-auto mb-2" />
          <h3 className="font-bold text-ink text-sm uppercase">{emptyTitle}</h3>
          <p className="text-ink-mute text-xs mt-1">{emptySubtitle}</p>
        </div>
      ) : (
        <TableScroll className="anim">
          <table className="data-table">
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
                const title = c.templateTitle || c.templateId?.name || c.aiTemplateId?.title || 'Status Creation';
                const userName = c.userId?.name || 'Starpix User';
                const userPhone = c.userId?.phoneNumber || 'No phone';
                const creationDate = c.downloadedAt || c.createdAt;

                const previewData = {
                  url: c.imageUrl,
                  isVideo,
                  title,
                  userName,
                  userPhone,
                  createdAt: creationDate,
                  creationId: c._id,
                };

                return (
                  <tr key={c._id} className="anim hover:bg-paper-100/60 transition-colors">
                    <td>
                      <div
                        onClick={() => onPreview(previewData)}
                        className="w-12 aspect-[9/16] bg-black rounded-[2px] overflow-hidden border-2 border-ink cursor-pointer relative group shadow-sm"
                        title="Click to preview in modal"
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
                          <Play className="w-4 h-4 text-white" weight="fill" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-bold text-ink text-xs sm:text-sm line-clamp-1">{title}</p>
                      <p className="text-[10px] text-ink-mute font-mono truncate max-w-[190px]">
                        ID: {c._id}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-ink text-paper-50 font-bold text-xs flex items-center justify-center border border-ink shrink-0">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink text-xs truncate max-w-[160px]">{userName}</p>
                          <p className="font-mono text-[11px] text-ink-mute flex items-center gap-1">
                            <Phone className="w-3 h-3 text-flame-500 shrink-0" weight="bold" />
                            {userPhone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        isVideo
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-purple-100 text-purple-800 border border-purple-300'
                      }`}>
                        {isVideo ? (
                          <>
                            <VideoCamera className="w-3 h-3 text-orange-600" weight="bold" /> AI Video
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3 text-purple-600" weight="bold" /> AI Photo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="text-ink-mute text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink-mute shrink-0" />
                        <span>{new Date(creationDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPreview(previewData)}
                          className="btn-xs border border-ink bg-white hover:bg-paper-100 text-ink font-bold flex items-center gap-1 shadow-sm active:translate-y-[1px]"
                          title="Preview full creation"
                        >
                          <Eye className="w-3.5 h-3.5" weight="bold" /> Preview
                        </button>
                        <a
                          href={c.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-xs bg-flame-500 text-ink border border-ink hover:bg-flame-400 font-bold flex items-center gap-1 shadow-sm active:translate-y-[1px]"
                          title="Open original file on S3"
                        >
                          <ArrowSquareOut className="w-3.5 h-3.5" weight="bold" /> Open S3
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}

      {/* Creations Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={setPage}
      />
    </div>
  );
}
