import { useState, useEffect } from 'react'
import './DiscordChat.css'
import perfilSnowless from '../../assets/images/outros/decoracoes/perfil.jpg'

const messages = [
  { id: 1, user: 'You',      avatar: 'Y', color: '#7289da', text: 'Hey! I\'d like to order a thumbnail 👋',          delay: 0.2 },
  { id: 2, user: 'Snowless', avatar: null, color: '#66a4db', text: 'Hey! Of course, I\'d love to help 🎨',           delay: 1.1 },
  { id: 3, user: 'You',      avatar: 'Y', color: '#7289da', text: 'It\'s for a Minecraft video, epic style!',        delay: 2.0 },
  { id: 4, user: 'Snowless', avatar: null, color: '#66a4db', text: 'Perfect! Let\'s talk details and get started 🔥', delay: 2.9 },
]

export default function DiscordChat() {
  const [key, setKey] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setKey(k => k + 1), 7000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="dc-wrap" key={key}>
      <div className="dc-header">
        <img src={perfilSnowless} className="dc-header-avatar dc-header-avatar-img" alt="Snowless" />
        <span className="dc-header-name">Snowless</span>
        <span className="dc-header-tag">commission</span>
      </div>

      <div className="dc-messages">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className="dc-message"
            style={{ animationDelay: `${msg.delay}s` }}
          >
            {msg.avatar === null
              ? <img src={perfilSnowless} className="dc-avatar dc-avatar-img" alt="Snowless" />
              : <div className="dc-avatar" style={{ background: msg.color }}>{msg.avatar}</div>
            }
            <div className="dc-content">
              <div className="dc-meta">
                <span className="dc-username" style={{ color: msg.color }}>{msg.user}</span>
                <span className="dc-time">Today at {['10:00', '10:01', '10:02', '10:02'][i]}</span>
              </div>
              <p className="dc-text">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
