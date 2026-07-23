'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, UserMinus, RefreshCw, X, Check, Crown, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/stores/organization'
import { useLocale } from '@/lib/i18n/LocaleProvider'

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
  isOwner?: boolean
}

const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300 transition-shadow'
const SELECT = 'px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] transition-shadow'

export default function TeamPage() {
  const { t } = useLocale()
  const { organization, memberRole } = useOrganizationStore()
  const isAdmin = memberRole === 'admin'

  const [members, setMembers] = useState<Member[]>([])
  const [ownerMember, setOwnerMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
          id: 'owner',
          user_id: organization.owner_id,
          invited_email: null,
          role: 'admin',
          status: 'active',
          invited_at: null,
          accepted_at: (organization as any).created_at ?? null,
          updated_at: null,
          email: user?.id === organization.owner_id ? user.email : undefined,
          first_name: user?.id === organization.owner_id ? user.user_metadata?.first_name : undefined,
          last_name: user?.id === organization.owner_id ? user.user_metadata?.last_name : undefined,
          isOwner: true,
        })
      } else {
        setOwnerMember(null)
      }
    } catch {}
    setLoading(false)
  }, [organization])

  useEffect(() => { load() }, [load])

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
          email: inviteEmail.trim(),
          organizationId: organization.id,
          role: inviteAsAdmin ? 'admin' : 'member',
          firstName: inviteFirstName.trim(),
          lastName: inviteLastName.trim(),
          jobTitle: inviteJobTitle.trim(),
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
        const { error } = await supabase.auth.updateUser({
          data: { first_name: editFirstName.trim(), last_name: editLastName.trim() }
        })
        if (error) { showToast(error.message); setSaving(false); return }
      } else if (editMember.id !== 'owner') {
        const { error } = await supabase.from('organization_members').update({ role: editRole }).eq('id', editMember.id)
        if (error) { showToast(error.message); setSaving(false); return }
      }

      setEditMember(null)
      showToast(t('Shranjeno', 'Saved'))
      await load()
    } catch (err: any) { showToast(err.message) }
    setSaving(false)
  }

  async function deactivate(m: Member) {
    if (!confirm(t(`Deaktiviraj ${displayName(m)}?`, `Deactivate ${displayName(m)}?`))) return
    try {
      const supabase = createClient()
      await supabase.from('organization_members').update({ status: 'archived' }).eq('id', m.id)
      showToast(t('Uporabnik deaktiviran', 'User deactivated'))
      await load()
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
      showToast(t(`Povabilo znova poslano`, `Invite resent`))
    } catch (err: any) { showToast(err.message) }
  }

  function initials(m: Member) {
    const n = `${m.first_name ?? ''}${m.last_name ?? ''}`.trim()
    if (n) return (n.split(' ').map((w: string) => w[0]).join('').toUpperCase()).slice(0, 2)
    const e = m.email ?? m.invited_email ?? ''
    return e.slice(0, 2).toUpperCase()
  }

  function displayName(m: Member) {
    const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
    return full || '—'
  }

  const allMembers = [...(ownerMember ? [ownerMember] : []), ...members]
  const activeCount = allMembers.filter(m => m.status === 'active').length
  const invitedCount = members.filter(m => m.status === 'invited').length

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Uporabniki', 'Users')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeCount} {t('aktivnih', 'active')}{invitedCount > 0 ? `, ${invitedCount} ${t('čakajočih povabil', 'pending invites')}` : ''}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowInvite(true); resetInviteForm() }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> {t('Dodaj uporabnika', 'Add user')}
          </button>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && isAdmin && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => { setShowInvite(false); resetInviteForm() }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">{t('Dodaj uporabnika', 'Add user')}</h3>
              <button onClick={() => { setShowInvite(false); resetInviteForm() }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Ime', 'First name')}</label>
                  <input value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)}
                    placeholder="Jana" className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Priimek', 'Last name')}</label>
                  <input value={inviteLastName} onChange={e => setInviteLastName(e.target.value)}
                    placeholder="Novak" className={INPUT} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('E-poštni naslov', 'Email address')} <span className="text-red-400">*</span></label>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  type="email" placeholder="jana@podjetje.si" className={INPUT} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Delovno mesto', 'Job title')}</label>
                <input value={inviteJobTitle} onChange={e => setInviteJobTitle(e.target.value)}
                  placeholder={t('npr. Računovodja', 'e.g. Accountant')} className={INPUT} />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={inviteAsAdmin} onChange={e => setInviteAsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 focus:ring-1" />
                <span className="text-sm text-gray-700">{t('Povabi kot administratorja', 'Invite as administrator')}</span>
              </label>

              {inviteMsg && (
                <p className={`text-xs px-3 py-2 rounded-lg ${inviteMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{inviteMsg.text}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => { setShowInvite(false); resetInviteForm() }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors">
                {inviting ? t('Pošiljanje...', 'Sending...') : t('Pošlji povabilo', 'Send invite')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">{t('Ime', 'Name')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">{t('E-pošta', 'Email')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">{t('Vloga', 'Role')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="px-6 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">{t('Nalaganje...', 'Loading...')}</td></tr>
            ) : !allMembers.filter(m => m.status !== 'archived').length ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">{t('Ni uporabnikov.', 'No users.')}</td></tr>
            ) : (
              allMembers.map((m, i) => {
                const isMe = m.user_id === currentUserId
                const isOwner = !!m.isOwner
                const canEdit = isAdmin
                const canDeactivate = isAdmin && !isOwner && !isMe && m.status === 'active'

                return (
                  <tr key={m.id} className={`hover:bg-gray-50/50 transition-colors ${i !== 0 ? 'border-t border-gray-100' : ''} ${m.status === 'archived' ? 'opacity-50' : ''}`}>
                    {/* Name */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{displayName(m)}</span>
                        {isMe && <span className="text-xs text-gray-400">({t('vi', 'you')})</span>}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-3.5 text-sm text-gray-500">{m.email ?? m.invited_email ?? '—'}</td>

                    {/* Role */}
                    <td className="px-6 py-3.5">
                      {m.role === 'admin'
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">Administrator</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"><UserCheck className="h-3 w-3" /> {t('Član', 'Member')}</span>
                      }
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      {m.status === 'active' && <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">{t('Aktiven', 'Active')}</span>}
                      {m.status === 'invited' && (
                        <button onClick={() => resendInvite(m.invited_email!)}
                          className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors">
                          <RefreshCw className="h-3 w-3" /> {t('Povabljen', 'Invited')}
                        </button>
                      )}
                      {m.status === 'archived' && <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">{t('Deaktiviran', 'Deactivated')}</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {canEdit && (
                          <button onClick={() => { setEditMember(m); setEditRole(m.role); setEditFirstName(m.first_name ?? ''); setEditLastName(m.last_name ?? '') }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('Uredi', 'Edit')}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canDeactivate && (
                          <button onClick={() => deactivate(m)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t('Deaktiviraj', 'Deactivate')}>
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editMember && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditMember(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">{t('Uredi uporabnika', 'Edit user')}</h3>
              <button onClick={() => setEditMember(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                {initials(editMember)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{displayName(editMember)}</p>
                <p className="text-xs text-gray-400">{editMember.email ?? editMember.invited_email}</p>
              </div>
            </div>

            {/* Name fields — only for self */}
            {editMember.user_id === currentUserId && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Ime', 'First name')}</label>
                  <input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className={INPUT} placeholder={t('Ime', 'First name')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Priimek', 'Last name')}</label>
                  <input value={editLastName} onChange={e => setEditLastName(e.target.value)} className={INPUT} placeholder={t('Priimek', 'Last name')} />
                </div>
              </div>
            )}

            {/* Role — only for other members */}
            {editMember.user_id !== currentUserId && !editMember.isOwner && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Vloga', 'Role')}</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className={SELECT + ' w-full'}>
                  <option value="member">{t('Član', 'Member')}</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditMember(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">{t('Prekliči', 'Cancel')}</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors">
                {saving ? t('Shranjevanje...', 'Saving...') : t('Shrani', 'Save')}
              </button>
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
