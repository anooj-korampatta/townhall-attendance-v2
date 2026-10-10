import { supabase } from '../lib/supabase'

const clean = value => String(value ?? '').trim()

function digits(value) {
  return clean(value).replace(/\\D/g, '')
}

function emailUsername(value) {
  const raw = clean(value).toLowerCase()
  if (!raw || /^\\d+$/.test(raw) || raw.includes('@')) return null
  return raw
}

async function findAttendee(key) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const raw = clean(key)
  if (!raw) return null

  let result = await supabase
    .from('attendees')
    .select('*')
    .eq('employee_id', raw)
    .maybeSingle()

  if (result.error) throw result.error
  if (result.data) return result.data

  const username = emailUsername(raw)
  if (username) {
    result = await supabase
      .from('attendees')
      .select('*')
      .ilike('email', `${username}@gwclogistics.com`)
      .maybeSingle()
    if (result.error) throw result.error
    if (result.data) return result.data
  }

  const inputDigits = digits(raw)
  if (inputDigits.length >= 8) {
    result = await supabase
      .from('attendees')
      .select('*')
      .not('mobile', 'is', null)
    if (result.error) throw result.error

    const match = (result.data || []).find(person => {
      const stored = digits(person.mobile)
      return stored === inputDigits ||
        stored.endsWith(inputDigits) ||
        inputDigits.endsWith(stored)
    })
    if (match) return match
  }

  return null
}

async function logAction(attendee, action) {
  const { error } = await supabase.from('attendance_logs').insert({
    attendee_id: attendee.id,
    employee_id: attendee.employee_id,
    name: attendee.name,
    department: attendee.department,
    mobile: attendee.mobile,
    action,
    source: 'WebApp'
  })
  if (error) throw error
}

async function updateStatus(attendee, action) {
  const now = new Date().toISOString()
  const patch = {
    status: action,
    updated_at: now
  }

  if (action === 'IN') patch.last_check_in = now
  if (action === 'OUT') patch.last_check_out = now

  const { error } = await supabase
    .from('attendees')
    .update(patch)
    .eq('id', attendee.id)

  if (error) throw error
  await logAction(attendee, action)

  return {
    ...attendee,
    status: action,
    ...(action === 'IN' ? { last_check_in: now } : { last_check_out: now })
  }
}

export const attendanceService = {
  async checkIn(key) {
    const attendee = await findAttendee(key)
    if (!attendee) return { ok: false, type: 'NOT_FOUND' }

    if (String(attendee.status || '').toUpperCase() === 'IN') {
      return { ok: false, type: 'ALREADY_IN', attendee }
    }

    return {
      ok: true,
      type: 'CHECKED_IN',
      attendee: await updateStatus(attendee, 'IN')
    }
  },

  async checkOut(key) {
    const attendee = await findAttendee(key)
    if (!attendee) return { ok: false, type: 'NOT_FOUND' }

    if (String(attendee.status || '').toUpperCase() !== 'IN') {
      return { ok: false, type: 'NOT_IN', attendee }
    }

    return {
      ok: true,
      type: 'CHECKED_OUT',
      attendee: await updateStatus(attendee, 'OUT')
    }
  },

  async getDashboard() {
    if (!supabase) throw new Error('Supabase is not configured.')

    const [totalResult, checkedResult, recentResult] = await Promise.all([
      supabase.from('attendees').select('*', { count: 'exact', head: true }),
      supabase.from('attendees').select('*', { count: 'exact', head: true }).eq('status', 'IN'),
      supabase.from('attendance_logs').select('*').order('timestamp', { ascending: false }).limit(100)
    ])

    if (totalResult.error) throw totalResult.error
    if (checkedResult.error) throw checkedResult.error
    if (recentResult.error) throw recentResult.error

    return {
      total: totalResult.count || 0,
      checkedIn: checkedResult.count || 0,
      recent: recentResult.data || [],
      latest: recentResult.data?.[0] || null
    }
  },

  subscribeToActivity(callback) {
    if (!supabase) return () => {}

    const channel = supabase
      .channel('townhall-attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_logs' },
        callback
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }
}