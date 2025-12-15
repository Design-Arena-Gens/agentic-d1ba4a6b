'use client'

import { useState, useEffect } from 'react'

interface Habit {
  id: string
  name: string
  importance: number
  logs: { date: string; minutes: number }[]
}

interface GratitudeEntry {
  id: string
  date: string
  prompt: string
  entry: string
}

const GRATITUDE_PROMPTS = [
  "Write one thing you're grateful for today",
  "What made you smile today?",
  "Who said something that brightened your day?",
  "What small moment brought you joy?",
  "What's something positive that happened today?",
  "Who are you thankful for and why?",
  "What accomplishment are you proud of today?",
  "What beauty did you notice today?",
  "What challenge helped you grow?",
  "What comfort or pleasure did you enjoy today?"
]

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([])
  const [isPremium, setIsPremium] = useState(false)

  const [activeView, setActiveView] = useState<'tracker' | 'gratitude' | 'reports' | 'history'>('tracker')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [todayPrompt, setTodayPrompt] = useState('')
  const [gratitudeText, setGratitudeText] = useState('')
  const [showGratitudePrompt, setShowGratitudePrompt] = useState(false)

  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitImportance, setNewHabitImportance] = useState(5)
  const [aiEvaluation, setAiEvaluation] = useState<string>('')
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('habits')
    if (stored) setHabits(JSON.parse(stored))

    const storedGratitude = localStorage.getItem('gratitude')
    if (storedGratitude) setGratitudeEntries(JSON.parse(storedGratitude))

    const storedPremium = localStorage.getItem('premium')
    if (storedPremium) setIsPremium(JSON.parse(storedPremium))

    const today = new Date().toDateString()
    const lastPromptDate = localStorage.getItem('lastPromptDate')

    if (lastPromptDate !== today) {
      const randomPrompt = GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]
      setTodayPrompt(randomPrompt)
      localStorage.setItem('lastPromptDate', today)
      localStorage.setItem('todayPrompt', randomPrompt)
      setShowGratitudePrompt(true)
    } else {
      const stored = localStorage.getItem('todayPrompt')
      if (stored) {
        setTodayPrompt(stored)
        const todayEntry = JSON.parse(localStorage.getItem('gratitude') || '[]').find(
          (e: GratitudeEntry) => new Date(e.date).toDateString() === today
        )
        setShowGratitudePrompt(!todayEntry)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  useEffect(() => {
    localStorage.setItem('gratitude', JSON.stringify(gratitudeEntries))
  }, [gratitudeEntries])

  const addHabit = () => {
    if (!newHabitName.trim()) return

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      importance: newHabitImportance,
      logs: []
    }

    setHabits([...habits, habit].sort((a, b) => b.importance - a.importance))
    setNewHabitName('')
    setNewHabitImportance(5)
    setShowAddHabit(false)
  }

  const logHabitTime = (habitId: string, minutes: number) => {
    const today = new Date().toISOString().split('T')[0]

    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const existingLog = habit.logs.find(log => log.date === today)
        if (existingLog) {
          return {
            ...habit,
            logs: habit.logs.map(log =>
              log.date === today ? { ...log, minutes: log.minutes + minutes } : log
            )
          }
        } else {
          return {
            ...habit,
            logs: [...habit.logs, { date: today, minutes }]
          }
        }
      }
      return habit
    }))
  }

  const deleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId))
  }

  const submitGratitude = () => {
    if (!gratitudeText.trim()) return

    const entry: GratitudeEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      prompt: todayPrompt,
      entry: gratitudeText
    }

    setGratitudeEntries([entry, ...gratitudeEntries])
    setGratitudeText('')
    setShowGratitudePrompt(false)
  }

  const getAIEvaluation = async () => {
    if (!isPremium) {
      alert('AI Evaluations are a premium feature. Upgrade to Premium to unlock!')
      return
    }

    setLoadingAI(true)
    setAiEvaluation('')

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habits })
      })

      const data = await response.json()
      setAiEvaluation(data.evaluation)
    } catch (error) {
      setAiEvaluation('Failed to generate evaluation. Please try again.')
    }

    setLoadingAI(false)
  }

  const calculateStats = (period: 'week' | 'month' | 'year') => {
    const now = new Date()
    const cutoff = new Date()

    if (period === 'week') cutoff.setDate(now.getDate() - 7)
    if (period === 'month') cutoff.setMonth(now.getMonth() - 1)
    if (period === 'year') cutoff.setFullYear(now.getFullYear() - 1)

    const stats = habits.map(habit => {
      const periodLogs = habit.logs.filter(log => new Date(log.date) >= cutoff)
      const totalMinutes = periodLogs.reduce((sum, log) => sum + log.minutes, 0)
      const totalDays = periodLogs.length

      return {
        name: habit.name,
        totalMinutes,
        totalDays,
        avgMinutesPerDay: totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0
      }
    })

    return stats
  }

  const getTodayLog = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0]
    const log = habit.logs.find(l => l.date === today)
    return log ? log.minutes : 0
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🎯 Habit Tracker</h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Build better habits, track your progress, practice gratitude</p>

        <div className="header-actions">
          <button className="button" onClick={() => setActiveView('tracker')}>
            📊 Tracker
          </button>
          <button className="button" onClick={() => setActiveView('gratitude')}>
            🙏 Gratitude
          </button>
          <button className="button" onClick={() => setActiveView('reports')}>
            📈 Reports
          </button>
          <button className="button" onClick={() => setActiveView('history')}>
            📜 History
          </button>
          <button
            className={`button ${isPremium ? 'button-secondary' : ''}`}
            onClick={() => {
              setIsPremium(!isPremium)
              localStorage.setItem('premium', JSON.stringify(!isPremium))
            }}
          >
            {isPremium ? '⭐ Premium Active' : '⬆️ Upgrade to Premium'}
          </button>
        </div>
      </div>

      {showGratitudePrompt && (
        <div className="gratitude-prompt">
          <h3>✨ Daily Reflection</h3>
          <p>{todayPrompt}</p>
          <textarea
            className="textarea"
            value={gratitudeText}
            onChange={(e) => setGratitudeText(e.target.value)}
            placeholder="Take a moment to reflect..."
            style={{ marginTop: '15px' }}
          />
          <button className="button" onClick={submitGratitude}>
            Submit Reflection
          </button>
          <button
            className="button button-secondary"
            onClick={() => setShowGratitudePrompt(false)}
            style={{ marginLeft: '10px' }}
          >
            Skip for Now
          </button>
        </div>
      )}

      {activeView === 'tracker' && (
        <div className="card">
          <h2>Today's Habits</h2>

          <button className="button" onClick={() => setShowAddHabit(true)}>
            ➕ Add New Habit
          </button>

          <div style={{ marginTop: '25px' }}>
            {habits.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '30px' }}>
                No habits yet. Add your first habit to get started!
              </p>
            ) : (
              habits.map(habit => (
                <div key={habit.id} className="habit-item">
                  <div className="habit-header">
                    <span className="habit-name">{habit.name}</span>
                    <span className="habit-importance">
                      Priority: {habit.importance}/10
                    </span>
                  </div>

                  <p style={{ color: '#6b7280', marginBottom: '10px' }}>
                    Today: {getTodayLog(habit)} minutes
                  </p>

                  <div className="habit-actions">
                    <button
                      className="button button-small"
                      onClick={() => logHabitTime(habit.id, 15)}
                    >
                      +15 min
                    </button>
                    <button
                      className="button button-small"
                      onClick={() => logHabitTime(habit.id, 30)}
                    >
                      +30 min
                    </button>
                    <button
                      className="button button-small"
                      onClick={() => logHabitTime(habit.id, 60)}
                    >
                      +60 min
                    </button>
                    <button
                      className="button button-danger button-small"
                      onClick={() => deleteHabit(habit.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {isPremium && habits.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <button
                className="button button-secondary"
                onClick={getAIEvaluation}
                disabled={loadingAI}
              >
                🤖 Get AI Evaluation
                <span className="premium-badge">PREMIUM</span>
              </button>

              {loadingAI && <div className="loading">Analyzing your habits...</div>}

              {aiEvaluation && (
                <div className="ai-evaluation">
                  <h4>AI Insights & Recommendations</h4>
                  <p>{aiEvaluation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeView === 'gratitude' && (
        <div className="card">
          <h2>🙏 Gratitude Journal</h2>

          {gratitudeEntries.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '30px' }}>
              No gratitude entries yet. Complete your daily prompt to get started!
            </p>
          ) : (
            gratitudeEntries.slice(0, 20).map(entry => (
              <div key={entry.id} className="history-item">
                <div className="history-date">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <p style={{ color: '#764ba2', fontStyle: 'italic', marginBottom: '8px' }}>
                  {entry.prompt}
                </p>
                <p style={{ color: '#374151' }}>{entry.entry}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeView === 'reports' && (
        <div className="card">
          <h2>📈 Progress Reports</h2>

          <div className="tab-buttons">
            <button
              className="tab-button active"
              onClick={() => {}}
            >
              All Periods
            </button>
          </div>

          <h3 style={{ color: '#667eea', marginTop: '20px', marginBottom: '15px' }}>
            📅 Weekly Report (Last 7 Days)
          </h3>
          <div className="stats-grid">
            {calculateStats('week').map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-value">{stat.totalMinutes}</div>
                <div className="stat-label">{stat.name}</div>
                <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
                  {stat.totalDays} days • {stat.avgMinutesPerDay} min/day
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ color: '#667eea', marginTop: '30px', marginBottom: '15px' }}>
            📅 Monthly Report (Last 30 Days)
          </h3>
          <div className="stats-grid">
            {calculateStats('month').map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-value">{stat.totalMinutes}</div>
                <div className="stat-label">{stat.name}</div>
                <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
                  {stat.totalDays} days • {stat.avgMinutesPerDay} min/day
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ color: '#667eea', marginTop: '30px', marginBottom: '15px' }}>
            📅 Yearly Report (Last 365 Days)
          </h3>
          <div className="stats-grid">
            {calculateStats('year').map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-value">{stat.totalMinutes}</div>
                <div className="stat-label">{stat.name}</div>
                <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
                  {stat.totalDays} days • {stat.avgMinutesPerDay} min/day
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <div className="card">
          <h2>📜 Complete History</h2>

          <h3 style={{ color: '#667eea', marginTop: '20px', marginBottom: '15px' }}>
            Habit Logs
          </h3>

          {habits.map(habit => (
            <div key={habit.id} style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#374151', marginBottom: '10px' }}>{habit.name}</h4>
              {habit.logs.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No logs yet</p>
              ) : (
                habit.logs
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((log, idx) => (
                    <div key={idx} className="history-item">
                      <span className="history-date">{log.date}</span>
                      <span style={{ color: '#374151' }}> - {log.minutes} minutes</span>
                    </div>
                  ))
              )}
            </div>
          ))}

          <h3 style={{ color: '#667eea', marginTop: '30px', marginBottom: '15px' }}>
            Gratitude History
          </h3>

          {gratitudeEntries.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No gratitude entries yet</p>
          ) : (
            gratitudeEntries.slice(0, 30).map(entry => (
              <div key={entry.id} className="history-item">
                <div className="history-date">
                  {new Date(entry.date).toLocaleDateString()}
                </div>
                <p style={{ color: '#764ba2', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '5px' }}>
                  {entry.prompt}
                </p>
                <p style={{ color: '#374151' }}>{entry.entry}</p>
              </div>
            ))
          )}
        </div>
      )}

      {showAddHabit && (
        <div className="modal-overlay" onClick={() => setShowAddHabit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Habit</h3>

            <div className="form-group">
              <label>Habit Name</label>
              <input
                type="text"
                className="input"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g., Morning meditation"
              />
            </div>

            <div className="form-group">
              <label>Importance (1-10)</label>
              <input
                type="number"
                className="input"
                min="1"
                max="10"
                value={newHabitImportance}
                onChange={(e) => setNewHabitImportance(parseInt(e.target.value) || 5)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="button" onClick={addHabit}>
                Add Habit
              </button>
              <button className="button button-secondary" onClick={() => setShowAddHabit(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
