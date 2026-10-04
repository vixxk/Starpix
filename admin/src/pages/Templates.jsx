import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import { TableSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import TableScroll from '../components/TableScroll';
import { useToast } from '../context/ToastContext';
import {
  Sparkle,
  MagnifyingGlass,
  FunnelSimple,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  Plus,
  PushPin,
  CrownSimple,
  ImageSquare,
} from '@phosphor-icons/react';

import {
  initialForm,
  isVideoUrl,
  TemplateEditModal,
} from '../modules/templates';
import CreationsTable from '../modules/aiVideoTemplates/CreationsTable';
import MediaPreviewModal from '../modules/aiVideoTemplates/MediaPreviewModal';

export default function Templates() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'creations' ? 'creations' : 'templates';
  const [activeTab, setActiveTab] = useState(currentTab);

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'unpublished'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [formData, setFormData] = useState(initialForm());

  // Non-AI User Generated Content state
  const [creations, setCreations] = useState([]);
  const [creationLoading, setCreationLoading] = useState(false);
  const [creationSearch, setCreationSearch] = useState('');
  const [creationTypeFilter, setCreationTypeFilter] = useState('all');
  const [creationPage, setCreationPage] = useState(1);
  const [creationPagination, setCreationPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [previewMedia, setPreviewMedia] = useState(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'creations' || tab === 'templates') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'creations' ? { tab: 'creations' } : {});
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (statusFilter !== 'all') params.active = statusFilter;

      const [resT, resC] = await Promise.all([
        API.get('/templates', { params }),
        API.get('/categories'),
      ]);

      setTemplates(resT.data.data || []);
      setCategories(resC.data.data || []);
      if (resT.data.pagination) {
        setPagination({
          page: resT.data.pagination.page || page,
          totalPages: resT.data.pagination.pages || 1,
          totalItems: resT.data.pagination.total || (resT.data.data || []).length,
          limit: resT.data.pagination.limit || 10,
        });
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreations = async () => {
    setCreationLoading(true);
    try {
      const params = {
        page: creationPage,
        limit: 10,
        type: 'non-ai',
      };
      if (creationSearch) params.search = creationSearch;
      if (creationTypeFilter !== 'all') params.mediaType = creationTypeFilter;

      const res = await API.get('/admin/creations', { params });
      if (res.data.success) {
        setCreations(res.data.data || []);
        if (res.data.pagination) {
          setCreationPagination({
            page: res.data.pagination.page || creationPage,
            totalPages: res.data.pagination.pages || 1,
            totalItems: res.data.pagination.total || (res.data.data || []).length,
            limit: res.data.pagination.limit || 10,
          });
        }
      }
    } catch (err) {
      console.error('Error loading non-AI creations:', err);
      toast.error('Failed to load user generated content');
    } finally {
      setCreationLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, statusFilter]);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [page, search, selectedCategory, statusFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'creations') {
      fetchCreations();
    }
  }, [activeTab, creationPage, creationSearch, creationTypeFilter]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData(initialForm(''));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemplate(t);
    setFormData({
      name: t.name,
      nameTranslations: t.nameTranslations || {},
      description: t.description || '',
      categoryId: t.categoryId?._id || t.categoryId,
      type: t.type || 'image',
      accessType: t.accessType || 'free',
      price: t.price || 0,
      thumbnail: t.thumbnail,
      previewAsset: t.previewAsset,
      mainMedia: t.mainMedia,
      footers: t.footers || [],
      order: t.order !== undefined ? t.order : (t.sortOrder !== undefined ? t.sortOrder : 0),
      sortOrder: t.sortOrder !== undefined ? t.sortOrder : (t.order !== undefined ? t.order : 0),
      isPinned: t.isPinned || false,
      active: t.active !== undefined ? t.active : true,
      canvasConfig: t.canvasConfig || {
        aspectRatio: 0.5625,
        backgroundColor: '#07140B',
        layers: [],
      },
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.categoryId || formData.categoryId === '') {
      toast.error('Selecting a Category is mandatory.');
      return;
    }

    if (formData.accessType === 'paid' && (!formData.price || Number(formData.price) < 1)) {
      toast.error('Unlock price must be at least ₹1 for single paid purchase templates.');
      return;
    }

    if (!formData.mainMedia && !formData.previewAsset) {
      toast.error('Template Media Asset is required.');
      return;
    }

    const payload = {
      ...formData,
      thumbnail: formData.thumbnail || (!isVideoUrl(formData.mainMedia) ? formData.mainMedia : (formData.previewAsset && !isVideoUrl(formData.previewAsset) ? formData.previewAsset : '')),
      previewAsset: formData.previewAsset || formData.mainMedia,
    };

    try {
      if (editingTemplate) {
        await API.put(`/templates/${editingTemplate._id}`, payload);
      } else {
        await API.post('/templates', payload);
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error Saving template');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/templates/${deleteTarget._id}`);
      toast.success('Template deleted permanently');
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting template');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusTarget) return;
    setTogglingStatus(true);
    try {
      const nextState = !statusTarget.active;
      await API.put(`/templates/${statusTarget._id}`, { active: nextState });
      toast.success(nextState ? `Published "${statusTarget.name}"` : `Unpublished "${statusTarget.name}"`);
      setStatusTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update publication status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const TIER_BADGE = {
    free: <span className="badge-success">Free</span>,
    premium: (
      <span className="badge-amber">
        <PushPin className="w-3 h-3" weight="fill" /> Premium
      </span>
    ),
    paid: (
      <span className="badge-amber">
        <PushPin className="w-3 h-3" weight="fill" /> Paid
      </span>
    ),
    vip: (
      <span className="badge bg-violet-100 text-violet-900 border-violet-700">
        <CrownSimple className="w-3 h-3" weight="fill" /> VIP Only
      </span>
    ),
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={activeTab === 'templates' ? <Sparkle className="w-6 h-6" weight="duotone" /> : <ImageSquare className="w-6 h-6 text-flame-500" weight="duotone" />}
        title={activeTab === 'templates' ? 'Template Studio' : 'User Generated Content'}
        subtitle={
          activeTab === 'templates'
            ? `Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.totalItems} total templates)`
            : `Showing page ${creationPagination.page} of ${creationPagination.totalPages} (${creationPagination.totalItems} non-AI status creations generated from home page)`
        }
        actions={
          activeTab === 'templates' && (
            <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
              <Plus className="w-4 h-4" weight="bold" /> New Template
            </button>
          )
        }
      />

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b-2 border-ink gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('templates')}
          className={`px-4 py-2.5 font-bold uppercase text-xs border-2 border-b-0 rounded-t-[2px] flex items-center gap-2 transition-all ${
            activeTab === 'templates'
              ? 'bg-ink text-paper-100 border-ink shadow-hard-sm'
              : 'bg-paper-100 text-ink-mute border-transparent hover:text-ink'
          }`}
        >
          <Sparkle className="w-4 h-4" />
          <span>Templates Studio ({pagination.totalItems})</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('creations')}
          className={`px-4 py-2.5 font-bold uppercase text-xs border-2 border-b-0 rounded-t-[2px] flex items-center gap-2 transition-all ${
            activeTab === 'creations'
              ? 'bg-flame-500 text-ink border-ink shadow-hard-sm'
              : 'bg-paper-100 text-ink-mute border-transparent hover:text-ink'
          }`}
        >
          <ImageSquare className="w-4 h-4" weight="fill" />
          <span>User Generated Content ({creationPagination.totalItems})</span>
        </button>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Toolbar with Search, Category filter, and Status filter */}
      <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
          <div className="relative">
            <FunnelSimple className="w-4 h-4 text-ink-mute absolute left-3 sm:left-3.5 top-3 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select pl-8 sm:pl-10 w-full sm:w-48 text-xs sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Eye className="w-4 h-4 text-ink-mute absolute left-3 sm:left-3.5 top-3 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select pl-8 sm:pl-10 w-full sm:w-48 text-xs sm:text-sm font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="unpublished">Unpublished / Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : templates.length === 0 ? (
        <div className="panel p-12 text-center">
          <Sparkle className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No templates found</p>
          <p className="text-xs text-ink-mute mt-1">
            {statusFilter === 'unpublished'
              ? 'No unpublished/hidden templates found.'
              : 'Adjust your search, category or status filters, or create a new template.'}
          </p>
        </div>
      ) : (
        <TableScroll className="anim">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Template</th>
                <th>Category</th>
                <th>Type</th>
                <th>Access</th>
                <th>Price</th>
                <th>Uses / Views</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t._id} className="anim">
                  <td>
                    <span className="font-mono font-bold text-xs bg-paper-100 border border-ink/20 px-2 py-1 rounded-[2px] text-ink whitespace-nowrap">
                      #{t.order !== undefined ? t.order : (t.sortOrder !== undefined ? t.sortOrder : 0)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {isVideoUrl(t.thumbnail || t.previewAsset || t.mainMedia) ? (
                        <video
                          src={t.thumbnail || t.previewAsset || t.mainMedia}
                          className="w-10 aspect-[9/16] object-cover border-2 border-ink/20 shrink-0 rounded-[2px]"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={t.thumbnail || t.previewAsset || t.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}
                          alt={t.name || ''}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                          }}
                          className="w-10 aspect-[9/16] object-cover border-2 border-ink/20 shrink-0 rounded-[2px]"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-ink line-clamp-1">{t.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-medium text-ink-soft">{t.categoryId?.name || 'Uncategorized'}</td>
                  <td className="capitalize text-ink-soft">{t.type}</td>
                  <td>{TIER_BADGE[t.accessType] || TIER_BADGE.free}</td>
                  <td className="font-semibold text-ink">
                    {['premium', 'paid'].includes(t.accessType) ? `₹${t.price}` : '—'}
                  </td>
                  <td className="text-ink-mute">
                    <span className="font-semibold text-ink tabular-nums">{t.uses}</span> uses / {t.views} views
                  </td>
                  <td>
                    <button
                      onClick={() => setStatusTarget(t)}
                      className={`badge transition-all cursor-pointer ${t.active ? 'badge-success hover:opacity-75' : 'badge-muted hover:opacity-75'}`}
                      title="Click to toggle published status"
                    >
                      {t.active ? <Eye className="w-3 h-3" weight="fill" /> : <EyeSlash className="w-3 h-3" weight="fill" />}
                      {t.active ? 'Published' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      {t.isPinned && <span className="badge-amber" title="Pinned"><PushPin className="w-3 h-3" weight="fill" /></span>}
                      <button onClick={() => handleOpenEdit(t)} className="p-2 text-ink-mute hover:text-flame-600 hover:bg-flame-500/10 rounded-[2px] transition-colors">
                        <PencilSimple className="w-4 h-4" weight="duotone" />
                      </button>
                      <button onClick={() => setDeleteTarget(t)} className="p-2 text-ink-mute hover:text-red-600 hover:bg-red-500/10 rounded-[2px] transition-colors">
                        <Trash className="w-4 h-4" weight="duotone" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={(newPage) => setPage(newPage)}
      />
        </>
      ) : (
        <CreationsTable
          creations={creations}
          loading={creationLoading}
          search={creationSearch}
          setSearch={setCreationSearch}
          typeFilter={creationTypeFilter}
          setTypeFilter={setCreationTypeFilter}
          page={creationPage}
          setPage={setCreationPage}
          pagination={creationPagination}
          onPreview={setPreviewMedia}
          searchPlaceholder="Search user generated content by template title, ID, or user..."
          emptyTitle="No user generated content found"
          emptySubtitle="Users have not generated or downloaded any non-AI templates yet."
        />
      )}

      {/* Full Screen Media Preview Modal */}
      <MediaPreviewModal
        previewMedia={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      {/* Edit / Create Template Modal */}
      <TemplateEditModal
        isOpen={isModalOpen}
        editingTemplate={editingTemplate}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        isLangModalOpen={isLangModalOpen}
        setIsLangModalOpen={setIsLangModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Status Template"
        message={`Are you sure you want to permanently delete template "${deleteTarget?.name || 'this item'}"?`}
        confirmText="Delete Template"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Publication Status Change Modal */}
      <ConfirmModal
        isOpen={statusTarget !== null}
        title={statusTarget?.active ? 'Unpublish Status Template' : 'Publish Status Template'}
        message={
          statusTarget?.active
            ? `Are you sure you want to unpublish "${statusTarget?.name || 'this template'}"? It will be hidden from mobile app users.`
            : `Are you sure you want to publish "${statusTarget?.name || 'this template'}"? It will immediately become visible to mobile app users.`
        }
        confirmText={statusTarget?.active ? 'Unpublish' : 'Publish Template'}
        danger={statusTarget?.active}
        loading={togglingStatus}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setStatusTarget(null)}
      />
    </div>
  );
}