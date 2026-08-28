'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, UserMinus, X, Check, MoreVertical, Search, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/stores/organization'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

type Member = {
  id: string
  user_id: string | null
  invited_email: string | null
  role: 'admin' | 'member'
  status: 'active' | 'invited' | 'archived'
  invited_at: string | null
  accepted_at: string | null
  updated_at: string | null
  email?: string
  first_name?: string
  last_name?: string
  job_title?: string
  isOwner?: boolean
}

const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 transition-shadow'
const SELECT = 'px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] transition-shadow'

export default function TeamPage() {
  const { t } = useLocale()
  const { organization, memberRole } = useOrganizationStore()
  const isAdmin = memberRole === 'admin'

  const [members, setMembers] = useState<Member[]>([])
  const [ownerMember, setOwnerMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'member'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'invited'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteJobTitle, setInviteJobTitle] = useState('')
  const [inviteAsAdmin, setInviteAsAdmin] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Edit modal
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member')
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data: rows } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at')

      const enriched: Member[] = (rows ?? []).map(r => ({ ...r }))
      setMembers(enriched)

      const ownerInMembers = enriched.some(m => m.user_id === organization.owner_id)
      if (!ownerInMembers) {
        setOwnerMember({
          id: 'owner', user_id: organization.owner_id, invited_email: null,
          role: 'admin', status: 'active', invited_at: null,
          accepted_at: (organization as any).created_at ?? null, updated_at: null,
          email: user?.id === organization.owner_id ? user.email : undefined,
          first_name: user?.id === organization.owner_id ? user.user_metadata?.first_name : undefined,
          last_name: user?.id === organization.owner_id ? user.user_metadata?.last_name : undefined,
          isOwner: true,
        })
      } else { setOwnerMember(null) }
    } catch {}
    setLoading(false)
  }, [organization])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const close = () => setOpenMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  function resetInviteForm() {
    setInviteFirstName(''); setInviteLastName('')
    setInviteEmail(''); setInviteJobTitle(''); setInviteAsAdmin(false); setInviteMsg(null)
  }

  async function sendInvite() {
    if (!inviteEmail.trim() || !organization) return
    setInviting(true); setInviteMsg(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          email: inviteEmail.trim(), organizationId: organization.id,
          role: inviteAsAdmin ? 'admin' : 'member',
          firstName: inviteFirstName.trim(), lastName: inviteLastName.trim(), jobTitle: inviteJobTitle.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setInviteMsg({ type: 'error', text: json.error }); setInviting(false); return }
      setInviteMsg({ type: 'success', text: t(`Povabilo poslano na ${inviteEmail.trim()}`, `Invite sent to ${inviteEmail.trim()}`) })
      setTimeout(() => { setShowInvite(false); resetInviteForm() }, 1500)
      await load()
    } catch (err: any) { setInviteMsg({ type: 'error', text: err.message }) }
    setInviting(false)
  }

  async function saveEdit() {
    if (!editMember) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const isEditingSelf = editMember.user_id === user?.id
      if (isEditingSelf) {
        const { error } = await supabase.auth.updateUser({ data: { first_name: editFirstName.trim(), last_name: editLastName.trim() } })
        if (error) { showToast(error.message); setSaving(false); return }
      } else if (editMember.id !== 'owner') {
        const { error } = await supabase.from('organization_members').update({ role: editRole }).eq('id', editMember.id)
        if (error) { showToast(error.message); setSaving(false); return }
      }
      setEditMember(null); showToast(t('Shranjeno', 'Saved')); await load()
    } catch (err: any) { showToast(err.message) }
    setSaving(false)
  }

  async function deactivate(m: Member) {
    if (!confirm(t(`Deaktiviraj ${displayName(m)}?`, `Deactivate ${displayName(m)}?`))) return
    try {
      const supabase = createClient()
      await supabase.from('organization_members').update({ status: 'archived' }).eq('id', m.id)
      showToast(t('Uporabnik deaktiviran', 'User deactivated')); await load()
    } catch (err: any) { showToast(err.message) }
  }

  async function resendInvite(email: string) {
    if (!organization) return
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email, organizationId: organization.id, role: 'member' }),
      })
      if (!res.ok) { const j = await res.json(); showToast(j.error); return }
      showToast(t('Povabilo znova poslano', 'Invite resent'))
    } catch (err: any) { showToast(err.message) }
  }

  function initials(m: Member) {
    const n = [m.first_name, m.last_name].filter(Boolean).join(' ').trim()
    if (n) return n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    return (m.email ?? m.invited_email ?? '').slice(0, 2).toUpperCase()
  }

  function displayName(m: Member) {
    return [m.first_name, m.last_name].filter(Boolean).join(' ') || '—'
  }

  const allMembers = [...(ownerMember ? [ownerMember] : []), ...members]
  const activeCount = allMembers.filter(m => m.status !== 'archived').length

  const filtered = allMembers.filter(m => {
    if (m.status === 'archived') return false
    if (search) {
      const q = search.toLowerCase()
      const name = displayName(m).toLowerCase()
      const email = (m.email ?? m.invited_email ?? '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) return false
    }
    if (filterRole !== 'all' && m.role !== filterRole) return false
    if (filterStatus !== 'all' && m.status !== filterStatus) return false
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 h-[57px] shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-900">{t('Uporabniki', 'Users')}</h1>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{activeCount}</span>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowInvite(true); resetInviteForm() }}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors shrink-0">
            <Plus className="h-3.5 w-3.5" /> {t('Dodaj uporabnika', 'Add user')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Iskanje', 'Search')}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 w-full sm:w-48 placeholder:text-gray-400" />
        </div>
        <div className="flex items-center gap-1.5 h-9 px-3 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <span className="text-gray-500">{t('Vloga:', 'Role:')}</span>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)}
            className="appearance-none bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer pr-4">
            <option value="all">{t('Vsi', 'All')}</option>
            <option value="admin">Administrator</option>
            <option value="member">{t('Uporabnik', 'User')}</option>
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 -ml-3 pointer-events-none" />
        </div>
        <div className="flex items-center gap-1.5 h-9 px-3 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <span className="text-gray-500">Status:</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            className="appearance-none bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer pr-4">
            <option value="all">{t('Vsi', 'All')}</option>
            <option value="active">{t('Aktivni', 'Active')}</option>
            <option value="invited">{t('Povabljeni', 'Invited')}</option>
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 -ml-3 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">{t('Ime', 'Name')}</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('E-pošta', 'Email')}</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Vloga', 'Role')}</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
              <th className="w-12 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-b border-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">{t('Ni uporabnikov.', 'No users.')}</td></tr>
            ) : filtered.map((m, i) => {
              const isMe = m.user_id === currentUserId
              const isOwner = !!m.isOwner
              const canEdit = isAdmin
              const canDeactivate = isAdmin && !isOwner && !isMe && m.status === 'active'

              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name + avatar */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none"
                        style={{ backgroundColor: '#e5eeff', color: '#215bcf' }}>
                        {initials(m)}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{displayName(m)}</span>
                        {isMe && <span className="ml-1.5 text-xs text-gray-400">({t('vi', 'you')})</span>}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5 text-sm text-gray-500">{m.email ?? m.invited_email ?? '—'}</td>

                  {/* Role */}
                  <td className="px-5 py-3.5">
                    {m.role === 'admin'
                      ? <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md" style={{backgroundColor:'#e5eeff',color:'#215bcf'}}>Administrator</span>
                      : <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{t('Uporabnik', 'User')}</span>
                    }
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    {m.status === 'active' && (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md" style={{backgroundColor:'#e0fced',color:'#098259'}}>{t('Aktiven', 'Active')}</span>
                    )}
                    {m.status === 'invited' && (
                      <button onClick={() => resendInvite(m.invited_email!)}
                        className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity" style={{backgroundColor:'#fff3bf',color:'#e67700'}}>
                        {t('Povabljen', 'Invited')}
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 relative">
                    {(canEdit || canDeactivate) && (
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenu === m.id && (
                          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                            {canEdit && (
                              <button onClick={() => { setEditMember(m); setEditRole(m.role); setEditFirstName(m.first_name ?? ''); setEditLastName(m.last_name ?? ''); setOpenMenu(null) }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <Pencil className="h-3.5 w-3.5 text-gray-400" /> {t('Uredi', 'Edit')}
                              </button>
                            )}
                            {canDeactivate && (
                              <button onClick={() => { deactivate(m); setOpenMenu(null) }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                <UserMinus className="h-3.5 w-3.5" /> {t('Deaktiviraj', 'Deactivate')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && isAdmin && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => { setShowInvite(false); resetInviteForm() }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{t('Dodaj uporabnika', 'Add user')}</h3>
              <button onClick={() => { setShowInvite(false); resetInviteForm() }} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Ime', 'First name')}</label>
                  <input value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="Jana" className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Priimek', 'Last name')}</label>
                  <input value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Novak" className={INPUT} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('E-poštni naslov', 'Email address')} <span className="text-red-400">*</span></label>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="jana@podjetje.si" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Delovno mesto', 'Job title')}</label>
                <input value={inviteJobTitle} onChange={e => setInviteJobTitle(e.target.value)} placeholder={t('npr. Računovodja', 'e.g. Accountant')} className={INPUT} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={inviteAsAdmin} onChange={e => setInviteAsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-200 text-blue-600 focus:ring-blue-600 focus:ring-1" />
                <span className="text-sm text-gray-700">{t('Povabi kot administratorja', 'Invite as administrator')}</span>
              </label>
              {inviteMsg && (
                <p className={`text-xs px-3 py-2 rounded-lg ${inviteMsg.type === 'success' ? 'bg-gray-100 text-gray-900' : 'bg-red-50 text-red-600'}`}>{inviteMsg.text}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end px-6 pb-5">
              <button onClick={() => { setShowInvite(false); resetInviteForm() }}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">{t('Prekliči', 'Cancel')}</button>
              <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors">
                {inviting ? t('Pošiljanje...', 'Sending...') : t('Pošlji povabilo', 'Send invite')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editMember && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditMember(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{t('Uredi uporabnika', 'Edit user')}</h3>
              <button onClick={() => setEditMember(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                  style={{ backgroundColor: '#e5eeff', color: '#215bcf' }}>
                  {initials(editMember)}
                </div>
                <p className="text-sm font-semibold text-gray-900">{displayName(editMember)}</p>
              </div>
              {editMember.user_id === currentUserId && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('Ime', 'First name')}</label>
                    <input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('Priimek', 'Last name')}</label>
                    <input value={editLastName} onChange={e => setEditLastName(e.target.value)} className={INPUT} />
                  </div>
                </div>
              )}
              {editMember.user_id !== currentUserId && !editMember.isOwner && (
                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Vloga', 'Role')}</label>
                  <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className={SELECT + ' w-full'}>
                    <option value="member">{t('Uporabnik', 'User')}</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditMember(null)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">{t('Prekliči', 'Cancel')}</button>
                <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors">
                  {saving ? t('Shranjevanje...', 'Saving...') : t('Shrani', 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}
    </div>
  )
}
