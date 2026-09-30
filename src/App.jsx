import { useState, useRef } from 'react'
import { Plus, Check, Pencil, Trash2 } from 'lucide-react'

const PRIO = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง' }
const ORDER = ['low', 'medium', 'high']
const FILTERS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['done', 'เสร็จแล้ว'],
]

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'ซื้อของเข้าบ้าน', done: false, priority: 'medium' },
    { id: 2, text: 'ส่งรายงานให้หัวหน้า', done: false, priority: 'high' },
    { id: 3, text: 'อ่านหนังสือ 20 นาที', done: true, priority: 'low' },
  ])
  const [text, setText] = useState('')
  const [prio, setPrio] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [leaving, setLeaving] = useState([])
  const nextId = useRef(4)

  const add = () => {
    const t = text.trim()
    if (!t) return
    setTodos([{ id: nextId.current++, text: t, done: false, priority: prio }, ...todos])
    setText('')
  }

  const toggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const cyclePriority = (id) =>
    setTodos(
      todos.map((t) =>
        t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] } : t
      )
    )

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
    if (v) setTodos(todos.map((t) => (t.id === editId ? { ...t, text: v } : t)))
    setEditId(null)
  }

  const clearDone = () => todos.filter((t) => t.done).forEach((t) => remove(t.id))

  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.length - remaining
  const shown = todos.filter(
    (t) => filter === 'all' || (filter === 'active' ? !t.done : t.done)
  )

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">รายการงาน</h1>
      <p className="mute text-sm mb-5">จดสิ่งที่ต้องทำ แล้วติ๊กเมื่อทำเสร็จ</p>

      <div className="card p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <input
          className="field flex-1 px-3 py-2.5 min-w-0"
          placeholder="เพิ่มงานใหม่..."
          aria-label="งานใหม่"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <div className="flex gap-2">
          <select
            className="field px-2 py-2.5 flex-1 sm:flex-none"
            aria-label="ระดับความสำคัญ"
            value={prio}
            onChange={(e) => setPrio(e.target.value)}
          >
            {ORDER.map((p) => (
              <option key={p} value={p}>{PRIO[p]}</option>
            ))}
          </select>
          <button
            className="acc rounded-lg px-4 py-2.5 flex items-center gap-1.5 font-medium"
            onClick={add}
          >
            <Plus size={18} /> เพิ่ม
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4" role="tablist">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={filter === k}
            onClick={() => setFilter(k)}
            className="tab card px-3.5 py-1.5 text-sm font-medium"
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        {shown.length === 0 && (
          <div className="card p-8 text-center mute">ยังไม่มีงานในรายการนี้</div>
        )}
        {shown.map((t) => (
          <div key={t.id} className={'row' + (leaving.includes(t.id) ? ' out' : '')}>
            <div>
              <div className="card px-3 py-3 flex items-center gap-3">
                <button
                  className="chk"
                  role="checkbox"
                  aria-checked={t.done}
                  aria-label="ทำเสร็จแล้ว"
                  onClick={() => toggle(t.id)}
                >
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

                <button
                  className={`b-${t.priority} rounded-full px-2.5 py-0.5 text-xs font-semibold flex-none`}
                  title="กดเพื่อเปลี่ยนระดับ"
                  onClick={() => cyclePriority(t.id)}
                >
                  {PRIO[t.priority]}
                </button>
                <button className="mute p-1.5 flex-none" aria-label="แก้ไข" onClick={() => startEdit(t)}>
                  <Pencil size={16} />
                </button>
                <button
                  className="p-1.5 flex-none"
                  style={{ color: 'var(--hi-fg)' }}
                  aria-label="ลบ"
                  onClick={() => remove(t.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="mute">เหลืออีก {remaining} งาน</span>
        <button
          className="mute underline disabled:opacity-40 disabled:no-underline"
          disabled={doneCount === 0}
          onClick={clearDone}
        >
          ล้างงานที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
        </button>
      </div>
    </main>
  )
}
