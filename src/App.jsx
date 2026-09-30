import { useState, useRef } from 'react'
import { Plus, Check, Pencil, Trash2, Search, Calendar } from 'lucide-react'

const PRIO = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง' }
const PRIO_ORDER = ['low', 'medium', 'high']
const CATS = { work: 'งาน', personal: 'ส่วนตัว', shopping: 'ช้อปปิ้ง', health: 'สุขภาพ' }
const CAT_ORDER = ['work', 'personal', 'shopping', 'health']
const FILTERS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['done', 'เสร็จแล้ว'],
]

/* ---------- date helpers (local time) ---------- */
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
const fmtDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}
const dueState = (t) => {
  if (!t.due || t.done) return null
  const today = iso(new Date())
  if (t.due < today) return 'overdue'
  if (t.due === today) return 'today'
  return 'normal'
}

/* ---------- donut chart ---------- */
function Donut({ segments, total, percent }) {
  const R = 38
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <svg width="96" height="96" viewBox="0 0 100 100" role="img" aria-label={`เสร็จแล้ว ${percent}%`}>
      <g transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="14" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C
            const el = (
              <circle
                key={s.key}
                cx="50" cy="50" r={R} fill="none"
                stroke={s.color} strokeWidth="14"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return s.value > 0 ? el : null
          })}
      </g>
      <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--ink)">
        {percent}%
      </text>
    </svg>
  )
}

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'ซื้อของเข้าบ้าน', done: false, priority: 'medium', category: 'shopping', due: addDays(0) },
    { id: 2, text: 'ส่งรายงานให้หัวหน้า', done: false, priority: 'high', category: 'work', due: addDays(-1) },
    { id: 3, text: 'อ่านหนังสือ 20 นาที', done: true, priority: 'low', category: 'personal', due: '' },
    { id: 4, text: 'นัดตรวจสุขภาพประจำปี', done: false, priority: 'medium', category: 'health', due: addDays(5) },
  ])
  const [text, setText] = useState('')
  const [prio, setPrio] = useState('medium')
  const [cat, setCat] = useState('personal')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [leaving, setLeaving] = useState([])
  const nextId = useRef(5)

  const patch = (id, changes) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)))

  const add = () => {
    const t = text.trim()
    if (!t) return
    setTodos([{ id: nextId.current++, text: t, done: false, priority: prio, category: cat, due }, ...todos])
    setText('')
    setDue('')
  }

  const remove = (id) => {
    setLeaving((l) => [...l, id])
    setTimeout(() => {
      setTodos((ts) => ts.filter((t) => t.id !== id))
      setLeaving((l) => l.filter((x) => x !== id))
    }, 260)
  }

  const startEdit = (t) => {
    setEditId(t.id)
    setEditText(t.text)
  }
  const saveEdit = () => {
    if (editId === null) return
    const v = editText.trim()
    if (v) patch(editId, { text: v })
    setEditId(null)
  }

  const clearDone = () => todos.filter((t) => t.done).forEach((t) => remove(t.id))
  const next = (list, cur) => list[(list.indexOf(cur) + 1) % list.length]

  /* ---------- derived ---------- */
  const q = query.trim().toLowerCase()
  const shown = todos.filter(
    (t) =>
      (filter === 'all' || (filter === 'active' ? !t.done : t.done)) &&
      (catFilter === 'all' || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  )
  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.length - remaining
  const overdueCount = todos.filter((t) => dueState(t) === 'overdue').length
  const inProgress = remaining - overdueCount
  const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0
  const segments = [
    { key: 'done', label: 'เสร็จแล้ว', value: doneCount, color: '#22c55e' },
    { key: 'progress', label: 'กำลังทำ', value: inProgress, color: '#6366f1' },
    { key: 'overdue', label: 'เลยกำหนด', value: overdueCount, color: '#ef4444' },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">รายการงาน</h1>
      <p className="mute text-sm mb-5">จดสิ่งที่ต้องทำ แล้วติ๊กเมื่อทำเสร็จ</p>

      <div className="grid gap-5 md:grid-cols-[230px_1fr] items-start">
        {/* ---------- sidebar ---------- */}
        <aside className="grid gap-4">
          <section className="card p-4" aria-label="สถิติ">
            <h2 className="font-semibold text-sm mb-3">สถิติ</h2>
            <div className="flex items-center gap-4">
              <Donut segments={segments} total={todos.length} percent={percent} />
              <div className="text-sm">
                <div className="text-2xl font-bold leading-none">{todos.length}</div>
                <div className="mute mb-1">งานทั้งหมด</div>
                <div>เสร็จแล้ว {percent}%</div>
              </div>
            </div>
            <ul className="mt-3 grid gap-1 text-xs">
              {segments.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1">{s.label}</span>
                  <b>{s.value}</b>
                </li>
              ))}
            </ul>
          </section>

          <nav className="card p-2 flex md:flex-col gap-1 overflow-x-auto nowrap-scroll" aria-label="หมวดหมู่">
            <button className="side" aria-pressed={catFilter === 'all'} onClick={() => setCatFilter('all')}>
              <span>ทุกหมวด</span>
              <span className="cnt">{todos.length}</span>
            </button>
            {CAT_ORDER.map((c) => (
              <button key={c} className="side" aria-pressed={catFilter === c} onClick={() => setCatFilter(c)}>
                <span>{CATS[c]}</span>
                <span className="cnt">{todos.filter((t) => t.category === c).length}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ---------- main column ---------- */}
        <div>
          <div className="card p-3 mb-4 grid gap-2">
            <input
              className="field px-3 py-2.5 min-w-0"
              placeholder="เพิ่มงานใหม่..."
              aria-label="งานใหม่"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <div className="flex flex-wrap gap-2">
              <select className="field px-2 py-2 flex-1 min-w-[6rem]" aria-label="หมวดหมู่" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CAT_ORDER.map((c) => <option key={c} value={c}>{CATS[c]}</option>)}
              </select>
              <select className="field px-2 py-2 flex-1 min-w-[6rem]" aria-label="ระดับความสำคัญ" value={prio} onChange={(e) => setPrio(e.target.value)}>
                {PRIO_ORDER.map((p) => <option key={p} value={p}>{PRIO[p]}</option>)}
              </select>
              <input type="date" className="field px-2 py-2 flex-1 min-w-[9rem]" aria-label="วันครบกำหนด" value={due} onChange={(e) => setDue(e.target.value)} />
              <button className="acc rounded-lg px-4 py-2 flex items-center justify-center gap-1.5 font-medium flex-1 sm:flex-none" onClick={add}>
                <Plus size={18} /> เพิ่ม
              </button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={16} className="mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              className="field w-full pl-9 pr-3 py-2.5"
              placeholder="ค้นหางาน..."
              aria-label="ค้นหางาน"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mb-4 flex-wrap" role="tablist">
            {FILTERS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className="tab card px-3.5 py-1.5 text-sm font-medium">
                {label}
              </button>
            ))}
          </div>

          <div>
            {shown.length === 0 && (
              <div className="card p-8 text-center mute">
                {q ? `ไม่พบงานที่ตรงกับ “${query.trim()}”` : 'ยังไม่มีงานในรายการนี้'}
              </div>
            )}
            {shown.map((t) => {
              const ds = dueState(t)
              return (
                <div key={t.id} className={'row' + (leaving.includes(t.id) ? ' out' : '')}>
                  <div>
                    <div className="card px-3 py-3">
                      <div className="flex items-center gap-3">
                        <button className="chk" role="checkbox" aria-checked={t.done} aria-label="ทำเสร็จแล้ว" onClick={() => patch(t.id, { done: !t.done })}>
                          {t.done && <Check size={16} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          {editId === t.id ? (
                            <input
                              autoFocus
                              className="field w-full px-2 py-1"
                              aria-label="แก้ไขงาน"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit()
                                if (e.key === 'Escape') setEditId(null)
                              }}
                            />
                          ) : (
                            <span
                              title="ดับเบิลคลิกเพื่อแก้ไข"
                              onDoubleClick={() => startEdit(t)}
                              className={'block break-words cursor-text ' + (t.done ? 'line-through mute' : '')}
                            >
                              {t.text}
                            </span>
                          )}
                        </div>
                        <button className="mute p-1.5 flex-none" aria-label="แก้ไข" onClick={() => startEdit(t)}>
                          <Pencil size={16} />
                        </button>
                        <button className="p-1.5 flex-none" style={{ color: 'var(--hi-fg)' }} aria-label="ลบ" onClick={() => remove(t.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2 pl-9">
                        <button
                          className={`c-${t.category} rounded-full px-2.5 py-0.5 text-xs font-semibold`}
                          title="กดเพื่อเปลี่ยนหมวดหมู่"
                          onClick={() => patch(t.id, { category: next(CAT_ORDER, t.category) })}
                        >
                          {CATS[t.category]}
                        </button>
                        <button
                          className={`b-${t.priority} rounded-full px-2.5 py-0.5 text-xs font-semibold`}
                          title="กดเพื่อเปลี่ยนระดับ"
                          onClick={() => patch(t.id, { priority: next(PRIO_ORDER, t.priority) })}
                        >
                          {PRIO[t.priority]}
                        </button>
                        {ds && (
                          <span className={`d-${ds} rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1`}>
                            <Calendar size={12} />
                            {ds === 'overdue' ? `เลยกำหนด ${fmtDate(t.due)}` : ds === 'today' ? 'ครบกำหนดวันนี้' : fmtDate(t.due)}
                          </span>
                        )}
                        <input
                          type="date"
                          className="date-in"
                          aria-label="เปลี่ยนวันครบกำหนด"
                          value={t.due}
                          onChange={(e) => patch(t.id, { due: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="mute">เหลืออีก {remaining} งาน</span>
            <button className="mute underline disabled:opacity-40 disabled:no-underline" disabled={doneCount === 0} onClick={clearDone}>
              ล้างงานที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
